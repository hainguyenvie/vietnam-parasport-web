import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getApiUrl } from "@/utils/api";

const hasGoogleOAuthConfig = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
    totpToken: { label: "2FA Token", type: "text" }
  },
  async authorize(credentials, req) {
    if (!credentials?.email) {
      return null;
    }

    try {
      if (credentials.totpToken) {
        const res = await fetch(getApiUrl("/auth/login/2fa"), {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            token: credentials.totpToken,
          }),
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        const body = await res.json();
        if (res.ok && body && body.data?.user) {
          return {
            id: body.data.user.id,
            name: body.data.user.fullName,
            email: body.data.user.email,
            role: body.data.user.role,
            accessToken: body.data.access_token,
          };
        }
        throw new Error("Mã 2FA không chính xác hoặc đã hết hạn.");
      }

      if (!credentials.password) {
        return null;
      }

      const headers: any = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      };
      const forwardedFor = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
      if (forwardedFor) headers['x-forwarded-for'] = forwardedFor;

      const res = await fetch(getApiUrl("/auth/login"), {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
        headers
      });

      let body;
      try {
        body = await res.json();
      } catch (e) {
        throw new Error(`Invalid JSON from backend: ${res.status} ${res.statusText}`);
      }

      if (res.ok && body) {
        if (body.data?.twoFactorRequired || body.twoFactorRequired) {
          throw new Error("2FA_REQUIRED");
        }

        if (body.data?.user) {
          return {
            id: body.data.user.id,
            name: body.data.user.fullName,
            email: body.data.user.email,
            role: body.data.user.role,
            accessToken: body.data.access_token,
          };
        }
      }

      throw new Error(body?.message || body?.error || `Đăng nhập thất bại (${res.status})`);
    } catch (error: any) {
      if (error.message === "2FA_REQUIRED" || error.message === "Mã 2FA không chính xác hoặc đã hết hạn.") {
        throw error;
      }
      throw new Error(error.message || "Lỗi kết nối đến máy chủ");
    }
  }
});

export const authOptions = {
  trustHost: true,
  providers: [
    ...(hasGoogleOAuthConfig
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    credentialsProvider,
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === "google") {
        try {
          const apiUrl = getApiUrl("/auth/oauth-login");
          const payload = {
            email: user.email,
            fullName: user.name,
            avatarUrl: user.image,
            provider: "google",
            providerAccountId: account.providerAccountId,
            idToken: account.id_token,
          };

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const body = await res.json();
            if (body && body.data?.access_token) {
              user.accessToken = body.data.access_token;
              user.role = body.data.user?.role;
              return true;
            }
            throw new Error("Missing access_token in backend response");
          }

          const errorBody = await res.text();
          throw new Error(`Google login failed: ${res.status} - ${errorBody}`);
        } catch (error: any) {
          throw new Error(`Google connection failed: ${error.message}`);
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
