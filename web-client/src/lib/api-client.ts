import { getSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  // Server-side: prefer INTERNAL_API_URL (Docker internal networking),
  // fall back to NEXT_PUBLIC_API_URL, then localhost
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3001/api/v1";

  let rawBase = baseUrl;
  if (rawBase.startsWith("/")) {
    rawBase = process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL.replace(/\/+$/, "")
      : "http://127.0.0.1:3001";
  }

  let baseWithV1 = rawBase.replace(/\/+$/, "");
  if (!baseWithV1.endsWith("/api/v1")) {
    if (baseWithV1.endsWith("/api")) {
      baseWithV1 += "/v1";
    } else {
      baseWithV1 += "/api/v1";
    }
  }

  return baseWithV1;
};

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  json: () => Promise<T>;
}

interface RequestOptions extends RequestInit {
  token?: string;
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err: any) {
      if (attempt >= retries) throw err;
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        console.warn(`API fetch attempt ${attempt + 1}/${retries + 1} failed: ${err.code}, retrying...`);
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Unreachable');
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const baseUrl = getBaseUrl();
  
  // Clean '/api/v1', '/api', or '/v1' prefix from path if present to prevent duplication
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/v1/")) {
    cleanPath = cleanPath.substring(7);
  } else if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath.startsWith("/v1/")) {
    cleanPath = cleanPath.substring(3);
  }
  
  const url = `${baseUrl}${cleanPath}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Requested-With", "XMLHttpRequest");

  let token = options.token;
  if (!token) {
    if (typeof window !== "undefined") {
      const session = await getSession();
      token = (session as any)?.accessToken;
    } else {
      try {
        const session = await getServerSession(authOptions);
        token = (session as any)?.accessToken;
      } catch (err) {
        console.warn("Failed to get server session inside apiClient:", err);
      }
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetchWithRetry(url, { ...options, headers });
  
  if (response.status === 401 && typeof window !== "undefined") {
    signOut();
  }
  
  // Pre-parse the json body to prevent multiple stream reading issues
  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text().catch(() => "");
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data as T,
    json: async () => {
      // Auto-unwrap API envelope {success, data, statusCode}
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        // Preserve meta when the envelope contains it (e.g., paginated responses)
        if ('meta' in data) {
          return { data: data.data, meta: data.meta } as unknown as T;
        }
        return data.data as T;
      }
      return data as T;
    }
  };
}

export const apiClient = {
  request: <T = any>(path: string, options?: RequestOptions) => 
    request<T>(path, options),

  get: <T = any>(path: string, options?: RequestOptions) => 
    request<T>(path, { ...options, method: "GET" }),
    
  post: <T = any>(path: string, body: any, options?: RequestOptions) => 
    request<T>(path, { 
      ...options, 
      method: "POST", 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  put: <T = any>(path: string, body: any, options?: RequestOptions) => 
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
    
  patch: <T = any>(path: string, body: any, options?: RequestOptions) => 
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    
  delete: <T = any>(path: string, options?: RequestOptions) => 
    request<T>(path, { ...options, method: "DELETE" }),
};
