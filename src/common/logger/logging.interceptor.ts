import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 记录请求信息
    this.logger.http('HTTP Request', {
      method,
      url,
      ip,
      userAgent,
      body: process.env.NODE_ENV === 'production' ? this.sanitizeBody(body) : body,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      map(data => {
        // ✅ 统一成功响应格式
        const wrappedResponse = {
          success: true,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          data: data,
          // 添加分页信息（如果需要）
          ...(this.isPaginatedData(data) && {
            pagination: {
              total: data.total,
              page: data.page,
              limit: data.limit,
            }
          })
        };

        // ✅ 设置自定义响应头
        response.setHeader('X-API-Version', '1.0');
        response.setHeader('X-Response-Time', Date.now() - request.startTime);

        return wrappedResponse;
      }),
      tap({
        next: (data: any) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          // 记录响应信息
          this.logger.http('HTTP Response', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error: any) => {
          const response = context.switchToHttp().getResponse();
          const responseTime = Date.now() - startTime;

          // 记录错误信息
          this.logger.error('HTTP Error', {
            method,
            url,
            statusCode: response.statusCode || 500,
            responseTime: `${responseTime}ms`,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  // 清理敏感信息（如密码）
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private isPaginatedData(data: any): boolean {
    return data && typeof data === 'object' &&
      'total' in data && 'page' in data && 'limit' in data;
  }
}
