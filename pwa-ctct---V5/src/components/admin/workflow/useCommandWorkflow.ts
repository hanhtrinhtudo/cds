import { useState } from "react";
import { AdminCommandSection } from "../AdminCommandNav";

export type WorkflowSource = "dashboard" | "force" | "quality" | "reports";

export interface CommandWorkflowState {
  selectedSection: AdminCommandSection;
  selectedLearnerId?: string;
  selectedUnitId?: string;
  selectedEventId?: string;
  selectedRisk?: string;
  selectedCaseId?: string;
  workflowSource: WorkflowSource;
}

const initialState: CommandWorkflowState = { selectedSection: "overview", workflowSource: "dashboard" };

export function useCommandWorkflow() {
  const [workflow, setWorkflow] = useState<CommandWorkflowState>(initialState);
  const selectSection = (selectedSection: AdminCommandSection, source: WorkflowSource = "dashboard") => setWorkflow(current => ({ ...current, selectedSection, workflowSource: source }));
  const openLearnerProfile = (selectedLearnerId: string, workflowSource: WorkflowSource = "force") => setWorkflow({ selectedSection: "force", selectedLearnerId, workflowSource });
  const openUnitDetail = (selectedUnitId: string, workflowSource: WorkflowSource = "dashboard") => setWorkflow({ selectedSection: "force", selectedUnitId, workflowSource });
  const openRiskDetail = (selectedRisk: string, workflowSource: WorkflowSource = "quality") => setWorkflow(current => ({ ...current, selectedSection: "quality", selectedRisk, workflowSource }));
  const openEvent = (selectedEventId: string, selectedLearnerId?: string, workflowSource: WorkflowSource = "dashboard") => setWorkflow({ selectedSection: selectedLearnerId ? "force" : "quality", selectedEventId, selectedLearnerId, workflowSource });
  const openCase = (selectedCaseId: string) => setWorkflow(current => ({ ...current, selectedSection: "force", selectedCaseId, workflowSource: "force" }));
  const clearWorkflow = () => setWorkflow(initialState);
  return { workflow, selectSection, openLearnerProfile, openUnitDetail, openRiskDetail, openEvent, openCase, clearWorkflow };
}

export default useCommandWorkflow;

