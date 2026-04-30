import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

/**
 * 限流中间件
 * 基于 IP 地址和时间窗口进行请求限流，防止恶意攻击和滥用
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly windowMs = 60 * 1000 // 时间窗口：60秒
  private readonly maxRequests = 100 // 最大请求数：100次/分钟

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 获取客户端 IP
    const ip = this.getClientIp(req)
    const key = `rate-limit:${ip}`
    const requestId = req['requestId'] || 'unknown'

    try {
      // 获取当前请求次数
      const requests = (await this.cacheManager.get<number>(key)) || 0

      // 检查是否超过限制
      if (requests >= this.maxRequests) {
        this.logger.warn('🚫 请求频率限制触发', {
          ip,
          requests,
          maxRequests: this.maxRequests,
          requestId,
          path: req.url,
          method: req.method
        })

        // 设置限流响应头
        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString())
        res.setHeader('X-RateLimit-Remaining', '0')
        res.setHeader('X-RateLimit-Reset', this.getRateLimitReset().toString())

        throw new HttpException(
          {
            success: false,
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: '请求过于频繁，请稍后再试',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(this.windowMs / 1000)
          },
          HttpStatus.TOO_MANY_REQUESTS
        )
      }

      await this.cacheManager.set(key, requests + 1, this.windowMs)

      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString())
      res.setHeader('X-RateLimit-Remaining', (this.maxRequests - requests - 1).toString())
      res.setHeader('X-RateLimit-Reset', this.getRateLimitReset().toString())

      next()
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      // Redis 连接错误等，不阻塞请求
      this.logger.error('⚠️ 限流中间件异常，允许请求通过', {
        error: error instanceof Error ? error.message : String(error),
        ip,
        requestId
      })
      next()
    }
  }

  /**
   * 获取客户端真实 IP
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    )
  }

  /**
   * 获取限流重置时间戳（秒）
   */
  private getRateLimitReset(): number {
    return Math.floor((Date.now() + this.windowMs) / 1000)
  }
}
