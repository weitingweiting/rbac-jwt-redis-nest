import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  StreamableFile
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { Response, Request } from 'express'
import { ResponseHeadersUtil } from '../utils/response-headers.util'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()
    const { method, url, ip, body, headers } = request
    const userAgent = headers['user-agent'] || ''
    const startTime = Date.now()
    const requestId = request['requestId'] || 'unknown'
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production'

    request['startTime'] = startTime

    this.logger.http('HTTP Request [Interceptor]', {
      method,
      url,
      ip,
      userAgent,
      body: isProduction ? this.sanitizeBody(body) : body,
      requestId,
      timestamp: new Date().toISOString()
    })

    return next.handle().pipe(
      map((data) => {
        const responseTime = Date.now() - startTime

        ResponseHeadersUtil.setCommonHeaders(response, { responseTime })

        // ✅ 如果是 StreamableFile，直接返回，不包装
        if (data instanceof StreamableFile) {
          return data
        }

        const wrappedResponse = {
          success: true,
          statusCode: 200,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          data: data
        }

        return wrappedResponse
      }),
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse()
          const { statusCode } = response
          const responseTime = Date.now() - startTime

          this.logger.http('HTTP Response [Interceptor]', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            requestId,
            timestamp: new Date().toISOString()
          })
        },
        error: (error: any) => {
          const response = context.switchToHttp().getResponse()
          const responseTime = Date.now() - startTime

          let statusCode = 500
          if (error && typeof error.getStatus === 'function') {
            statusCode = error.getStatus()
          } else if (response.statusCode && response.statusCode !== 200) {
            statusCode = response.statusCode
          }

          this.logger.error('HTTP Error [Interceptor]', {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            error: error.message,
            stack: error.stack,
            requestId,
            timestamp: new Date().toISOString()
          })
        }
      })
    )
  }

  // 清理敏感信息（如密码）
  private sanitizeBody(body: any): any {
    if (!body) return body

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey']

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***'
      }
    })

    return sanitized
  }
}
