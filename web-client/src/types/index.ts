export interface DocumentTopic {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  statusCode?: number;
  message?: string;
}

export interface CoachProfile {
  id: string;
  userId: string;
  sport?: { id: string; nameVi: string; nameEn: string };
  experienceYears?: number;
  achievements?: string;
}

export interface AssistantProfile {
  id: string;
  userId: string;
  athleteId?: string;
  supportArea?: string;
  medicalCertUrl?: string;
  isVerified?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: {
    id: string;
    name: string;
  };
  createdAt: string;
  isActive: boolean;
  gender?: string;
  dob?: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  isTwoFactorEnabled?: boolean;
  coachProfile?: CoachProfile | null;
  assistantProfile?: AssistantProfile | null;
  athleteProfile?: AthleteProfile | null;
  athleteProfiles?: AthleteProfile[];
}

export interface AthleteProfile {
  id: string;
  userId: string;
  user: { id: string; fullName: string; avatarUrl?: string };
  sport: { id: string; nameVi: string; nameEn: string; slug: string };
  classification?: { id: string; code: string };
}

