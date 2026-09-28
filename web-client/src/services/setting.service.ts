import { apiClient } from "@/lib/api-client";

export const settingService = {
  getSettings: async (options?: { token?: string }) => 
    (await apiClient.get<any>("/settings", options)).json(),
    
  updateSettings: async (data: any) => 
    (await apiClient.put<any>("/settings", data)).json(),

  // Social Links
  getSocialLinks: async (activeOnly?: boolean, options?: { token?: string }) => {
    const url = activeOnly ? "/social-links?activeOnly=true" : "/social-links";
    return (await apiClient.get<any[]>(url, options)).json();
  },
  
  createSocialLink: async (data: any) => 
    (await apiClient.post<any>("/social-links", data)).json(),
    
  updateSocialLink: async (id: string, data: any) => 
    (await apiClient.put<any>(`/social-links/${id}`, data)).json(),
    
  deleteSocialLink: async (id: string) => 
    (await apiClient.delete(`/social-links/${id}`)).json(),
};
