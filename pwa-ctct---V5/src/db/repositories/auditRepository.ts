import { supabase } from "../supabaseClient";
import { AuditLog } from "../../types";

export const auditRepository = {
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in auditRepository.getAuditLogs:", error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return (data || []).map(mapDbAuditLog);
  },

  async addAuditLog(log: Omit<AuditLog, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<AuditLog> {
    const logId = log.id || `log_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const createdAt = log.createdAt || new Date().toISOString();
    const dbLog = mapAuditLogToDb({ ...log, id: logId, createdAt } as AuditLog);
    
    const { data, error } = await supabase
      .from("audit_logs")
      .insert([dbLog])
      .select()
      .single();

    if (error) {
      console.error("Error in auditRepository.addAuditLog:", error);
      throw new Error(`Failed to insert audit log: ${error.message}`);
    }

    return mapDbAuditLog(data);
  }
};

function mapDbAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id || "",
    metadata: row.metadata || undefined,
    createdAt: row.created_at
  };
}

function mapAuditLogToDb(log: AuditLog): any {
  return {
    id: log.id,
    user_id: log.userId,
    user_name: log.userName,
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId || null,
    metadata: log.metadata || null,
    created_at: log.createdAt
  };
}
