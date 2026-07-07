import React from "react";
import { User } from "../../types";
import { AdminCommandSection } from "./AdminCommandNav";
import { CommandDashboard } from "./dashboard";

export interface AdminCommandDashboardProps {
  users: User[];
  onNavigateSection: (section: AdminCommandSection) => void;
  onOpenLearner?: (userId: string) => void;
  onOpenEvent?: (eventId: string, userId?: string) => void;
  onOpenRisk?: (riskId: string) => void;
}

export default function AdminCommandDashboard({ users, onNavigateSection, onOpenLearner, onOpenEvent, onOpenRisk }: AdminCommandDashboardProps) {
  return <CommandDashboard users={users} onNavigateSection={onNavigateSection} onOpenLearner={onOpenLearner} onOpenEvent={onOpenEvent} onOpenRisk={onOpenRisk} />;
}
