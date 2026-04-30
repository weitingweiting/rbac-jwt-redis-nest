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
    const requestId = (req.headers['x-request-id'] as string) || uuidv4()

    req['requestId'] = requestId

    res.setHeader('X-Request-ID', requestId)

    next()
  }
}
