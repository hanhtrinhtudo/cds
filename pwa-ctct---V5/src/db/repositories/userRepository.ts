import { supabase } from "../supabaseClient";
import { AccountStatus, User, UserAuthRecord, UserRole } from "../../types";

const USER_COLUMNS = "id,full_name,email,phone,unit_id,role,account_status,must_change_password,created_at,updated_at,last_login_at";
const AUTH_COLUMNS = `${USER_COLUMNS},password_hash`;

export const userRepository = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data || []).map(mapDbUser);
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch user: ${error.message}`);
    return data ? mapDbUser(data) : null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch user by email: ${error.message}`);
    return data ? mapDbUser(data) : null;
  },

  async getAuthUserByLogin(login: string): Promise<UserAuthRecord | null> {
    const normalized = login.trim().toLowerCase();
    const column = normalized.includes("@") ? "email" : "phone";
    const value = column === "email" ? normalized : login.trim();
    const { data, error } = await supabase
      .from("users")
      .select(AUTH_COLUMNS)
      .eq(column, value)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch auth user: ${error.message}`);
    return data ? mapDbAuthUser(data) : null;
  },

  async addUser(user: User, passwordHash: string): Promise<User> {
    const dbUser = { ...mapUserToDb(user), password_hash: passwordHash };
    const { data, error } = await supabase
      .from("users")
      .insert([dbUser])
      .select(USER_COLUMNS)
      .single();

    if (error) throw new Error(`Failed to add user: ${error.message}`);
    return mapDbUser(data);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const dbUpdates = {
      ...mapPartialUserToDb(updates),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from("users")
      .update(dbUpdates)
      .eq("id", id)
      .select(USER_COLUMNS)
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return mapDbUser(data);
  },

  async updatePassword(id: string, passwordHash: string, mustChangePassword: boolean): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        must_change_password: mustChangePassword,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update password: ${error.message}`);
  }
};

function mapDbUser(row: any): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || "",
    avatar: "",
    unitId: row.unit_id || "",
    role: row.role as UserRole,
    accountStatus: row.account_status as AccountStatus,
    mustChangePassword: !!row.must_change_password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || ""
  };
}

function mapDbAuthUser(row: any): UserAuthRecord {
  return {
    ...mapDbUser(row),
    passwordHash: row.password_hash
  };
}

function mapUserToDb(user: User): any {
  return {
    id: user.id,
    full_name: user.fullName,
    email: user.email.toLowerCase(),
    phone: user.phone,
    unit_id: user.unitId || null,
    role: user.role,
    account_status: user.accountStatus,
    must_change_password: !!user.mustChangePassword,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    last_login_at: user.lastLoginAt || null
  };
}

function mapPartialUserToDb(updates: Partial<User>): any {
  const db: any = {};
  if (updates.fullName !== undefined) db.full_name = updates.fullName;
  if (updates.email !== undefined) db.email = updates.email.toLowerCase();
  if (updates.phone !== undefined) db.phone = updates.phone;
  if (updates.unitId !== undefined) db.unit_id = updates.unitId || null;
  if (updates.role !== undefined) db.role = updates.role;
  if (updates.accountStatus !== undefined) db.account_status = updates.accountStatus;
  if (updates.mustChangePassword !== undefined) db.must_change_password = updates.mustChangePassword;
  if (updates.updatedAt !== undefined) db.updated_at = updates.updatedAt;
  if (updates.lastLoginAt !== undefined) db.last_login_at = updates.lastLoginAt;
  return db;
}
