import React from "react";
import { AccountStatus, User } from "../../../types";
import { AppCaption, AppHeading, Badge, Button, EmptyState } from "../../ui";

export default function ApprovalQueue({ users, onUpdateUserStatus }: { users: User[]; onUpdateUserStatus: (id: string, status: AccountStatus) => void }) {
  const pending = users.filter(user => user.accountStatus === AccountStatus.PENDING);
  return <section className="space-y-3"><div><AppHeading level="h2" variant="title">Phê duyệt tài khoản</AppHeading><AppCaption>Chỉ sử dụng các thao tác trạng thái đã được hệ thống hỗ trợ.</AppCaption></div>{pending.length ? <div className="grid gap-2 lg:grid-cols-2">{pending.map(user => <article key={user.id} className="pixel-surface-flat p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-extrabold">{user.fullName}</p><AppCaption>{user.email || user.id} · {user.organizationName || user.unitId || "Chưa xác định đơn vị"}</AppCaption></div><Badge variant="pending">Chờ phê duyệt</Badge></div><AppCaption className="mt-2">Ngày tạo: {user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : "--"}</AppCaption><div className="mt-3 flex gap-2"><Button size="sm" variant="success" onClick={() => onUpdateUserStatus(user.id, AccountStatus.ACTIVE)}>Duyệt</Button><Button size="sm" variant="danger" onClick={() => onUpdateUserStatus(user.id, AccountStatus.REJECTED)}>Từ chối</Button></div></article>)}</div> : <EmptyState title="Không có tài khoản chờ phê duyệt" description="Danh sách sẽ cập nhật khi có đăng ký mới." />}</section>;
}

