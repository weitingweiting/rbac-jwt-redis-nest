import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, Inject } from '@nestjs/common'
import { Response, Request } from 'express'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse() as any

    const isValidationError = Array.isArray(exceptionResponse.message)

    if (isValidationError) {
      // ✅ 使用中间件生成的 requestId
      const requestId = request['requestId'] || Math.random().toString(36).substr(2, 9)

      // ✅ 验证异常的专门响应格式
      const errorResponse = {
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: exceptionResponse.message,
        requestId
      }

      // ✅ 设置响应头
      response.setHeader('X-Request-ID', requestId)
      response.setHeader('X-Error-Type', 'ValidationException')

      this.logger.warn('🔍 ValidationExceptionFilter: 数据验证失败', {
        path: request.url,
        method: request.method,
        validationErrors: exceptionResponse.message,
        requestId,
        timestamp: new Date().toISOString()
      })

      response.status(status).json(errorResponse)
    } else {
      // 如果不是验证错误，重新抛出让其他过滤器处理
      throw exception
    }
  }
}
