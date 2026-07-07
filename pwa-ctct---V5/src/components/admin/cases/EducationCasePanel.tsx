import React from "react";
import { AppCaption, AppHeading, EmptyState } from "../../ui";
import CaseCard from "./CaseCard";
import { EducationCase, EducationCaseStatus } from "./caseTypes";

export default function EducationCasePanel({ cases, onStatus, onAddAction }: { cases: EducationCase[]; onStatus: (id: string, status: EducationCaseStatus) => void; onAddAction: (id: string, detail: string) => void }) {
  return <section className="space-y-3"><div><AppHeading level="h3" variant="title">Quản lý vụ việc giáo dục</AppHeading><AppCaption>Chỉ là bản nháp trong phiên hiện tại; chưa được lưu về hệ thống và chưa gửi thông báo.</AppCaption></div>{cases.length ? <div className="space-y-3">{cases.map(item => <CaseCard key={item.id} item={item} onStatus={status => onStatus(item.id, status)} onAddAction={detail => onAddAction(item.id, detail)} />)}</div> : <EmptyState title="Chưa có vụ việc đang theo dõi" description="Có thể tạo bản nháp từ đề xuất xử lý của hồ sơ học tập." />}</section>;
}

