/**
 * Dynamically resolves the API URL based on the execution context (Client-side vs Server-side).
 * 
 * - Client-side (Browser): Returns relative path `/api/...` to use Next.js middleware proxy.
 * - Server-side (Next.js SSR): Returns absolute path `http://localhost:3001/...` to call NestJS backend locally.
 */
export const getApiUrl = (path: string): string => {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/v1/')) {
    cleanPath = cleanPath.substring(7);
  } else if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath.startsWith('/v1/')) {
    cleanPath = cleanPath.substring(3);
  }

  // 1. Client-side (Browser)
  if (typeof window !== 'undefined') {
    return `/api/v1${cleanPath}`;
  }

  // 2. Server-side (Next.js Node.js Server)
  // ALWAYS use localhost (or INTERNAL_API_URL) for server-side fetches to bypass Cloudflare/NAT loopback.
  // NEXT_PUBLIC_API_URL is only for the browser.
  const baseUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';

  let rawBase = baseUrl;
  // Server-side fetch requires an absolute URL. If it's relative (e.g. '/api'), fallback to local backend or NEXTAUTH_URL
  if (rawBase.startsWith('/')) {
    rawBase = process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL.replace(/\/+$/, '') : 'http://127.0.0.1:3001';
  }
  
  let baseWithV1 = rawBase.replace(/\/+$/, '');
  // Append /api/v1 if not already present
  if (!baseWithV1.endsWith('/api/v1')) {
    if (baseWithV1.endsWith('/api')) {
      baseWithV1 += '/v1';
    } else {
      baseWithV1 += '/api/v1';
    }
  }

  return `${baseWithV1}${cleanPath}`;
};
