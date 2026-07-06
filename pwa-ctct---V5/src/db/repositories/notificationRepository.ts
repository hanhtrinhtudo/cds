import { supabase } from "../supabaseClient";
import { Notification } from "../../types";

export const notificationRepository = {
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in notificationRepository.getNotifications:", error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return (data || []).map(mapDbNotification);
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in notificationRepository.getNotificationsForUser:", error);
      throw new Error(`Failed to fetch notifications for user: ${error.message}`);
    }

    return (data || []).map(mapDbNotification);
  },

  async addNotification(notif: Notification): Promise<Notification> {
    const dbNotif = mapNotificationToDb(notif);
    const { data, error } = await supabase
      .from("notifications")
      .insert([dbNotif])
      .select()
      .single();

    if (error) {
      console.error("Error in notificationRepository.addNotification:", error);
      throw new Error(`Failed to save notification: ${error.message}`);
    }

    return mapDbNotification(data);
  },

  async markNotificationRead(id: string, userId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error in notificationRepository.markNotificationRead:", error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return mapDbNotification(data);
  }
};

function mapDbNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as any,
    read: row.read,
    createdAt: row.created_at
  };
}

function mapNotificationToDb(notif: Notification): any {
  return {
    id: notif.id,
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    read: notif.read,
    created_at: notif.createdAt
  };
}
