import React from "react";
import { BarChart3, FileText, ListChecks, TrendingUp, UserRoundSearch, Users } from "lucide-react";
import { AdminCommandSection } from "../AdminCommandNav";
import { AppCaption, AppHeading, AppText } from "../../ui";
import { QuickAction } from "./dashboardTypes";

interface QuickActionsPanelProps { loading?: boolean; onNavigate: (section: AdminCommandSection) => void; }
const actions: QuickAction[] = [
  { id: "force", label: "Xem quân số", description: "Tài khoản, trạng thái, vai trò", section: "force" },
  { id: "system", label: "Xem đơn vị", description: "Cây tổ chức và phạm vi", section: "system" },
  { id: "quality", label: "Xem hoạt động", description: "Dòng sự kiện học tập", section: "quality" },
  { id: "quality-results", label: "Xem kết quả", description: "Kết quả và xếp hạng", section: "quality" },
  { id: "reports", label: "Xuất báo cáo", description: "Báo cáo chỉ huy", section: "reports" },
  { id: "force-profile", label: "Học viên cần hỗ trợ", description: "Hồ sơ và tín hiệu rủi ro", section: "force" }
];
const icons = [Users, ListChecks, BarChart3, TrendingUp, FileText, UserRoundSearch];
export default function QuickActionsPanel({ onNavigate }: QuickActionsPanelProps) { return <section className="pixel-surface p-4" id="quick-actions-panel"><div><AppHeading level="h2" variant="title">Truy cập nhanh</AppHeading><AppCaption>Đi nhanh tới các khu vực quản trị không phát sinh thao tác phá hủy.</AppCaption></div><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{actions.map((action, index) => { const Icon = icons[index] || Users; return <button key={action.id} type="button" onClick={() => onNavigate(action.section)} className="flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-left transition hover:bg-red-50/60 focus:outline-none focus:ring-2 focus:ring-red-700/20"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--app-color-brand-primary)]"><Icon size={18} /></span><span className="min-w-0"><AppText as="span" weight="black" className="block" truncate>{action.label}</AppText><AppCaption as="span" truncate>{action.description}</AppCaption></span></button>; })}</div></section>; }
