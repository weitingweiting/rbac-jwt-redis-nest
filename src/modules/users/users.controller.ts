import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { RequireRoles } from '@/shared/decorators/roles.decorator'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { RolesGuard } from '@/shared/guards/roles.guard'
import { UserPermissionsService } from '@/shared/services/user-permissions.service'
import { AuthService } from '@/modules/auth/auth.service'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CreateUserDto, QueryUserDto, UpdateUserDto, AssignRolesDto } from './dto/user.dto'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(PermissionsGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userPermissionsService: UserPermissionsService,
    private authService: AuthService
  ) {}

  /**
   * 获取用户列表（带分页和查询）
   * GET /api/users?page=1&limit=10&username=admin
   */
  @Get()
  @RequirePermissions('users:read')
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() query: QueryUserDto,
    @CurrentUser() currentUser: any
  ) {
    const users = await this.usersService.findAllWithPagination(pagination, query)
    return {
      message: '获取用户列表成功',
      currentUser: currentUser.username,
      ...users
    }
  }

  /**
   * 获取单个用户详情
   * GET /api/users/:id
   */
  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOneUser(id)
    return {
      message: '获取用户详情成功',
      data: user
    }
  }

  /**
   * 创建用户
   * POST /api/users
   */
  @Post()
  @RequirePermissions('users:create')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto)
    return {
      message: '创建用户成功',
      data: user
    }
  }

  /**
   * 更新用户
   * PUT /api/users/:id
   */
  @Put(':id')
  @RequirePermissions('users:update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto)
    return {
      message: '更新用户成功',
      data: user
    }
  }

  /**
   * 删除用户
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.delete(id)
  }

  /**
   * 为用户分配角色
   * PUT /api/users/:id/roles
   */
  @Put(':id/roles')
  @RequirePermissions('users:update')
  async assignRoles(@Param('id', ParseIntPipe) id: number, @Body() assignRolesDto: AssignRolesDto) {
    const user = await this.usersService.assignRoles(id, assignRolesDto.roleIds)
    return {
      message: '分配角色成功',
      data: user
    }
  }

  /**
   * 仅限管理员访问的路由示例
   * GET /api/users/admin
   * */
  @Get('admin')
  @RequireRoles('admin')
  adminOnly(@CurrentUser() user: any) {
    return {
      message: '仅限管理员访问的路由 - 欢迎来到管理员仪表盘',
      currentUser: user
    }
  }

  /**
   * 需要特定权限的路由示例
   * GET /api/users/profile
   * */
  @Get('profile')
  @RequirePermissions('profile:read')
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'User profile',
      user
    }
  }

  /**
   * 需要多个角色中的一个即可访问的路由示例
   * GET /api/users/editor
   * */
  @Get('editor')
  @RequireRoles('admin', 'editor')
  editorRoute(@CurrentUser() user: any) {
    return {
      message: '此路由可由管理员或编辑访问',
      currentUser: user
    }
  }

  /**
   * 需要多个权限全部满足才能访问的路由示例
   * GET /api/users/advanced
   * */
  @Get('advanced')
  @RequirePermissions('users:read', 'users:write')
  advancedRoute(@CurrentUser() user: any) {
    return {
      message: '此路由同时需要 users:read AND users:write 权限',
      currentUser: user
    }
  }

  /**
   * 清除指定用户的权限缓存
   * POST /api/users/cache/clear/:userId
   */
  @Post('cache/clear/:userId')
  @RequireRoles('admin')
  async clearUserCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.userPermissionsService.clearUserCache(userId)
    return {
      message: `已清除用户 ${userId} 的权限缓存`,
      success: true
    }
  }

  /**
   * 强制指定用户登出，admin 角色专用
   * POST /api/users/force-logout/:userId
   */
  @Post('force-logout/:userId')
  @RequireRoles('admin')
  async forceLogoutUser(@Param('userId', ParseIntPipe) userId: number) {
    // 调用 AuthService 的 forceLogout 方法，强制用户登出
    await this.authService.forceLogout(userId)
    // 同时清除权限缓存
    await this.userPermissionsService.clearUserCache(userId)
    return {
      message: `用户 ${userId} 已被强制登出`,
      success: true
    }
  }
}
