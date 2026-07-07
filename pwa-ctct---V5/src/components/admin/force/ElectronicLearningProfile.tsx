import React, { useEffect, useState } from "react";
import { LearningProgress, LearningTopic, User } from "../../../types";
import { analyticsService } from "../../../services/analyticsService";
import { apiClient } from "../../../services/apiClient";
import { Alert, AppCaption, AppHeading, Badge, Button, EmptyState, Skeleton } from "../../ui";
import { LearnerProfileData, ProfileLoadState } from "./forceTypes";
import { roleLabel, statusLabel } from "./forceUtils";
import LearnerTimeline from "./LearnerTimeline";
import ProfileAIUsage from "./ProfileAIUsage";
import ProfileLearningProgress from "./ProfileLearningProgress";
import ProfileNewsViews from "./ProfileNewsViews";
import ProfileQuizHistory from "./ProfileQuizHistory";
import ProfileRecommendations from "./ProfileRecommendations";
import ProfileReviewHistory from "./ProfileReviewHistory";

export default function ElectronicLearningProfile({ user, progress, topics, unitName, onBack }: { user: User; progress: LearningProgress[]; topics: LearningTopic[]; unitName: string; onBack?: () => void }) {
  const [state, setState] = useState<ProfileLoadState>("loading");
  const [data, setData] = useState<LearnerProfileData>({ summary: {}, peqi: null, events: [] });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = apiClient.getAuthToken();
      setState("loading");
      setData({ summary: {}, peqi: null, events: [] });
      if (!token) { if (!cancelled) setState("unavailable"); return; }
      try {
        const health = await analyticsService.health(token);
        if (!analyticsService.isSupported(health)) { if (!cancelled) setState("unavailable"); return; }
        const [summary, peqi, events] = await Promise.all([
          analyticsService.getUserSummary(token, user.id),
          analyticsService.getUserPEQI(token, user.id),
          analyticsService.adminListEvents(token, { userId: user.id, range: "30d", limit: 100 })
        ]);
        if (!cancelled) { setData({ summary, peqi, events }); setState("live"); }
      } catch { if (!cancelled) setState("unavailable"); }
    };
    void load();
    return () => { cancelled = true; };
  }, [user.id]);

  const userProgress = progress.filter(item => item.userId === user.id);
  return <div className="space-y-3" id="electronic-learning-profile">
    <div className="flex items-start justify-between gap-2"><div><AppCaption overline>Hồ sơ học tập điện tử</AppCaption><AppHeading level="h2" variant="headingL">{user.fullName}</AppHeading><AppCaption>Dữ liệu tài khoản luôn hiển thị; dữ liệu hành vi chỉ hiển thị khi hệ thống phân tích sẵn sàng.</AppCaption></div>{onBack && <Button size="sm" variant="secondary" onClick={onBack}>Danh sách</Button>}</div>
    {state === "loading" && <div className="pixel-surface-flat p-3"><Skeleton variant="list" /></div>}
    {state === "unavailable" && <Alert variant="info" title="Chưa có dữ liệu phân tích" description="Hồ sơ tài khoản vẫn khả dụng. Các mục hoạt động và PEQI sẽ cập nhật khi hệ thống phân tích sẵn sàng." />}
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Thông tin quân nhân</AppHeading><dl className="mt-2 grid grid-cols-2 gap-2 text-sm"><div><AppCaption>Họ và tên</AppCaption><dd className="font-semibold">{user.fullName}</dd></div><div><AppCaption>Tài khoản</AppCaption><dd className="font-semibold break-words">{user.email || user.id}</dd></div><div><AppCaption>Vai trò</AppCaption><dd>{roleLabel(user.role)}</dd></div><div><AppCaption>Trạng thái</AppCaption><dd><Badge variant={String(user.accountStatus) === "active" ? "success" : "neutral"}>{statusLabel(user.accountStatus)}</Badge></dd></div><div><AppCaption>Ngày tạo</AppCaption><dd>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "--"}</dd></div><div><AppCaption>Cập nhật</AppCaption><dd>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("vi-VN") : "--"}</dd></div></dl></section>
      <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Thông tin đơn vị</AppHeading><dl className="mt-2 space-y-2 text-sm"><div><AppCaption>Đơn vị</AppCaption><dd className="font-semibold">{unitName || "Chưa xác định"}</dd></div><div><AppCaption>Mã đơn vị/tổ chức</AppCaption><dd>{user.organizationId || user.unitId || "Chưa liên kết"}</dd></div><div><AppCaption>Đường dẫn tổ chức</AppCaption><dd className="break-words">{user.organizationPath || "Chưa có dữ liệu"}</dd></div></dl></section>
      <ProfileLearningProgress progress={userProgress} topics={topics} />
      <ProfileQuizHistory events={data.events} />
      <ProfileReviewHistory events={data.events} />
      <ProfileAIUsage events={data.events} />
      <ProfileNewsViews events={data.events} />
      <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">PEQI</AppHeading>{state === "live" && data.peqi ? <div className="mt-2"><p className="text-2xl font-extrabold">{data.peqi.score}</p><p className="font-semibold">{data.peqi.level}</p><AppCaption className="mt-1 block">{data.peqi.recommendation || "Chưa có khuyến nghị"}</AppCaption>{data.peqi.riskFlags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{data.peqi.riskFlags.map(flag => <Badge key={flag} variant="warning">{flag}</Badge>)}</div>}</div> : <EmptyState className="mt-2" title="Chưa đủ dữ liệu" description="PEQI chỉ hiển thị khi có dữ liệu phân tích hợp lệ." />}</section>
      <LearnerTimeline events={data.events} />
      <ProfileRecommendations peqi={data.peqi} events={data.events} />
    </div>
  </div>;
}

