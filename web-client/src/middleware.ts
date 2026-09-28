import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Proxy /uploads/* requests to the API server is now handled in next.config.mjs

  // Handle /api requests before next-intl or Next.js router catches them
  if (pathname.startsWith('/api/')) {
    // Let Next.js handle internal API routes
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/upload') || pathname.startsWith('/api/media/') || pathname.startsWith('/api/tts') || pathname.startsWith('/api/v1/media/upload') || pathname.startsWith('/api/v1/settings/admin/')) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/v1/posts') && (request.method === 'POST' || request.method === 'PUT')) {
      return NextResponse.next();
    }

    // Proxy other API requests to NestJS backend
    // The web and API servers run in the same deployment process. Only use a
    // separate service hostname when it is explicitly configured; the
    // production fallback must remain reachable from the Next.js process.
    const internalUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';

    const backendUrl = new URL(internalUrl).origin;
    const url = new URL(pathname, backendUrl);
    url.search = request.nextUrl.search;

    return NextResponse.rewrite(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static files, internals, and upload endpoints which need large bodies
  matcher: ['/((?!_next|_vercel|api/v1/media/upload|.*\\..*).*)']
};
