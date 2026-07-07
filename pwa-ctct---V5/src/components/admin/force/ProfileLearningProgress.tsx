import React from "react";
import { LearningProgress, LearningTopic } from "../../../types";
import { AppCaption, AppHeading, EmptyState } from "../../ui";

export default function ProfileLearningProgress({ progress, topics }: { progress: LearningProgress[]; topics: LearningTopic[] }) {
  return <section className="pixel-surface-flat p-3"><AppHeading level="h3" variant="title">Tiến độ học theo chuyên đề</AppHeading>{progress.length ? <div className="mt-2 space-y-2">{progress.map(item => <div key={item.id} className="rounded-xl bg-[var(--app-color-surface-soft)] p-2"><div className="flex justify-between gap-2"><span className="font-semibold">{topics.find(topic => topic.id === item.topicId)?.title || item.topicId}</span><AppCaption>{item.progressPercent}%</AppCaption></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-[var(--app-color-brand-primary)]" style={{ width: `${Math.max(0, Math.min(100, item.progressPercent))}%` }} /></div></div>)}</div> : <EmptyState className="mt-2" title="Chưa có dữ liệu tiến độ" description="Tiến độ sẽ xuất hiện khi dữ liệu học tập được đồng bộ." />}</section>;
}

