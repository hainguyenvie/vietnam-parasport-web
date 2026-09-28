import { apiClient } from "@/lib/api-client";
import type { User, PaginatedResponse, ApiResponse } from "@/types";

export const userService = {
  getAdminAll: async (page: number, limit: number, query?: string): Promise<PaginatedResponse<User>> => {
    let url = `/users/admin/all?page=${page}&limit=${limit}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    return (await apiClient.get<PaginatedResponse<User>>(url)).json();
  },

  getAuditLogs: async (page: number, limit: number): Promise<PaginatedResponse<Record<string, unknown>>> =>
    (await apiClient.get<PaginatedResponse<Record<string, unknown>>>(`/users/admin/audits/all?page=${page}&limit=${limit}`)).json(),

  getDashboardAudits: async (): Promise<Record<string, unknown>[]> =>
    (await apiClient.get<Record<string, unknown>[]>("/users/admin/audits")).json(),

  updateUserRole: async (userId: string, roleId: string): Promise<ApiResponse<User>> =>
    (await apiClient.put<ApiResponse<User>>(`/users/${userId}/role`, { roleId })).json(),

  getRoles: async (): Promise<Record<string, unknown>[]> =>
    (await apiClient.get<Record<string, unknown>[]>("/roles")).json(),

  getPermissions: async (): Promise<Record<string, unknown>[]> =>
    (await apiClient.get<Record<string, unknown>[]>("/permissions")).json(),

  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<ApiResponse<unknown>> =>
    (await apiClient.put<ApiResponse<unknown>>(`/roles/${roleId}/permissions`, { permissionIds })).json(),

  getCompanionRequests: async (): Promise<Record<string, unknown>[]> =>
    (await apiClient.get<Record<string, unknown>[]>("/companion-requests")).json(),

  markCompanionRequestRead: async (id: string): Promise<ApiResponse<unknown>> =>
    (await apiClient.put<ApiResponse<unknown>>(`/companion-requests/${id}/read`, {})).json(),

  deleteCompanionRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/companion-requests/${id}`);
  },

  getTournamentIcsUrl: async (tournamentId: string): Promise<{ url: string }> =>
    (await apiClient.get<{ url: string }>(`/calendar/tournaments/${tournamentId}/ics`)).json(),

  getMatchGoogleCalendarLink: async (matchId: string): Promise<{ link: string }> =>
    (await apiClient.get<{ link: string }>(`/calendar/matches/${matchId}/google-link`)).json(),
};
