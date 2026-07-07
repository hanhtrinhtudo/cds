import React from "react";
import { AppCaption, Badge } from "../../ui";
import CaseActionComposer from "./CaseActionComposer";
import CaseTimeline from "./CaseTimeline";
import { EducationCase, EducationCaseStatus } from "./caseTypes";
import { caseActionLabel, caseStatusLabel } from "./caseUtils";

export default function CaseCard({ item, onStatus, onAddAction }: { item: EducationCase; onStatus: (status: EducationCaseStatus) => void; onAddAction: (detail: string) => void }) {
  return <article className="pixel-surface-flat p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><AppCaption overline>{item.id}</AppCaption><p className="font-extrabold">{item.title}</p><AppCaption>{item.unit} · Bản nháp xử lý trên phiên hiện tại</AppCaption></div><Badge variant={item.severity === "danger" ? "danger" : item.severity === "warning" ? "warning" : "info"}>{caseStatusLabel[item.status]}</Badge></div><div className="mt-3"><p className="font-semibold">Lý do</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{item.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></div><div className="mt-3"><p className="font-semibold">Đề xuất hành động</p><div className="mt-1 flex flex-wrap gap-1">{item.recommendedActions.map(action => <Badge key={action} variant="neutral">Đề xuất · {caseActionLabel[action]}</Badge>)}</div></div><label className="mt-3 block"><AppCaption as="span" className="font-bold">Trạng thái bản nháp</AppCaption><select aria-label={`Trạng thái ${item.id}`} value={item.status} onChange={event => onStatus(event.target.value as EducationCaseStatus)} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--app-color-border)] bg-white px-3"><option value="monitoring">Đang theo dõi</option><option value="improved">Đã cải thiện</option><option value="closed">Đóng vụ việc</option></select></label><div className="mt-3"><CaseTimeline timeline={item.timeline} /></div><div className="mt-3"><CaseActionComposer onAdd={onAddAction} /></div></article>;
}

