import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  const errorMsg = 
    "\n=================================================================\n" +
    "LỖI CẤU HÌNH HỆ THỐNG / CONFIGURATION ERROR:\n" +
    "Thiếu biến môi trường Supabase! Vui lòng thiết lập các biến sau:\n" +
    "  - SUPABASE_URL\n" +
    "  - SUPABASE_SERVICE_ROLE_KEY\n" +
    "vào file .env trước khi chạy ứng dụng.\n" +
    "=================================================================\n";
  console.error(errorMsg);
  
  throw new Error("Missing Supabase configuration environment variables.");
}

// Export the client
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
