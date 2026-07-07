import React from "react";
import { BarChart3, BookOpenCheck, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";
import { AppCaption } from "../ui";

export type AdminCommandSection = "overview" | "force" | "education" | "quality" | "reports" | "system";

const items: Array<{ id: AdminCommandSection; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "force", label: "Quản lý lực lượng", icon: Users },
  { id: "education", label: "Giáo dục chính trị", icon: BookOpenCheck },
  { id: "quality", label: "Theo dõi chất lượng", icon: ShieldCheck },
  { id: "reports", label: "Báo cáo", icon: BarChart3 },
  { id: "system", label: "Hệ thống", icon: Settings }
];

export interface AdminCommandNavProps {
  active: AdminCommandSection;
  onChange: (section: AdminCommandSection) => void;
}

export default function AdminCommandNav({ active, onChange }: AdminCommandNavProps) {
  return (
    <nav aria-label="Điều hướng khu vực chỉ huy" className="shrink-0 border-b border-[var(--app-color-divider)] bg-[var(--app-color-surface)] md:w-60 md:border-b-0 md:border-r">
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:p-3">
        {items.map(item => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`motion-interactive flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-left md:w-full ${selected ? "bg-[var(--app-color-brand-primary)] text-white" : "text-[var(--app-color-text-secondary)] hover:bg-[var(--app-color-surface-soft)]"}`}
            >
              <Icon size={18} />
              <AppCaption as="span" className={selected ? "font-extrabold text-white" : "font-bold"}>
                {item.label}
              </AppCaption>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
