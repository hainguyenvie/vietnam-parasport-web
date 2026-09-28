import { apiClient } from "@/lib/api-client";

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  videoUrl?: string;
  content?: string;
  chapterId: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  chapters?: Chapter[];
  createdAt: string;
}

export const courseService = {
  getAll: async (options?: { token?: string }) => 
    (await apiClient.get<Course[]>("/courses", options)).json(),
    
  getBySlug: async (slug: string, options?: { token?: string }) => 
    (await apiClient.get<Course>(`/courses/${slug}`, options)).json(),
    
  create: async (data: Partial<Course>) => 
    (await apiClient.post<Course>("/courses", data)).json(),
    
  update: async (id: string, data: Partial<Course>) => 
    (await apiClient.put<Course>(`/courses/${id}`, data)).json(),
    
  delete: async (id: string) => 
    (await apiClient.delete(`/courses/${id}`)).json(),

  // Chapter operations
  createChapter: async (data: { title: string; order: number; course: { connect: { id: string } } }) => 
    (await apiClient.post<Chapter>("/chapters", data)).json(),
    
  deleteChapter: async (id: string) => 
    (await apiClient.delete(`/chapters/${id}`)).json(),

  // Lesson operations
  createLesson: async (data: { title: string; slug: string; order: number; videoUrl?: string; content?: string; chapter: { connect: { id: string } } }) => 
    (await apiClient.post<Lesson>("/lessons", data)).json(),
    
  updateLesson: async (id: string, data: Partial<Lesson>) => 
    (await apiClient.put<Lesson>(`/lessons/${id}`, data)).json(),
    
  deleteLesson: async (id: string) => 
    (await apiClient.delete(`/lessons/${id}`)).json(),

  // Quizzes & Assignments
  getQuizByLessonId: async (lessonId: string) => 
    (await apiClient.get<any>(`/quizzes/lesson/${lessonId}`)).json(),
    
  createQuiz: async (data: any) => 
    (await apiClient.post<any>("/quizzes", data)).json(),
    
  deleteQuiz: async (id: string) => 
    (await apiClient.delete(`/quizzes/${id}`)).json(),
    
  deleteQuestion: async (questionId: string) => 
    (await apiClient.delete(`/quizzes/questions/${questionId}`)).json(),
    
  addQuestionToQuiz: async (quizId: string, data: any) => 
    (await apiClient.post<any>(`/quizzes/${quizId}/questions`, data)).json(),

  getAssignmentByLessonId: async (lessonId: string) => 
    (await apiClient.get<any>(`/assignments/lesson/${lessonId}`)).json(),
    
  createAssignment: async (data: any) => 
    (await apiClient.post<any>("/assignments", data)).json(),
    
  updateAssignment: async (id: string, data: any) => 
    (await apiClient.put<any>(`/assignments/${id}`, data)).json(),
};
