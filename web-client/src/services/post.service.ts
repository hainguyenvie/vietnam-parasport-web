import { apiClient } from "@/lib/api-client";

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  status: string;
  createdAt: string;
  category?: { name: string; slug: string };
  tags?: Array<{ name: string; slug: string }>;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { fullName: string; email: string };
}

export const postService = {
  getAll: async (take?: number, options?: { token?: string }) => 
    (await apiClient.get<Post[]>(`/posts?take=${take || 30}`, options)).json(),
    
  getAdminAll: async (page: number, limit: number, query?: string) => {
    let url = `/posts/admin/all?page=${page}&limit=${limit}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;
    return (await apiClient.get<any>(url)).json();
  },
  
  getPaginated: async (page: number, limit: number, options?: { token?: string }) => 
    (await apiClient.get<any>(`/posts/paginated?page=${page}&limit=${limit}`, options)).json(),
    
  getBySlug: async (slug: string, options?: { token?: string }) => 
    (await apiClient.get<Post>(`/posts/${slug}`, options)).json(),
    
  create: async (data: any) => 
    (await apiClient.post<Post>("/posts", data)).json(),
    
  update: async (id: string, data: any) => 
    (await apiClient.put<Post>(`/posts/${id}`, data)).json(),
    
  delete: async (id: string) => 
    (await apiClient.delete(`/posts/${id}`)).json(),

  // Categories & Tags
  getCategories: async () => 
    (await apiClient.get<any[]>("/categories")).json(),
    
  getTags: async () => 
    (await apiClient.get<any[]>("/tags")).json(),

  // Comments
  getComments: async (postId: string, page: number, limit: number) => 
    (await apiClient.get<any>(`/posts/${postId}/comments?page=${page}&limit=${limit}`)).json(),
    
  createComment: async (data: { content: string; postId: string; attachment?: string }) => 
    (await apiClient.post<Comment>("/comments", data)).json(),
    
  deleteComment: async (id: string) => 
    (await apiClient.delete(`/comments/${id}`)).json(),
};
