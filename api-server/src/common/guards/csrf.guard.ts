import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Safe methods: GET, HEAD, OPTIONS
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return true;
    }

    // JWT-authenticated requests are not CSRF-vulnerable (no cookies involved)
    const authHeader = request.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return true;
    }

    // Multipart file uploads from the same origin are fine
    if (request.headers["content-type"]?.includes("multipart/form-data")) {
      return true;
    }

    // Other state-changing methods require custom header (blocks cross-origin CSRF for cookie-based sessions)
    return !!request.headers["x-requested-with"];
  }
}
