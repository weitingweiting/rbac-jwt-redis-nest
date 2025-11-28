import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * 请求 ID 中间件
 * 为每个请求生成唯一的追踪 ID，用于日志关联和问题排查
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 优先使用客户端传递的请求 ID，如果没有则生成新的
    const requestId = (req.headers['x-request-id'] as string) || uuidv4()

    // 将请求 ID 附加到 request 对象上，供后续使用
    req['requestId'] = requestId

    // 在响应头中返回请求 ID
    res.setHeader('X-Request-ID', requestId)

    next()
  }
}
