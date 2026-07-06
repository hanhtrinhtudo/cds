import { AccountStatus, User, UserRole } from "../types";
import { apiClient } from "./apiClient";

type LoginResponse = { message: string; token: string; user: User };
type LegacyAuthAction =
  | "register"
  | "login"
  | "me"
  | "log"
  | "admin_set_role"
  | "admin_set_status"
  | "admin_list_users"
  | "admin_list_audit";

type RegisterInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  unitId?: string;
  name?: string;
  username?: string;
  unit?: string;
};

const LEGACY_AUTH_MODE = import.meta.env.VITE_AUTH_MODE === "legacy_apps_script";
const LEGACY_AUTH_API_URL = (import.meta.env.VITE_LEGACY_AUTH_API_URL || "").trim();

const persistLogin = (res: LoginResponse): { message: string; user: User } => {
  apiClient.setAuthToken(res.token);
  localStorage.setItem("current_user", JSON.stringify(res.user));
  return { message: res.message, user: res.user };
};

const persistLegacyLogin = (res: LoginResponse): { message: string; user: User } => {
  const userJson = JSON.stringify(res.user);
  localStorage.setItem("ctct_token", res.token);
  localStorage.setItem("ctct_user", userJson);
  localStorage.setItem("ptkv3_token", res.token);
  localStorage.setItem("ptkv3_user", userJson);
  try {
    sessionStorage.setItem(
      "ptkv3:auth",
      JSON.stringify({
        userId: res.user.id || "",
        username: res.user.email || res.user.phone || res.user.id || "",
        fullName: res.user.fullName || "",
        unit: res.user.unitId || "",
      })
    );
  } catch {
    // sessionStorage may be blocked; a valid login should still continue.
  }
  return persistLogin(res);
};

const mapLegacyRole = (role: unknown): UserRole => {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return UserRole.ADMIN;
  if (["chi-huy", "chỉ huy", "officer", "political_officer"].includes(normalized)) return UserRole.POLITICAL_OFFICER;
  if (["instructor", "giang-vien", "giảng viên"].includes(normalized)) return UserRole.INSTRUCTOR;
  return UserRole.MEMBER;
};

const mapLegacyStatus = (status: unknown): AccountStatus => {
  const normalized = String(status || "").trim().toLowerCase();
  if (["suspended", "locked", "khóa", "khoa"].includes(normalized)) return AccountStatus.SUSPENDED;
  if (["rejected", "denied", "từ chối", "tu choi"].includes(normalized)) return AccountStatus.REJECTED;
  if (["pending", "chờ duyệt", "cho duyet"].includes(normalized)) return AccountStatus.PENDING;
  return AccountStatus.ACTIVE;
};

const pickLegacyUser = (payload: any): any => {
  return payload?.user || payload?.data?.user || payload?.data || payload?.profile || payload;
};

const normalizeLegacyUser = (payload: any): User => {
  const raw = pickLegacyUser(payload);
  const now = new Date().toISOString();
  const login = raw?.username || raw?.["Tài khoản"] || raw?.taiKhoan || raw?.account || raw?.email || raw?.phone || "";
  return {
    id: String(raw?.id || raw?.ID || raw?.userId || login || `legacy_${Date.now()}`),
    fullName: String(raw?.fullName || raw?.name || raw?.["Họ và tên"] || raw?.hoTen || raw?.displayName || login || "Người dùng"),
    email: String(raw?.email || (String(login).includes("@") ? login : "")),
    phone: String(raw?.phone || (!String(login).includes("@") ? login : "")),
    avatar: "",
    unitId: String(raw?.unitId || raw?.unit || raw?.["Đơn vị"] || raw?.donVi || ""),
    role: mapLegacyRole(raw?.role || raw?.["Vai trò"] || raw?.vaiTro),
    accountStatus: mapLegacyStatus(raw?.status || raw?.["Trạng thái"] || raw?.trangThai),
    mustChangePassword: Boolean(raw?.mustChangePassword || raw?.must_change_password),
    createdAt: String(raw?.createdAt || raw?.["Ngày tạo"] || raw?.ngayTao || now),
    updatedAt: String(raw?.updatedAt || raw?.["Cập nhật"] || raw?.capNhat || now),
    lastLoginAt: String(raw?.lastLoginAt || now),
  };
};

const legacyRequest = async (action: LegacyAuthAction, payload: Record<string, any> = {}) => {
  if (!LEGACY_AUTH_API_URL) {
    throw new Error("Thiếu VITE_LEGACY_AUTH_API_URL cho chế độ legacy_apps_script.");
  }

  const url = new URL(LEGACY_AUTH_API_URL);
  url.searchParams.set("action", action);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Apps Script trả về dữ liệu không phải JSON.");
  }
  if (json?.ok === false || json?.success === false || json?.error) {
    throw new Error(json.error || json.message || "Yêu cầu Apps Script thất bại.");
  }
  return json;
};

const tokenFromLegacy = (payload: any): string => {
  return String(payload?.token || payload?.sessionToken || payload?.session || payload?.data?.token || "");
};

export const authService = {
  async register(data: RegisterInput): Promise<{ message: string; user: User }> {
    if (!data.password) throw new Error("Vui lòng nhập mật khẩu để đăng ký tài khoản.");
    if (LEGACY_AUTH_MODE) {
      const name = data.name || data.fullName || "";
      const username = data.username || data.email || data.phone || "";
      const unit = data.unit || data.unitId || "";
      const payload = await legacyRequest("register", {
        name,
        username,
        unit,
        password: data.password,
      });
      return { message: payload.message || "Tạo tài khoản thành công. Vui lòng đăng nhập.", user: normalizeLegacyUser(payload) };
    }
    return apiClient.post<{ message: string; user: User }>("/api/auth/register", data);
  },

  async login(emailOrPhone: string, password?: string): Promise<{ message: string; user: User }> {
    if (!password) throw new Error("Vui lòng nhập mật khẩu.");
    if (LEGACY_AUTH_MODE) {
      const payload = await legacyRequest("login", { username: emailOrPhone, account: emailOrPhone, password });
      const token = tokenFromLegacy(payload);
      if (!token) throw new Error("Apps Script không trả về token phiên đăng nhập.");
      const user = normalizeLegacyUser(payload);
      if (user.accountStatus !== AccountStatus.ACTIVE) throw new Error("Tài khoản chưa hoạt động.");
      return persistLegacyLogin({ message: payload.message || "Đăng nhập thành công.", token, user });
    }

    const res = await apiClient.post<LoginResponse>("/api/auth/login", { emailOrPhone, password });
    apiClient.setAuthToken(res.token);
    try {
      const user = await apiClient.get<User>("/api/auth/me");
      return persistLogin({ ...res, user });
    } catch (error) {
      apiClient.clearAuthToken();
      localStorage.removeItem("current_user");
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; user: User }> {
    const res = await apiClient.post<LoginResponse>("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return persistLogin(res);
  },

  async me(): Promise<User | null> {
    try {
      if (!apiClient.getAuthToken()) return null;
      if (LEGACY_AUTH_MODE) {
        const payload = await legacyRequest("me", { token: apiClient.getAuthToken() });
        const user = normalizeLegacyUser(payload);
        localStorage.setItem("current_user", JSON.stringify(user));
        return user;
      }
      const user = await apiClient.get<User>("/api/auth/me");
      localStorage.setItem("current_user", JSON.stringify(user));
      return user;
    } catch {
      await this.logout();
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      if (!LEGACY_AUTH_MODE && apiClient.getAuthToken()) {
        await apiClient.post("/api/auth/logout");
      }
    } finally {
      apiClient.clearAuthToken();
      localStorage.removeItem("current_user");
      localStorage.removeItem("ctct_token");
      localStorage.removeItem("ctct_user");
      localStorage.removeItem("ptkv3_token");
      localStorage.removeItem("ptkv3_user");
      sessionStorage.removeItem("ptkv3:auth");
    }
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem("current_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};

export const isLegacyAppsScriptAuthMode = () => LEGACY_AUTH_MODE;

export default authService;
