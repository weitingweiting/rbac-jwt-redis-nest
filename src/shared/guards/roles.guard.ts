import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserPermissionsService } from '../services/user-permissions.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userPermissionsService: UserPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // 未设置角色要求，放行
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    // 从缓存或数据库获取用户角色
    const userRoles = await this.userPermissionsService.getUserRoles(user.id);

    // 检查是否拥有任意一个必需角色（OR 逻辑）
    return requiredRoles.some(role => userRoles.includes(role));
  }
}
