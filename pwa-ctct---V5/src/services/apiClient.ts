export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const TOKEN_KEY = "app_auth_token";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const LEGACY_AUTH_MODE = import.meta.env.VITE_AUTH_MODE === "legacy_apps_script";
const LEGACY_AUTH_API_URL = (import.meta.env.VITE_LEGACY_AUTH_API_URL || "").trim();

const getErrorMessage = (status: number, message?: string): string => {
  if (message) return message;
  switch (status) {
    case 400: return "Yêu cầu không hợp lệ hoặc lỗi dữ liệu đầu vào.";
    case 401: return "Đồng chí chưa đăng nhập hoặc phiên làm việc đã hết hạn.";
    case 403: return "Tài khoản của đồng chí không có quyền thực hiện chức năng này.";
    case 404: return "Không tìm thấy dữ liệu yêu cầu trên hệ thống.";
    case 500: return "Lỗi máy chủ hệ thống. Vui lòng liên hệ quản trị viên.";
    default: return "Đã xảy ra lỗi không xác định kết nối cơ sở dữ liệu.";
  }
};

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const mapLegacyRole = (role: unknown): string => {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (["chi-huy", "chỉ huy", "officer", "political_officer"].includes(normalized)) return "political_officer";
  if (["instructor", "giang-vien", "giảng viên"].includes(normalized)) return "instructor";
  return "member";
};

const mapLegacyStatus = (status: unknown): string => {
  const normalized = String(status || "").trim().toLowerCase();
  if (["suspended", "locked", "khóa", "khoa"].includes(normalized)) return "suspended";
  if (["rejected", "denied", "từ chối", "tu choi"].includes(normalized)) return "rejected";
  if (["pending", "chờ duyệt", "cho duyet"].includes(normalized)) return "pending";
  return "active";
};

const toLegacyRole = (role: unknown): string => {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (["political_officer", "officer", "chi-huy"].includes(normalized)) return "chi-huy";
  return "user";
};

const normalizeLegacyUser = (raw: any) => {
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
    lastLoginAt: String(raw?.lastLoginAt || "")
  };
};

const legacyPayloadList = (payload: any): any[] => {
  const value = payload?.users || payload?.audit || payload?.logs || payload?.data?.users || payload?.data?.audit || payload?.data || payload;
  return Array.isArray(value) ? value : [];
};

const legacyRequest = async (action: string, payload: Record<string, any> = {}) => {
  if (!LEGACY_AUTH_API_URL) throw new ApiError("Thiếu VITE_LEGACY_AUTH_API_URL cho chế độ legacy_apps_script.", 500);
  const response = await fetch(LEGACY_AUTH_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: getAuthToken(), ...payload })
  });
  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError("Apps Script trả về dữ liệu không phải JSON.", response.status || 500);
  }
  if (!response.ok || json?.ok === false || json?.success === false || json?.error) {
    throw new ApiError(json.error || json.message || "Yêu cầu Apps Script thất bại.", response.status || 500, json);
  }
  return json;
};

const legacyApiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T | undefined> => {
  if (!LEGACY_AUTH_MODE || /^https?:\/\//i.test(endpoint)) return undefined;
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : {};
  const statusMatch = endpoint.match(/^\/api\/users\/([^/]+)\/(approve|reject|suspend|reactivate)$/);
  const roleMatch = endpoint.match(/^\/api\/users\/([^/]+)\/change-role$/);

  if (method === "GET" && endpoint === "/api/users") {
    const payload = await legacyRequest("admin_list_users");
    return legacyPayloadList(payload).map(normalizeLegacyUser) as T;
  }
  if (method === "GET" && endpoint === "/api/audit-logs") {
    const payload = await legacyRequest("admin_list_audit");
    return legacyPayloadList(payload) as T;
  }
  if (method === "POST" && statusMatch) {
    const statusByAction: Record<string, string> = {
      approve: "active",
      reject: "rejected",
      suspend: "suspended",
      reactivate: "active"
    };
    const payload = await legacyRequest("admin_set_status", { id: statusMatch[1], status: statusByAction[statusMatch[2]] });
    return normalizeLegacyUser(payload?.user || payload?.data || payload) as T;
  }
  if (method === "POST" && roleMatch) {
    const payload = await legacyRequest("admin_set_role", { id: roleMatch[1], role: toLegacyRole(body.role) });
    return normalizeLegacyUser(payload?.user || payload?.data || payload) as T;
  }
  if (endpoint === "/api/auth/logout") {
    return {} as T;
  }
  return undefined;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const legacyResult = await legacyApiRequest<T>(endpoint, options);
  if (legacyResult !== undefined) return legacyResult;
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const url = /^https?:\/\//i.test(endpoint) ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // Response was not JSON
      }
      if (response.status === 401) {
        clearAuthToken();
        localStorage.removeItem("current_user");
      }
      throw new ApiError(getErrorMessage(response.status, errorData.error), response.status, errorData);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json() as T;
    }
    return {} as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.", 0, error);
  }
}

export const apiClient = {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  request,

  get<T>(endpoint: string, headers?: any): Promise<T> {
    return request<T>(endpoint, { method: "GET", headers });
  },

  post<T>(endpoint: string, data?: any, headers?: any): Promise<T> {
    return request<T>(endpoint, { method: "POST", body: data ? JSON.stringify(data) : undefined, headers });
  },

  patch<T>(endpoint: string, data?: any, headers?: any): Promise<T> {
    return request<T>(endpoint, { method: "PATCH", body: data ? JSON.stringify(data) : undefined, headers });
  },

  delete<T>(endpoint: string, headers?: any): Promise<T> {
    return request<T>(endpoint, { method: "DELETE", headers });
  }
};
