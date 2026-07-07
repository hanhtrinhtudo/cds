import React, { useState } from "react";
import { AccountStatus, Unit, User } from "../types";
import { authService } from "../services/authService";
import { AlertTriangle, CheckCircle, Home, Key, Shield, User as UserIcon } from "lucide-react";
import { Alert, AppCaption, AppHeading, AppText, Button, Input } from "./ui";

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
      .catch(() => {
        setError("Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.");
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
      .catch(() => {
        setError("Không thể tạo tài khoản. Vui lòng thử lại.");
      });
  };

  const handleRequiredPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !newPassword) {
      setError("Vui lòng nhập mật khẩu được cấp và mật khẩu mới.");
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
    } catch {
      setError("Không thể đổi mật khẩu. Vui lòng thử lại.");
    }
  };

  if (currentUser && currentUser.accountStatus === AccountStatus.PENDING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 text-center" id="auth-pending-screen">
        <div className="p-4 bg-amber-50 text-amber-800 rounded-full mb-4 motion-status-change">
          <AlertTriangle size={48} />
        </div>
        <AppHeading level="h2" variant="headingXl" className="font-bold text-[var(--app-color-text-primary)] mb-2">Đang chờ phê duyệt</AppHeading>
        <AppText className="text-[var(--app-color-text-secondary)] max-w-md mb-6">
          Tài khoản của đồng chí <strong>{currentUser.fullName}</strong> đã được đăng ký thành công vào đơn vị{" "}
          <strong>{units.find((u) => u.id === currentUser.unitId)?.name || currentUser.unitId}</strong>.
        </AppText>
        <Button type="button" onClick={() => onLogin(null)} variant="secondary" id="btn-back-to-login">
          Quay lại Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <main
      className="min-h-[calc(100vh-7rem)] px-4 py-6 flex items-center justify-center bg-[radial-gradient(circle_at_top,#fff7d6_0,#fff7ed_34%,#f8fafc_70%)]"
      id="auth-container"
    >
      <section className="app-overlay w-full max-w-md overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#A41919] via-[#8B1616] to-[#5f1010] px-6 pt-7 pb-6 text-white">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FFD966]/20 blur-sm" />
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/10 blur-sm" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FFD966]/40 bg-white/10 shadow-inner">
                <Shield className="text-yellow-200" size={30} />
              </div>
              <div>
                <AppHeading level="h1" variant="headingM" color="inverse" className="font-extrabold tracking-tight">BAN CHỈ HUY PTKV3</AppHeading>
                <AppCaption color="inverse" className="font-semibold text-yellow-100">Trung tâm Giáo dục Chính trị số</AppCaption>
              </div>
            </div>
            <AppText variant="body" color="inverse" className="text-red-50">
              Đăng nhập để học tập, ôn luyện, kiểm tra và theo dõi kết quả.
            </AppText>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-red-50 p-1" role="tablist">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`rounded-xl ${
                activeTab === "login" ? "bg-white text-red-800 app-shadow-low" : "text-red-700/70"
              }`}
              onClick={() => switchTab("login")}
              id="btn-switch-login"
            >
              Đăng nhập
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`rounded-xl ${
                activeTab === "register" ? "bg-white text-red-800 app-shadow-low" : "text-red-700/70"
              }`}
              onClick={() => switchTab("register")}
              id="btn-switch-register"
            >
              Đăng ký
            </Button>
          </div>

          {successMsg && (
            <Alert className="mb-4" variant="success" icon={<CheckCircle className="text-green-600" size={16} />} description={successMsg} />
          )}

          {error && (
            <Alert className="mb-4" variant="danger" icon={<AlertTriangle className="text-red-600" size={16} />} description={error} />
          )}

          {currentUser?.mustChangePassword ? (
            <form onSubmit={handleRequiredPasswordChange} className="space-y-4" id="required-password-change-form">
              <AppHeading level="h2" variant="title" className="border-b pb-2 font-semibold text-[var(--app-color-text-primary)]">Đổi mật khẩu lần đầu</AppHeading>
              <PasswordInput
                label="Mật khẩu được cấp"
                placeholder="Nhập mật khẩu được cấp"
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
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs text-[var(--app-color-text-muted)]">
                  <input type="checkbox" className="h-5 w-5 rounded border-[var(--app-color-border-strong)] text-red-800 focus:ring-red-800" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => setError("Vui lòng liên hệ quản trị viên để được hỗ trợ khôi phục mật khẩu.")}
                  className="min-h-11 px-1 text-xs font-bold text-red-800 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <PrimaryButton label="Đăng nhập" id="btn-login-submit" />
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3" id="register-form" autoComplete="on" noValidate>
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
    <Input
      label={label}
      name={name}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      leftIcon={icon}
      required
    />
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
    <Input
      label={label}
      name={name}
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      leftIcon={<Key size={16} />}
      required
      minLength={minLength}
    />
  );
}

function PrimaryButton({ label, id }: { label: string; id?: string }) {
  return (
    <Button
      type="submit"
      id={id}
      fullWidth
      size="lg"
      className="app-shadow-high shadow-red-900/20"
    >
      {label}
    </Button>
  );
}
