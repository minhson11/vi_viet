import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = String(response.getHeader('x-request-id') || 'unknown');

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Lỗi máy chủ nội bộ';
    let errorDetail: any = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message ?? message;
      errorDetail = respObj.error ?? null;
    } else if (exception instanceof Error) {
      // 1. Xử lý lỗi chuyển đổi BigInt từ chuỗi không hợp lệ
      if (
        exception instanceof SyntaxError &&
        exception.message.includes('BigInt')
      ) {
        status = HttpStatus.BAD_REQUEST;
        message = 'ID hoặc tham số không hợp lệ (sai định dạng số nguyên)!';
      }
      // 2. Xử lý các mã lỗi phổ biến của Prisma
      else if ((exception as any).code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = (exception as any).meta?.target;
        message =
          process.env.NODE_ENV === 'production'
            ? 'Dữ liệu đã tồn tại trong hệ thống.'
            : `Dữ liệu bị trùng lặp khóa duy nhất (unique constraint): ${target ?? ''}`.trim();
      } else if ((exception as any).code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy bản ghi yêu cầu để xử lý!';
      } else if ((exception as any).code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message =
          process.env.NODE_ENV === 'production'
            ? 'Yêu cầu không hợp lệ do ràng buộc dữ liệu liên quan.'
            : 'Ràng buộc khóa ngoại không hợp lệ (liên kết không tồn tại hoặc bị ràng buộc dữ liệu)!';
      } else {
        // [Bảo mật thông tin nội bộ] Không gửi chi tiết lỗi hệ thống / database nhạy cảm ra môi trường production
        message =
          process.env.NODE_ENV === 'production'
            ? 'Lỗi máy chủ nội bộ. Vui lòng liên hệ bộ phận hỗ trợ.'
            : exception.message;
      }
    }

    this.logger.error(
      `[${requestId}] [${request.method}] ${request.url} - Status: ${status} - Error: ${
        exception instanceof Error ? exception.stack : JSON.stringify(message)
      } - Details: ${JSON.stringify(exceptionResponse)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: errorDetail,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
