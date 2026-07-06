import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const unitIds = {
  command: "10000000-0000-4000-8000-000000000001",
  mobile: "10000000-0000-4000-8000-000000000002"
};

const units = [
  {
    id: unitIds.command,
    name: "Ban CHQS xã Yên Thế",
    type: "Ban Chỉ huy Quân sự",
    parent_unit_id: null,
    description: "Cơ quan quân sự địa phương xã Yên Thế"
  },
  {
    id: unitIds.mobile,
    name: "Trung đội dân quân cơ động",
    type: "Trung đội",
    parent_unit_id: unitIds.command,
    description: "Lực lượng dân quân cơ động"
  }
];

const demoUsers = [
  {
    seedId: "00000000-0000-4000-8000-000000000001",
    full_name: "Quản trị viên",
    email: "admin@example.com",
    phone: "0900000001",
    password: "Admin@123456",
    role: "admin",
    unit_id: unitIds.command
  },
  {
    seedId: "00000000-0000-4000-8000-000000000002",
    full_name: "Trần Đức Cường",
    email: "cuong@example.com",
    phone: "0912345678",
    password: "Demo@123456",
    role: "political_officer",
    unit_id: unitIds.command
  },
  {
    seedId: "00000000-0000-4000-8000-000000000003",
    full_name: "Giáo viên demo",
    email: "instructor@example.com",
    phone: "0900000003",
    password: "Demo@123456",
    role: "instructor",
    unit_id: unitIds.command
  },
  {
    seedId: "00000000-0000-4000-8000-000000000004",
    full_name: "Học viên demo",
    email: "member@example.com",
    phone: "0900000004",
    password: "Demo@123456",
    role: "member",
    unit_id: unitIds.mobile
  }
];

const { error: unitError } = await supabase.from("units").upsert(units, { onConflict: "id" });
if (unitError) throw new Error(`Cannot seed units: ${unitError.message}`);

for (const demoUser of demoUsers) {
  const { data: existing, error: findError } = await supabase
    .from("users")
    .select("id")
    .eq("email", demoUser.email)
    .maybeSingle();
  if (findError) throw new Error(`Cannot check ${demoUser.email}: ${findError.message}`);

  const password_hash = await bcrypt.hash(demoUser.password, 12);
  const { error } = await supabase.from("users").upsert({
    id: existing?.id || demoUser.seedId,
    full_name: demoUser.full_name,
    email: demoUser.email,
    phone: demoUser.phone,
    password_hash,
    role: demoUser.role,
    unit_id: demoUser.unit_id,
    account_status: "active",
    must_change_password: false,
    updated_at: new Date().toISOString()
  }, { onConflict: "email" });

  if (error) throw new Error(`Cannot seed ${demoUser.email}: ${error.message}`);
  console.log(`Seeded ${demoUser.email}`);
}

console.log("Demo users are ready.");
