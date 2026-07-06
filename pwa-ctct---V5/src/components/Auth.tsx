import React, { useState } from "react";
import { AccountStatus, Unit, User } from "../types";
import { authService } from "../services/authService";
import { AlertTriangle, CheckCircle, Home, Key, Shield, User as UserIcon } from "lucide-react";

interface AuthProps {
  currentUser: User | null;
  onLogin: (user: User | null) => void;
  onRegister: (userData: any) => void;
  units: Unit[];
}

export default function Auth({ currentUser, onLogin, units }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regUnit, setRegUnit] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    if (tab === "login") setSuccessMsg("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }

    authService
      .login(username.trim(), password)
      .then((res) => onLogin(res.user))
      .catch((err: any) => {
        setError(err.message || "Không thể đăng nhập.");
      });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const name = regName.trim();
    const account = regUsername.trim();
    const unit = regUnit.trim();

    if (!name) {
      setError("Vui lòng nhập họ tên.");
      return;
    }
    if (!account) {
      setError("Vui lòng nhập tài khoản đăng nhập.");
      return;
    }
    if (!unit) {
      setError("Vui lòng nhập đơn vị.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError("Mật khẩu phải ít nhất 6 ký tự.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    authService
      .register({
        name,
        username: account,
        unit,
        password: regPassword,
      })
      .then(() => {
        setSuccessMsg("Tạo tài khoản thành công. Vui lòng đăng nhập.");
        setActiveTab("login");
        setRegName("");
        setRegUsername("");
        setRegUnit("");
        setRegPassword("");
        setRegConfirmPassword("");
      })
      .catch((err: any) => {
        setError(err.message || "Không thể đăng ký.");
      });
  };

  const handleRequiredPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !newPassword) {
      setError("Vui lòng nhập mật khẩu tạm thời và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không trùng khớp.");
      return;
    }
    try {
      const res = await authService.changePassword(password, newPassword);
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || "Không thể đổi mật khẩu.");
    }
  };

  if (currentUser && currentUser.accountStatus === AccountStatus.PENDING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 text-center" id="auth-pending-screen">
        <div className="p-4 bg-amber-50 text-amber-800 rounded-full mb-4 animate-pulse">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Đang chờ phê duyệt</h2>
        <p className="text-slate-600 max-w-md mb-6 text-sm">
          Tài khoản của đồng chí <strong>{currentUser.fullName}</strong> đã được đăng ký thành công vào đơn vị{" "}
          <strong>{units.find((u) => u.id === currentUser.unitId)?.name || currentUser.unitId}</strong>.
        </p>
        <button
          onClick={() => onLogin(null)}
          className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg text-sm hover:bg-slate-700 transition"
          id="btn-back-to-login"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <main
      className="min-h-[calc(100vh-7rem)] px-4 py-6 flex items-center justify-center bg-[radial-gradient(circle_at_top,#fff7d6_0,#fff7ed_34%,#f8fafc_70%)]"
      id="auth-container"
    >
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl shadow-red-950/10">
        <div className="relative bg-gradient-to-br from-[#A41919] via-[#8B1616] to-[#5f1010] px-6 pt-7 pb-6 text-white">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FFD966]/20 blur-sm" />
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/10 blur-sm" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FFD966]/40 bg-white/10 shadow-inner">
                <Shield className="text-[#FFD966]" size={30} />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">BAN CHỈ HUY PTKV3</h1>
                <p className="text-xs font-semibold text-[#FFE9A6]">Trung tâm Giáo dục Chính trị số</p>
              </div>
            </div>
            <p className="text-sm text-red-50">
              Đăng nhập để học tập, ôn luyện, kiểm tra nhận thức và theo dõi kết quả trên nền tảng mobile-first.
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-red-50 p-1" role="tablist">
            <button
              type="button"
              className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                activeTab === "login" ? "bg-white text-[#A41919] shadow-sm" : "text-red-700/70"
              }`}
              onClick={() => switchTab("login")}
              id="btn-switch-login"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                activeTab === "register" ? "bg-white text-[#A41919] shadow-sm" : "text-red-700/70"
              }`}
              onClick={() => switchTab("register")}
              id="btn-switch-register"
            >
              Đăng ký
            </button>
          </div>

          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              <CheckCircle className="mt-0.5 shrink-0 text-green-600" size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={16} />
              <span>{error}</span>
            </div>
          )}

          {currentUser?.mustChangePassword ? (
            <form onSubmit={handleRequiredPasswordChange} className="space-y-4" id="required-password-change-form">
              <h2 className="border-b pb-2 text-lg font-semibold text-slate-800">Đổi mật khẩu lần đầu</h2>
              <PasswordInput
                label="Mật khẩu tạm thời"
                placeholder="Nhập mật khẩu tạm thời"
                value={password}
                onChange={setPassword}
                minLength={6}
              />
              <PasswordInput
                label="Mật khẩu mới"
                placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                value={newPassword}
                onChange={setNewPassword}
                minLength={8}
              />
              <PasswordInput
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                minLength={8}
              />
              <PrimaryButton label="Đổi mật khẩu và tiếp tục" />
            </form>
          ) : activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4" id="login-form" autoComplete="on" noValidate>
              <TextInput
                label="Tài khoản"
                name="username"
                placeholder="Nhập tài khoản"
                value={username}
                onChange={setUsername}
                icon={<UserIcon size={16} />}
              />
              <PasswordInput label="Mật khẩu" placeholder="Nhập mật khẩu" value={password} onChange={setPassword} minLength={6} />

              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" className="rounded border-slate-300 text-[#A41919] focus:ring-[#A41919]" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => setError("Vui lòng liên hệ quản trị hoặc dùng chức năng khôi phục ở backend.")}
                  className="text-xs font-bold text-[#A41919] hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <PrimaryButton label="Đăng nhập" id="btn-login-submit" />
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5" id="register-form" autoComplete="on" noValidate>
              <TextInput label="Họ và tên" name="name" placeholder="Họ và tên đầy đủ" value={regName} onChange={setRegName} icon={<UserIcon size={16} />} />
              <TextInput
                label="Tài khoản đăng nhập"
                name="username"
                placeholder="Ví dụ: nguyenvana"
                value={regUsername}
                onChange={setRegUsername}
                icon={<UserIcon size={16} />}
              />
              <TextInput label="Đơn vị" name="unit" placeholder="Ví dụ: Phòng Chính trị..." value={regUnit} onChange={setRegUnit} icon={<Home size={16} />} />
              <PasswordInput label="Mật khẩu" placeholder="Tạo mật khẩu (≥ 6 ký tự)" value={regPassword} onChange={setRegPassword} minLength={6} />
              <PasswordInput
                label="Nhập lại mật khẩu"
                name="password2"
                placeholder="Nhập lại mật khẩu"
                value={regConfirmPassword}
                onChange={setRegConfirmPassword}
                minLength={6}
              />
              <PrimaryButton label="Tạo tài khoản" id="btn-register-submit" />
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  name,
  placeholder,
  value,
  onChange,
  icon,
}: {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-600">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">{icon}</span>
        <input
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A41919]/25"
          required
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  name = "password",
  placeholder,
  value,
  onChange,
  minLength,
}: {
  label: string;
  name?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  minLength: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-600">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Key size={16} />
        </span>
        <input
          name={name}
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A41919]/25"
          required
          minLength={minLength}
        />
      </div>
    </div>
  );
}

function PrimaryButton({ label, id }: { label: string; id?: string }) {
  return (
    <button
      type="submit"
      id={id}
      className="w-full rounded-xl bg-[#A41919] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-900/20 transition hover:bg-[#8B1616] active:scale-[0.99]"
    >
      {label}
    </button>
  );
}
