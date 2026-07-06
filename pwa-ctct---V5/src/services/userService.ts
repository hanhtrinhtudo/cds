import { apiClient } from "./apiClient";
import { User, Unit } from "../types";

export const userService = {
  async createUser(data: {
    fullName: string;
    email: string;
    phone?: string;
    temporaryPassword: string;
    role: string;
    unitId: string;
    accountStatus?: string;
  }): Promise<User> {
    return apiClient.post<User>("/api/users", data);
  },

  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>("/api/users");
  },

  async getUnits(): Promise<Unit[]> {
    return apiClient.get<Unit[]>("/api/units");
  },

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  async updateUser(id: string, updatedFields: Partial<User>): Promise<User> {
    return apiClient.patch<User>(`/api/users/${id}`, updatedFields);
  },

  async approveUser(id: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/approve`);
  },

  async rejectUser(id: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/reject`);
  },

  async suspendUser(id: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/suspend`);
  },

  async reactivateUser(id: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/reactivate`);
  },

  async resetPassword(id: string, temporaryPassword: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/reset-password`, { temporaryPassword });
  },

  async changeRole(id: string, role: string): Promise<{ message: string; user: User }> {
    return apiClient.post<{ message: string; user: User }>(`/api/users/${id}/change-role`, { role });
  }
};
export default userService;
