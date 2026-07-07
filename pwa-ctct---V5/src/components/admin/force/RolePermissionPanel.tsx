import React from "react";
import { AppCaption, AppHeading } from "../../ui";

const roles = [
  ["Học viên", [1,1,1,0,0,0,0,0]], ["Giảng viên", [1,1,1,0,1,1,0,0]],
  ["Cán bộ chính trị", [1,1,1,1,1,1,1,0]], ["Chỉ huy", [1,1,1,1,1,0,1,0]],
  ["Quản trị viên", [1,1,1,1,1,1,1,1]]
] as const;
const capabilities = ["Học tập","Làm bài/ôn tập","Xem kết quả cá nhân","Quản lý quân số","Xem báo cáo đơn vị","Quản lý chuyên đề","Quản lý kỳ kiểm tra","Quản trị hệ thống"];

export default function RolePermissionPanel() {
  return <section className="space-y-3"><div><AppHeading level="h2" variant="title">Ma trận phân quyền</AppHeading><AppCaption>Thông tin tham chiếu; thay đổi vai trò thực hiện tại danh sách quân số bằng handler hiện có.</AppCaption></div><div className="space-y-2">{roles.map(([role, grants]) => <article key={role} className="pixel-surface-flat p-3"><p className="font-extrabold">{role}</p><div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item, index) => <div key={item} className="flex items-center gap-2 text-sm"><span aria-hidden className={grants[index] ? "text-green-700" : "text-slate-400"}>{grants[index] ? "✓" : "—"}</span><span>{item}</span></div>)}</div></article>)}</div></section>;
}
