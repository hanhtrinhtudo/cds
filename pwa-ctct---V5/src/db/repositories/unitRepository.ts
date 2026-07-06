import { supabase } from "../supabaseClient";
import { Unit } from "../../types";

export const unitRepository = {
  async getUnits(): Promise<Unit[]> {
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("id");

    if (error) {
      console.error("Error in unitRepository.getUnits:", error);
      throw new Error(`Failed to fetch units: ${error.message}`);
    }

    return (data || []).map(mapDbUnit);
  },

  async getUnitById(id: string): Promise<Unit | null> {
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in unitRepository.getUnitById:", error);
      throw new Error(`Failed to fetch unit: ${error.message}`);
    }

    return data ? mapDbUnit(data) : null;
  }
};

function mapDbUnit(row: any): Unit {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentUnitId: row.parent_unit_id || undefined,
    description: row.description || ""
  };
}
