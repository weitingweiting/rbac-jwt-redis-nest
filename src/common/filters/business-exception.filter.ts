import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { BusinessException } from '../../shared/exceptions/business.exception';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // ✅ 生成追踪ID
    const traceId = Math.random().toString(36).substr(2, 9);

    // ✅ 业务异常的专门响应格式
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: exceptionResponse.errorCode || 'BUSINESS_ERROR',
      message: exceptionResponse.message,
      traceId,
      // 业务异常通常不需要显示技术栈信息
    };

    // ✅ 设置响应头
    response.setHeader('X-Error-Trace-ID', traceId);
    response.setHeader('X-Error-Type', 'BusinessException');

    console.log("💼 BusinessExceptionFilter: 处理业务异常", {
      errorCode: exceptionResponse.errorCode,
      message: exceptionResponse.message,
      path: request.url,
      traceId
    });

    response.status(status).json(errorResponse);
  }
}