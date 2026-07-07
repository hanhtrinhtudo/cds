import React from "react";
import { AnalyticsEventRecord, PEQIResult } from "../../../services/analyticsService";
import { AppHeading, EmptyState } from "../../ui";
import { recommendationsFromPeqi } from "./forceUtils";

export default function ProfileRecommendations({ peqi, events }: { peqi: PEQIResult | null; events: AnalyticsEventRecord[] }) {
  const items = recommendationsFromPeqi(peqi, events);
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Đề xuất hỗ trợ từ AI</AppHeading>{items.length ? <ul className="mt-2 space-y-2">{items.map(item => <li key={item} className="rounded-xl bg-amber-50 p-2 font-semibold text-amber-950">{item}</li>)}</ul> : <EmptyState className="mt-2" title="Chưa đủ dữ liệu để đề xuất" description="Đề xuất được suy ra minh bạch từ tín hiệu PEQI, không gọi AI bên ngoài." />}</section>;
}
