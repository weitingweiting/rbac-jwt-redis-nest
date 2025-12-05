import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY, PERMISSIONS_LOGIC_KEY } from '../decorators/permissions.decorator'
import { UserPermissionsService } from '../services/user-permissions.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userPermissionsService: UserPermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    const logic = this.reflector.getAllAndOverride<string>(PERMISSIONS_LOGIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true // 未设置权限要求，放行
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.id) {
      return false
    }

    // 从缓存或数据库获取用户权限
    const userPermissions = await this.userPermissionsService.getUserPermissions(user.id)
    console.log('🚀 ~ PermissionsGuard ~ canActivate ~ userPermissions:', userPermissions)

    // 检查是否拥有所有必需权限（AND 逻辑）
    // return requiredPermissions.every(permission =>
    //   userPermissions.includes(permission),
    // );

    if (logic === 'OR') {
      // OR 逻辑：只要有一个权限匹配即可
      return requiredPermissions.some((permission) => userPermissions.includes(permission))
    } else {
      // 默认 AND 逻辑：必须全部权限匹配
      return requiredPermissions.every((permission) => userPermissions.includes(permission))
    }
  }
}
