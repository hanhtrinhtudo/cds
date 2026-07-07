import React from "react";
import { AppCaption, AppHeading } from "../../ui";
import { EducationCaseTimelineEntry } from "./caseTypes";

export default function CaseTimeline({ timeline }: { timeline: EducationCaseTimelineEntry[] }) { return <div><AppHeading level="h4" variant="title">Dòng xử lý</AppHeading><ol className="mt-2 space-y-2">{timeline.map(item => <li key={item.id} className="border-l-2 border-red-200 pl-3"><p className="font-semibold">{item.label}</p><AppCaption>{item.detail ? `${item.detail} · ` : ""}{new Date(item.time).toLocaleString("vi-VN")}</AppCaption></li>)}</ol></div>; }
