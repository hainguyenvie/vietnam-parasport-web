import { z } from 'zod';

// ── Auth Schemas ──

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const login2FASchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  token: z.string().length(6, 'Mã 2FA phải có 6 chữ số'),
});
export type Login2FAInput = z.infer<typeof login2FASchema>;

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(
      /((?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*\d))/,
      'Mật khẩu phải chứa ít nhất 2 loại ký tự: chữ thường, chữ hoa, hoặc số',
    ),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  phoneNumber: z.string().optional(),
  role: z.enum(['USER', 'ATHLETE', 'COACH', 'ASSISTANT']).optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  token: z.string().min(1, 'Token không được để trống'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(
      /((?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*\d))/,
      'Mật khẩu phải chứa ít nhất 2 loại ký tự: chữ thường, chữ hoa, hoặc số',
    ),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const oauthLoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  avatarUrl: z.string().url().optional(),
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
});
export type OAuthLoginInput = z.infer<typeof oauthLoginSchema>;

// ── User Schemas ──

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(
      /((?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*\d))/,
      'Mật khẩu phải chứa ít nhất 2 loại ký tự: chữ thường, chữ hoa, hoặc số',
    ),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateUserSchema = z.object({
  fullName: z.string().optional(),
  avatarUrl: z.string().optional(),
  phoneNumber: z.string().optional(),
  dob: z.string().optional(), // ISO date string
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ── Pagination ──

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Media Schemas ──

export const mediaViewSchema = z.object({
  file: z.string().min(1),
  expires: z.coerce.number().int().positive(),
  signature: z.string().min(1),
});
export type MediaViewInput = z.infer<typeof mediaViewSchema>;

// ── Organization Schema ──

export const organizationSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên tổ chức'),
  type: z.enum(['CLUB', 'DELEGATION']).default('CLUB'),
  location: z.string().optional(),
  sport: z.string().optional(),
  schedule: z.string().optional(),
  suitableFor: z.string().optional(),
  contactInfo: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  accessibilityFeatures: z.any().optional(),
});
export type OrganizationInput = z.infer<typeof organizationSchema>;

// ── Companion Request Schema ──

export const companionRequestSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  unit: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ'),
  type: z.string().min(1, 'Vui lòng chọn loại hỗ trợ'),
  message: z.string().min(1, 'Vui lòng nhập nội dung yêu cầu'),
});
export type CompanionRequestInput = z.infer<typeof companionRequestSchema>;
