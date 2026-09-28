import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/** Fields to never expose in API responses */
const SENSITIVE_FIELDS = new Set([
  "passwordHash",
  "password",
  "twoFactorSecret",
  "refreshToken",
  "resetToken",
  "verificationToken",
]);

function stripSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 10 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (obj instanceof Date) return obj.toISOString();

  if (Array.isArray(obj)) {
    return obj.map((item) => stripSensitive(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    clean[key] = stripSensitive(value, depth + 1);
  }
  return clean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If the handler already returned a formatted envelope, pass through
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }

        // If it's a paginated response with data+meta, wrap consistently
        if (data && typeof data === "object" && "data" in data && "meta" in data) {
          return {
            success: true,
            data: stripSensitive(data.data),
            meta: data.meta,
          };
        }

        // Default: wrap in standard envelope
        return {
          success: true,
          data: stripSensitive(data),
          statusCode,
        };
      })
    );
  }
}
