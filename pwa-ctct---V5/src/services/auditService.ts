import { apiClient } from "./apiClient";
import { AuditLog } from "../types";

export const auditService = {
  async getAuditLogs(): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>("/api/audit-logs");
  }
};
export default auditService;
