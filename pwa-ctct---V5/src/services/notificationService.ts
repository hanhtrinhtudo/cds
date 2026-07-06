import { apiClient } from "./apiClient";
import { Notification } from "../types";

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>("/api/notifications");
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.post<Notification>(`/api/notifications/${id}/read`);
  }
};
export default notificationService;
