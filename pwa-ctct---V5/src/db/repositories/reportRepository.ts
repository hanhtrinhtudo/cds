import { supabase } from "../supabaseClient";
import { ReportSnapshot } from "../../types";

export const reportRepository = {
  async getReportSnapshots(): Promise<ReportSnapshot[]> {
    const { data, error } = await supabase
      .from("report_snapshots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in reportRepository.getReportSnapshots:", error);
      throw new Error(`Failed to fetch report snapshots: ${error.message}`);
    }

    return (data || []).map(mapDbReportSnapshot);
  },

  async addReportSnapshot(snapshot: ReportSnapshot): Promise<ReportSnapshot> {
    const dbSnapshot = mapReportSnapshotToDb(snapshot);
    const { data, error } = await supabase
      .from("report_snapshots")
      .insert([dbSnapshot])
      .select()
      .single();

    if (error) {
      console.error("Error in reportRepository.addReportSnapshot:", error);
      throw new Error(`Failed to insert report snapshot: ${error.message}`);
    }

    return mapDbReportSnapshot(data);
  }
};

function mapDbReportSnapshot(row: any): ReportSnapshot {
  return {
    id: row.id,
    title: row.title,
    type: row.type as any,
    generatedBy: row.generated_by || "",
    data: row.data || {},
    createdAt: row.created_at
  };
}

function mapReportSnapshotToDb(snap: ReportSnapshot): any {
  return {
    id: snap.id,
    title: snap.title,
    type: snap.type,
    generated_by: snap.generatedBy || null,
    data: snap.data,
    created_at: snap.createdAt
  };
}
