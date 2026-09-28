import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
    let errorCode = "INTERNAL_SERVER_ERROR";

    // Log detail of the exception
    const errorDetails =
      exception instanceof Error ? exception.stack || exception.message : exception;
    this.logger.error(`[${request.method}] ${request.url} - Error Details: ${errorDetails}`);

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const rawMessage = exceptionResponse.message;
        if (Array.isArray(rawMessage)) {
          message = `Dữ liệu không hợp lệ: ${rawMessage.join(", ")}`;
          errorCode = "VALIDATION_ERROR";
        } else {
          message = rawMessage || exceptionResponse.error || message;
          errorCode = (exceptionResponse.error || "HTTP_ERROR").toUpperCase().replace(/\s+/g, "_");
        }
      } else {
        message = exceptionResponse || message;
        errorCode = `HTTP_ERROR_${status}`;
      }

      // Localize standard HTTP exception messages
      if (status === HttpStatus.UNAUTHORIZED) {
        message = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
        errorCode = "UNAUTHORIZED";
      } else if (status === HttpStatus.FORBIDDEN) {
        message = "Bạn không có quyền thực hiện chức năng này.";
        errorCode = "FORBIDDEN";
      } else if (status === HttpStatus.NOT_FOUND) {
        message = "Không tìm thấy tài nguyên yêu cầu.";
        errorCode = "NOT_FOUND";
      } else if (status === HttpStatus.METHOD_NOT_ALLOWED) {
        message = "Phương thức HTTP không được hỗ trợ.";
        errorCode = "METHOD_NOT_ALLOWED";
      }
    } else if (exception && typeof exception === "object" && "code" in exception) {
      // Prisma database errors
      const prismaCode = exception.code;
      errorCode = `DB_ERROR_${prismaCode}`;
      status = HttpStatus.BAD_REQUEST;

      switch (prismaCode) {
        case "P2002":
          message = "Dữ liệu đã tồn tại trong hệ thống (vi phạm ràng buộc duy nhất).";
          break;
        case "P2003":
          message = "Không thể thực hiện thao tác do ràng buộc dữ liệu liên quan (khóa ngoại).";
          break;
        case "P2025":
          message = "Không tìm thấy dữ liệu yêu cầu hoặc dữ liệu đã bị xóa.";
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          message = `Lỗi cơ sở dữ liệu: ${exception.message || "Thao tác không hợp lệ"}`;
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          break;
      }
    }

    response.status(status).json({
      success: false,
      data: null,
      meta: null,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode,
    });
  }
}
