import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Inject,
  UnauthorizedException
} from '@nestjs/common'
import { Response, Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

/**
 * 全局异常过滤器
 * 捕获所有未被其他过滤器处理的异常
 *
 * LoggingInterceptor 已经记录了大部分错误日志，
 * 本次过滤器主要负责：
 * 1. 统一错误响应格式
 * 2. 处理非 HTTP 异常（如数据库错误、未知错误）
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // 使用中间件生成的 requestId
    const requestId = request['requestId'] || Math.random().toString(36).substr(2, 9)
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production'

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let error = 'Internal Server Error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any
        message = responseObj.message || exception.message
        error = responseObj.error || exception.name
      }

      if (status === HttpStatus.NOT_FOUND) {
        error = 'ROUTE_NOT_FOUND'
        message = `路由 ${request.method} ${request.url} 不存在`
      }
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception.name

      if (exception.constructor.name === 'QueryFailedError') {
        status = HttpStatus.BAD_REQUEST
        error = 'DATABASE_ERROR'
        message = isProduction ? '数据库操作失败' : exception.message
      } else if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST
        error = 'VALIDATION_ERROR'
        message = '数据验证失败'
      } else if (exception instanceof UnauthorizedException) {
        status = HttpStatus.UNAUTHORIZED
        error = 'UNAUTHORIZED'
        message = '未授权访问'
      } else if (
        exception.message?.includes('Cannot GET') ||
        exception.message?.includes('Cannot POST') ||
        exception.message?.includes('Cannot PUT') ||
        exception.message?.includes('Cannot DELETE')
      ) {
        status = HttpStatus.NOT_FOUND
        error = 'ROUTE_NOT_FOUND'
        message = `路由 ${request.method} ${request.url} 不存在`
      } else if (exception.name === 'TypeError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR
        error = 'TYPE_ERROR'
        message = isProduction ? '服务器内部错误' : exception.message
      } else if (exception.name === 'ReferenceError') {
        status = HttpStatus.INTERNAL_SERVER_ERROR
        error = 'REFERENCE_ERROR'
        message = isProduction ? '服务器内部错误' : exception.message
      }

      // 记录严重错误
      if (status >= 500) {
        this.logger.error('🤷 AllExceptionsFilter: Unhandled Exception', {
          name: exception.name,
          constructor: exception.constructor.name,
          message: exception.message,
          stack: exception.stack,
          method: request.method,
          url: request.url,
          ip: request.ip,
          requestId,
          timestamp: new Date().toISOString()
        })
      }
    } else {
      // 处理非 Error 类型的异常
      error = 'UNKNOWN_ERROR'
      message = '未知错误'

      this.logger.error('🤷 AllExceptionsFilter: 未知异常类型', {
        exception: String(exception),
        method: request.method,
        url: request.url,
        ip: request.ip,
        requestId,
        timestamp: new Date().toISOString()
      })
    }

    // 统一的错误响应格式
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message:
        isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : message,
      requestId
    }

    // 开发环境返回堆栈信息
    if (!isProduction && exception instanceof Error) {
      ;(errorResponse as any).stack = exception.stack
    }

    // 设置响应头
    response.setHeader('X-Request-ID', requestId)

    response.status(status).json(errorResponse)
  }
}
