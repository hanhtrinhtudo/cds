import { supabase } from "../supabaseClient";
import { AIChatMessage } from "../../types";

export const aiRepository = {
  async getChatHistory(userId: string): Promise<AIChatMessage[]> {
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error in aiRepository.getChatHistory:", error);
      throw new Error(`Failed to fetch chat history: ${error.message}`);
    }

    return (data || []).map(mapDbChatMessage);
  },

  async addChatMessage(msg: AIChatMessage): Promise<AIChatMessage> {
    const dbMsg = mapChatMessageToDb(msg);
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .insert([dbMsg])
      .select()
      .single();

    if (error) {
      console.error("Error in aiRepository.addChatMessage:", error);
      throw new Error(`Failed to save chat message: ${error.message}`);
    }

    return mapDbChatMessage(data);
  }
};

function mapDbChatMessage(row: any): AIChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id || undefined,
    role: row.role as any,
    content: row.content,
    createdAt: row.created_at,
    safetyLevel: row.safety_level || undefined,
    referenceUsed: row.reference_used || undefined
  };
}

function mapChatMessageToDb(msg: AIChatMessage): any {
  return {
    id: msg.id,
    user_id: msg.userId,
    topic_id: msg.topicId || null,
    role: msg.role,
    content: msg.content,
    created_at: msg.createdAt,
    safety_level: msg.safetyLevel || null,
    reference_used: msg.referenceUsed || null
  };
}
