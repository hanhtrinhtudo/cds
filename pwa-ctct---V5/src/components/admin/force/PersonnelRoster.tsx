import React, { useMemo, useState } from "react";
import { AccountStatus, User, UserRole } from "../../../types";
import { AppCaption, AppHeading, Badge, Button, EmptyState } from "../../ui";
import { ForceSharedProps } from "./forceTypes";
import { roleLabel, statusLabel } from "./forceUtils";

interface Props extends Pick<ForceSharedProps, "users" | "units" | "onUpdateUserStatus" | "onChangeUserRole"> { onOpenProfile: (user: User) => void; }

export default function PersonnelRoster({ users, units, onOpenProfile, onUpdateUserStatus, onChangeUserRole }: Props) {
  const [query, setQuery] = useState(""); const [unit, setUnit] = useState("all"); const [role, setRole] = useState("all"); const [status, setStatus] = useState("all"); const [sort, setSort] = useState("name");
  const unitName = (user: User) => units.find(item => item.id === user.unitId)?.name || user.organizationName || user.unitId || "Chưa xác định";
  const rows = useMemo(() => users.filter(user => {
    const text = `${user.fullName} ${user.email} ${unitName(user)}`.toLocaleLowerCase("vi");
    return (!query || text.includes(query.toLocaleLowerCase("vi"))) && (unit === "all" || user.unitId === unit) && (role === "all" || String(user.role) === role) && (status === "all" || String(user.accountStatus) === status);
  }).sort((a, b) => {
    if (sort === "unit") return unitName(a).localeCompare(unitName(b), "vi");
    if (sort === "status") return String(a.accountStatus).localeCompare(String(b.accountStatus));
    return a.fullName.localeCompare(b.fullName, "vi");
  }), [users, query, unit, role, status, sort]);
  return <section className="space-y-3">
    <div><AppHeading level="h2" variant="title">Danh sách quân số</AppHeading><AppCaption>PEQI và hoạt động gần nhất hiển thị trong hồ sơ khi có dữ liệu phân tích.</AppCaption></div>
    <div className="grid gap-2 md:grid-cols-5">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, tài khoản, đơn vị" aria-label="Tìm quân số" className="min-h-11 rounded-xl border border-[var(--app-color-border)] bg-white px-3 md:col-span-2" />
      <select aria-label="Lọc đơn vị" value={unit} onChange={e => setUnit(e.target.value)} className="min-h-11 rounded-xl border border-[var(--app-color-border)] bg-white px-2"><option value="all">Tất cả đơn vị</option>{units.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Lọc vai trò" value={role} onChange={e => setRole(e.target.value)} className="min-h-11 rounded-xl border border-[var(--app-color-border)] bg-white px-2"><option value="all">Tất cả vai trò</option>{Object.values(UserRole).map(value => <option key={value} value={value}>{roleLabel(value)}</option>)}</select>
      <div className="flex gap-2"><select aria-label="Lọc trạng thái" value={status} onChange={e => setStatus(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--app-color-border)] bg-white px-2"><option value="all">Mọi trạng thái</option>{Object.values(AccountStatus).map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select><select aria-label="Sắp xếp" value={sort} onChange={e => setSort(e.target.value)} className="min-h-11 w-24 rounded-xl border border-[var(--app-color-border)] bg-white px-2"><option value="name">Tên</option><option value="unit">Đơn vị</option><option value="status">Trạng thái</option></select></div>
    </div>
    {rows.length ? <div className="grid gap-2 lg:grid-cols-2">{rows.map(user => <article key={user.id} className="pixel-surface-flat p-3">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-extrabold break-words">{user.fullName}</p><AppCaption>{user.email || "Chưa có tài khoản hiển thị"}</AppCaption></div><Badge variant={user.accountStatus === AccountStatus.ACTIVE ? "success" : user.accountStatus === AccountStatus.PENDING ? "pending" : "locked"}>{statusLabel(user.accountStatus)}</Badge></div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm"><div><AppCaption>Đơn vị</AppCaption><p className="font-semibold break-words">{unitName(user)}</p></div><div><AppCaption>Vai trò</AppCaption><p className="font-semibold">{roleLabel(user.role)}</p></div><div><AppCaption>PEQI</AppCaption><p className="font-semibold">--</p></div><div><AppCaption>Hoạt động gần nhất</AppCaption><p className="font-semibold">--</p></div></div>
      <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => onOpenProfile(user)}>Xem hồ sơ</Button>{onChangeUserRole && <select aria-label={`Đổi quyền ${user.fullName}`} value={user.role} onChange={e => void onChangeUserRole(user.id, e.target.value as UserRole)} className="min-h-11 rounded-xl border border-[var(--app-color-border)] bg-white px-2">{Object.values(UserRole).map(value => <option key={value} value={value}>{roleLabel(value)}</option>)}</select>}<Button size="sm" variant="secondary" onClick={() => onUpdateUserStatus(user.id, user.accountStatus === AccountStatus.ACTIVE ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE)}>{user.accountStatus === AccountStatus.ACTIVE ? "Tạm khóa" : "Mở khóa"}</Button></div>
    </article>)}</div> : <EmptyState title="Không tìm thấy quân số phù hợp" description="Điều chỉnh bộ lọc để xem danh sách." />}
  </section>;
}

