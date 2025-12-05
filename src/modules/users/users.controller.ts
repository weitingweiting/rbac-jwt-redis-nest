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
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { RolesGuard } from '@/shared/guards/roles.guard'
import { UserPermissionsService } from '@/shared/services/user-permissions.service'
import { AuthService } from '@/modules/auth/auth.service'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import {
  CreateUserDto,
  QueryUserDto,
  UpdateUserDto,
  AssignRolesDto,
  ChangePasswordDto,
  ResetPasswordDto
} from './dto'
import { UsersService } from './users.service'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
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
  @RequirePermissions('user.read')
  async findAll(@Query() queryParams: QueryUserDto, @CurrentUser() currentUser: CurrentUserDto) {
    const users = await this.usersService.findAllWithPagination(queryParams)
    return {
      message: '获取用户列表成功',
      currentUser,
      ...users
    }
  }

  /**
   * 获取单个用户详情
   * GET /api/users/:id
   */
  @Get(':id')
  @RequirePermissions('user.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOneUser(id)
    return {
      message: '获取用户详情成功',
      user
    }
  }

  /**
   * 创建用户
   * POST /api/users
   */
  @Post()
  @RequirePermissions('user.create')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto)
    return {
      message: '创建用户成功',
      data: user
    }
  }

  /**
   * 更新用户 - 改名、头像。参考 updateUserDto
   * PUT /api/users/:id
   */
  @Put(':id')
  @RequirePermissions('user.update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.updateUser(id, updateUserDto)
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
  @RequirePermissions('user.delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteUser(id)
    return { message: '删除用户成功' }
  }

  /**
   * 为用户分配角色
   * PUT /api/users/:id/roles
   */
  @Put(':id/roles')
  @RequirePermissions('user.update')
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
  adminOnly(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '仅限管理员访问的路由 - 欢迎来到管理员仪表盘',
      currentUser
    }
  }

  /**
   * 需要特定权限的路由示例
   * GET /api/users/profile
   * */
  @Get('profile')
  @RequirePermissions('profile:read')
  getProfile(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: 'User profile',
      currentUser
    }
  }

  /**
   * 需要多个角色中的一个即可访问的路由示例
   * GET /api/users/editor
   * */
  @Get('editor')
  @RequireRoles('admin', 'editor')
  editorRoute(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '此路由可由管理员或编辑访问',
      currentUser
    }
  }

  /**
   * 需要多个权限全部满足才能访问的路由示例
   * GET /api/users/advanced
   * */
  @Get('advanced')
  @RequirePermissions('user.read', 'user.write')
  advancedRoute(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '此路由同时需要 user.read AND user.write 权限',
      currentUser
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
  @RequireRoles('admin-test')
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

  /**
   * 修改当前用户密码
   * PUT /api/users/change-password
   */
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() currentUser: CurrentUserDto,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.usersService.changePassword(
      currentUser.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword
    )
    return {
      message: '密码修改成功，请重新登录'
    }
  }

  /**
   * 管理员重置用户密码
   * PUT /api/users/:id/reset-password
   */
  @Put(':id/reset-password')
  @RequirePermissions('user.update')
  @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    await this.usersService.resetPassword(id, resetPasswordDto.newPassword)
    return {
      message: `用户 ${id} 的密码已重置`
    }
  }
}
