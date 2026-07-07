import React from "react";
import { PEQIResult, AnalyticsSummary } from "../../services/analyticsService";
import { User } from "../../types";
import { AppCaption, AppHeading, AppText, Badge } from "../ui";

export interface AdminLearnerProfileProps {
  learner?: User;
  summary?: AnalyticsSummary;
  peqi?: PEQIResult | null;
}

export default function AdminLearnerProfile({ learner, summary = {}, peqi }: AdminLearnerProfileProps) {
  return (
    <section className="pixel-surface p-4" aria-label="Học viên cần hỗ trợ">
      <AppHeading level="h3" variant="title">Học viên cần hỗ trợ</AppHeading>
      {learner ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <AppText weight="bold" truncate>{learner.fullName}</AppText>
              <AppCaption truncate>{learner.organizationName || learner.unitId || "Chưa xác định đơn vị"}</AppCaption>
            </div>
            <Badge variant={peqi && peqi.score < 65 ? "warning" : "neutral"}>PEQI {peqi?.score ?? "--"}</Badge>
          </div>
          <AppCaption>Hoàn thành: {summary.completedTopics ?? "--"} · Bài ôn: {summary.quizSubmissions ?? "--"}</AppCaption>
          {peqi?.recommendation && <AppCaption className="leading-relaxed">{peqi.recommendation}</AppCaption>}
        </div>
      ) : (
        <AppCaption className="mt-3 block leading-relaxed">Chưa có dữ liệu phân tích để xác định học viên cần hỗ trợ.</AppCaption>
      )}
    </section>
  );
}
