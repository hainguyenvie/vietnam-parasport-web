import { apiClient } from "@/lib/api-client";

export const eventService = {
  // Events
  getEvents: async () => 
    (await apiClient.get<any[]>("/events")).json(),
    
  createEvent: async (data: any) => 
    (await apiClient.post<any>("/events", data)).json(),
    
  updateEvent: async (id: string, data: any) => 
    (await apiClient.put<any>(`/events/${id}`, data)).json(),
    
  deleteEvent: async (id: string) => 
    (await apiClient.delete(`/events/${id}`)).json(),

  // Partners
  getPartners: async (options?: { token?: string }) => 
    (await apiClient.get<any[]>("/partners", options)).json(),
    
  createPartner: async (data: any) => 
    (await apiClient.post<any>("/partners", data)).json(),
    
  updatePartner: async (id: string, data: any) => 
    (await apiClient.put<any>(`/partners/${id}`, data)).json(),
    
  deletePartner: async (id: string) => 
    (await apiClient.delete(`/partners/${id}`)).json(),

  // Organizations
  getOrganizationsAdmin: async (page: number, limit: number, query?: string) => {
    let url = `/organizations/admin/all?page=${page}&limit=${limit}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    return (await apiClient.get<any>(url)).json();
  },
  
  createOrganization: async (data: any) => 
    (await apiClient.post<any>("/organizations/admin", data)).json(),
    
  updateOrganization: async (id: string, data: any) => 
    (await apiClient.put<any>(`/organizations/${id}`, data)).json(),
    
  approveOrganization: async (id: string) => 
    (await apiClient.put<any>(`/organizations/${id}/approve`, {})).json(),
    
  deleteOrganization: async (id: string) => 
    (await apiClient.delete(`/organizations/${id}`)).json(),

  // Sports
  getSports: async (options?: { token?: string }) => 
    (await apiClient.get<any[]>("/sports", options)).json(),
    
  getSportById: async (id: string) => 
    (await apiClient.get<any>(`/sports/${id}`)).json(),
    
  createSport: async (data: any) => 
    (await apiClient.post<any>("/sports", data)).json(),
    
  updateSport: async (id: string, data: any) => 
    (await apiClient.put<any>(`/sports/${id}`, data)).json(),
    
  deleteSport: async (id: string) => 
    (await apiClient.delete(`/sports/${id}`)).json(),

  // Sport Classifications
  getClassificationsBySport: async (sportId: string, options?: { token?: string }) => 
    (await apiClient.get<any[]>(`/sport-classifications?sportId=${sportId}`, options)).json(),
    
  createClassification: async (data: any) => 
    (await apiClient.post<any>("/sport-classifications", data)).json(),
    
  updateClassification: async (id: string, data: any) => 
    (await apiClient.put<any>(`/sport-classifications/${id}`, data)).json(),
    
  deleteClassification: async (id: string) => 
    (await apiClient.delete(`/sport-classifications/${id}`)).json(),

  // Sport Events
  getSportEventsBySport: async (sportId: string) => 
    (await apiClient.get<any[]>(`/sport-events?sportId=${sportId}`)).json(),
    
  createSportEvent: async (data: any) => 
    (await apiClient.post<any>("/sport-events", data)).json(),
    
  updateSportEvent: async (id: string, data: any) => 
    (await apiClient.put<any>(`/sport-events/${id}`, data)).json(),
    
  deleteSportEvent: async (id: string) => 
    (await apiClient.delete(`/sport-events/${id}`)).json(),

  // Tournaments & Teams & Matches
  getTournaments: async () => 
    (await apiClient.get<any[]>("/tournaments")).json(),
    
  getTournamentById: async (id: string, options?: { token?: string }) => 
    (await apiClient.get<any>(`/tournaments/${id}`, options)).json(),
    
  createTournament: async (data: any) => 
    (await apiClient.post<any>("/tournaments", data)).json(),
    
  updateTournament: async (id: string, data: any) => 
    (await apiClient.put<any>(`/tournaments/${id}`, data)).json(),
    
  deleteTournament: async (id: string) => 
    (await apiClient.delete(`/tournaments/${id}`)).json(),

  getTournamentRankings: async (tournamentId: string) => 
    (await apiClient.get<any[]>(`/tournaments/${tournamentId}/rankings`)).json(),
    
  updateTournamentRankings: async (tournamentId: string, rankings: any[]) => 
    (await apiClient.put<any>(`/tournaments/${tournamentId}/rankings`, { rankings })).json(),

  getTeams: async () => 
    (await apiClient.get<any[]>("/teams")).json(),
    
  createTeam: async (data: any) => 
    (await apiClient.post<any>("/teams", data)).json(),
    
  updateTeam: async (id: string, data: any) => 
    (await apiClient.put<any>(`/teams/${id}`, data)).json(),
    
  deleteTeam: async (id: string) => 
    (await apiClient.delete(`/teams/${id}`)).json(),

  getMatches: async (page?: number, limit?: number, options?: { token?: string }) => {
    let url = "/matches";
    if (page && limit) url += `?page=${page}&limit=${limit}`;
    return (await apiClient.get<any>(url, options)).json();
  },
  
  getMatchById: async (id: string, options?: { token?: string }) => 
    (await apiClient.get<any>(`/matches/${id}`, options)).json(),
    
  createMatch: async (data: any) => 
    (await apiClient.post<any>("/matches", data)).json(),
    
  updateMatch: async (id: string, data: any) => 
    (await apiClient.put<any>(`/matches/${id}`, data)).json(),
    
  deleteMatch: async (id: string) => 
    (await apiClient.delete(`/matches/${id}`)).json(),

  // Stats
  getDashboardCharts: async () => 
    (await apiClient.get<any>("/statistics/dashboard-charts")).json(),
    
  getSummaryStats: async (options?: { token?: string }) => 
    (await apiClient.get<any>("/statistics/summary", options)).json(),
};
