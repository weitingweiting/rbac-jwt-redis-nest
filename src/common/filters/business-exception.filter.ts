import { ExceptionFilter, Catch, ArgumentsHost, Inject } from '@nestjs/common'
import { Response, Request } from 'express'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse() as any

    // ✅ 使用中间件生成的 requestId，如果没有则生成新的
    const requestId = request['requestId'] || Math.random().toString(36).substr(2, 9)

    // ✅ 业务异常的专门响应格式
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: exceptionResponse.errorCode || 'BUSINESS_ERROR',
      message: exceptionResponse.message,
      requestId
    }

    // ✅ 设置响应头
    response.setHeader('X-Request-ID', requestId)
    response.setHeader('X-Error-Type', 'BusinessException')

    // 根据业务异常类型选择日志级别
    const logLevel = status >= 500 ? 'error' : 'warn'
    this.logger[logLevel]('💼 BusinessExceptionFilter: 业务异常处理', {
      errorCode: exceptionResponse.errorCode,
      message: exceptionResponse.message,
      statusCode: status,
      path: request.url,
      method: request.method,
      requestId,
      timestamp: new Date().toISOString()
    })

    response.status(status).json(errorResponse)
  }
}
