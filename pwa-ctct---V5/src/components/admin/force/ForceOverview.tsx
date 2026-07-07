import React from "react";
import { AccountStatus } from "../../../types";
import { AppCaption, AppHeading, Skeleton } from "../../ui";
import { ForceSharedProps } from "./forceTypes";
import { isLearner } from "./forceUtils";

interface Props extends Pick<ForceSharedProps, "users" | "units"> { activityToday?: number; analyticsLoading?: boolean; analyticsAvailable?: boolean; }

export default function ForceOverview({ users, units, activityToday, analyticsLoading, analyticsAvailable }: Props) {
  const active = users.filter(user => user.accountStatus === AccountStatus.ACTIVE).length;
  const pending = users.filter(user => user.accountStatus === AccountStatus.PENDING).length;
  const locked = users.filter(user => [AccountStatus.SUSPENDED, AccountStatus.REJECTED].includes(user.accountStatus)).length;
  const learners = users.filter(isLearner).length;
  const managers = users.length - learners;
  const representedUnits = new Set(users.map(user => user.unitId).filter(Boolean)).size || units.filter(unit => users.some(user => user.unitId === unit.id)).length;
  const metrics = [
    ["Tổng quân số/tài khoản", users.length], ["Đang hoạt động", active], ["Chờ phê duyệt", pending],
    ["Bị khóa/tạm khóa", locked], ["Học viên", learners], ["Cán bộ/quản trị", managers],
    ["Đơn vị có quân số", representedUnits], ["Có hoạt động hôm nay", analyticsAvailable ? (activityToday ?? 0) : "--"]
  ];
  return <section className="space-y-3">
    <div><AppHeading level="h2" variant="title">Tổng quan lực lượng</AppHeading><AppCaption>Số liệu tài khoản hiện có; chỉ số hoạt động chỉ hiển thị khi hệ thống phân tích sẵn sàng.</AppCaption></div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={String(label)} className="pixel-surface-flat p-3"><AppCaption>{label}</AppCaption>{analyticsLoading && label === "Có hoạt động hôm nay" ? <Skeleton variant="line" /> : <p className="mt-1 text-xl font-extrabold">{value}</p>}</div>)}</div>
  </section>;
}

