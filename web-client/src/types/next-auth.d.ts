import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      fullName?: string | null;
      avatarUrl?: string | null;
      role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "INSTRUCTOR" | "USER";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    id: string;
    role: string;
  }
}
