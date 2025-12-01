import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { INCLUDE_SOFT_DELETED_KEY } from '../decorators/exclude-soft-deleted.decorator'

/**
 * 软删除拦截器
 * 用于在请求中注入软删除过滤标志
 * 注意：这个拦截器主要用于标记请求，实际的软删除过滤逻辑在 Repository/QueryBuilder 中实现
 */
@Injectable()
export class SoftDeleteInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()

    // 检查是否应该包含软删除的数据
    const includeSoftDeleted = this.reflector.getAllAndOverride<boolean>(INCLUDE_SOFT_DELETED_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    // 在请求对象中设置标志，供后续使用
    request.includeSoftDeleted = includeSoftDeleted || false

    return next.handle()
  }
}
