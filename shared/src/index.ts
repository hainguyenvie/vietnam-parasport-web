export * from './validation';

// 1. Standard Response Envelope Types
export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
  message?: string;
}

// 2. User & Role Definitions
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  ATHLETE = 'ATHLETE',
  COACH = 'COACH'
}

export interface UserSessionDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accessToken: string;
}

// 3. System Configuration Interfaces
export interface CarouselItem {
  url: string;
  title: string;
  link: string;
}

export interface GlobalSettingsDto {
  logoPath: string | null;
  faviconPath: string | null;
  heroCarousel: CarouselItem[];
  heroContent?: {
    titleVi?: string;
    titleEn?: string;
    descVi?: string;
    descEn?: string;
  };
  footerContent?: {
    aboutVi?: string;
    aboutEn?: string;
    addressVi?: string;
    addressEn?: string;
    phone?: string;
    email?: string;
  };
  HEADER_MENU_ORDER?: string[];
  HEADER_MENU_VISIBILITY?: Record<string, boolean>;
  ADMIN_SIDEBAR_ORDER?: string[];
  ADMIN_SIDEBAR_VISIBILITY?: Record<string, boolean>;
  HERO_BANNER_SIZE?: string;
  HERO_IMAGE_FIT?: string;
  SHOW_PARTNERS?: boolean;
}

// 4. Social Links Interface
export interface SocialLinkDto {
  id: string;
  name: string;
  url: string;
  icon: string;
  isActive: boolean;
  order: number;
}
