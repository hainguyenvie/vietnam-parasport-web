import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../../prisma/prisma.service";

const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "token",
  "totpToken",
  "twoFactorSecret",
  "secret",
];

function stripSensitive(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripSensitive);
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      cleaned[key] = "[REDACTED]";
    } else {
      cleaned[key] = stripSensitive(value);
    }
  }
  return cleaned;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const { method, url, user, ip } = req;

    return next.handle().pipe(
      tap((resData) => {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (user && user.id) {
            let entityId = "unknown";
            if (req.params && req.params.id) {
              entityId = req.params.id;
            } else if (resData && resData.id) {
              entityId = resData.id;
            }

            const urlParts = url.split("/").filter(Boolean);
            const resourceIndex = urlParts[0] === "api" ? 2 : 0;
            const resource =
              urlParts.length > resourceIndex ? urlParts[resourceIndex].toUpperCase() : "UNKNOWN";
            const actionName = `${method}_${resource}`;

            this.prisma.auditLog
              .create({
                data: {
                  userId: user.id,
                  action: actionName,
                  entityId: entityId,
                  details: {
                    body: stripSensitive(req.body),
                    query: req.query,
                  },
                  ipAddress: ip || req.headers["x-forwarded-for"] || "",
                },
              })
              .catch((err) => {
                this.logger.error("Failed to create audit log", err);
              });
          }
        }
      })
    );
  }
}
