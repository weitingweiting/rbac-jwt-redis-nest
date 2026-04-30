import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Inject } from '@nestjs/common'
import { Response, Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { ResponseHeadersUtil } from '../utils/response-headers.util'
import { Logger } from 'winston'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()
    const isDevelopment = this.configService.get<string>('app.nodeEnv') === 'development'

    let message: string | string[]
    let error: string

    // 处理不同类型的异常响应
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse
      error = 'Http Exception'
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any
      message = responseObj.message || exception.message
      error = responseObj.error || exception.name
    } else {
      message = exception.message
      error = exception.name
    }
    const requestId = request['requestId'] || ResponseHeadersUtil.generateTraceId()

    // ✅ 统一的错误响应格式
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: this.mapErrorCode(status, error),
      message: this.getCustomMessage(status, message),
      requestId,
      // 开发环境显示更多信息
      ...(isDevelopment && {
        // stack: exception.stack,
        originalMessage: exception.message
      })
    }

    // ✅ 设置自定义响应头
    response.setHeader('X-Request-ID', requestId)

    // 记录 HTTP 异常日志
    this.logger.error('🚨 HttpExceptionFilter: 处理异常', {
      status,
      path: request.url,
      method: request.method,
      error,
      message: Array.isArray(message) ? message.join('; ') : message,
      requestId,
      timestamp: new Date().toISOString()
    })

    response.status(status).json(errorResponse)
  }

  private mapErrorCode(status: number, originalError: string): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST'
      case 401:
        return 'UNAUTHORIZED'
      case 403:
        return 'FORBIDDEN'
      case 404:
        return 'NOT_FOUND'
      case 409:
        return 'CONFLICT'
      case 429:
        return 'TOO_MANY_REQUESTS'
      default:
        return originalError
    }
  }

  private getCustomMessage(status: number, originalMessage: string | string[]): string | string[] {
    if (Array.isArray(originalMessage)) {
      return originalMessage
    }

    switch (status) {
      case 401:
        return '身份验证失败，请重新登录'
      case 403:
        return '权限不足，无法访问此资源'
      case 404:
        return '请求的资源不存在'
      case 409:
        return '操作冲突，请检查数据是否重复'
      default:
        return originalMessage
    }
  }
}
