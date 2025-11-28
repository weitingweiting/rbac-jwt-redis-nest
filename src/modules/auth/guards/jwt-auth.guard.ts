import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }
  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) {
      return true
    }

    // passport会去通过PassportStrategy，找到名为'jwt'的策略进行验证（文件：src/modules/auth/strategies/jwt.strategy.ts）
    return super.canActivate(context)
  }
}
