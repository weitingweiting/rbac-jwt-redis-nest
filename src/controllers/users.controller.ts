import { Controller, Get, UseGuards, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { RequireRoles } from '../decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPermissionsService } from '../services/user-permissions.service';
import { AuthService } from '../auth/auth.service';

@Controller('users')
@UseGuards(PermissionsGuard, RolesGuard)
export class UsersController {
  constructor(
    private userPermissionsService: UserPermissionsService,
    private authService: AuthService,
  ) { }

  @Get()
  @RequirePermissions('users:read')
  findAll(@CurrentUser() user: any) {
    return {
      message: 'This action returns all users',
      currentUser: user,
      data: [
        { id: 1, username: 'admin', email: 'admin@example.com' },
        { id: 2, username: 'john_doe', email: 'john@example.com' },
      ],
    };
  }

  @Get('admin')
  @RequireRoles('admin')
  adminOnly(@CurrentUser() user: any) {
    return {
      message: 'Admin only route - Welcome to admin dashboard',
      currentUser: user,
    };
  }

  @Get('profile')
  @RequirePermissions('profile:read')
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'User profile',
      user,
    };
  }

  @Get('editor')
  @RequireRoles('admin', 'editor')
  editorRoute(@CurrentUser() user: any) {
    return {
      message: 'This route is accessible by admin or editor',
      currentUser: user,
    };
  }

  @Get('advanced')
  @RequirePermissions('users:read', 'users:write')
  advancedRoute(@CurrentUser() user: any) {
    return {
      message: 'This route requires both users:read AND users:write permissions',
      currentUser: user,
    };
  }

  @Post('cache/clear/:userId')
  @RequireRoles('admin')
  async clearUserCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.userPermissionsService.clearUserCache(userId);
    return {
      message: `Cache cleared for user ${userId}`,
      success: true,
    };
  }

  @Post('force-logout/:userId')
  @RequireRoles('admin')
  async forceLogoutUser(@Param('userId', ParseIntPipe) userId: number) {
    await this.authService.forceLogout(userId);
    // 同时清除权限缓存
    await this.userPermissionsService.clearUserCache(userId);
    return {
      message: `User ${userId} has been forcefully logged out`,
      success: true,
    };
  }
}
