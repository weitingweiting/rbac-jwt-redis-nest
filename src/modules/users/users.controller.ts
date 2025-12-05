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

  // ==================== 查询操作 ====================

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

  // ==================== 创建操作 ====================

  /**
   * 创建用户（管理员）
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

  // ==================== 更新操作 ====================

  /**
   * 修改当前用户密码
   * PUT /api/users/me/password
   * 注意：必须在 PUT /api/users/:id 之前定义
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: CurrentUserDto
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
   * 更新用户信息（用户名、头像等）
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
   * 为用户分配角色（管理员）
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

  // ==================== 删除操作 ====================

  /**
   * 删除用户（管理员）
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @RequirePermissions('user.delete')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteUser(id)
    return { message: '删除用户成功' }
  }

  // ==================== 管理员专用操作 ====================

  /**
   * 管理员仪表盘（示例）
   * GET /api/users/admin/dashboard
   */
  @Get('admin/dashboard')
  @RequireRoles('admin')
  adminDashboard(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '欢迎来到管理员仪表盘',
      currentUser
    }
  }

  /**
   * 管理员重置用户密码
   * PUT /api/users/:id/reset-password
   */
  @Put(':id/reset-password')
  // @RequirePermissions('user.update')
  // @RequireRoles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    const messageResponse = await this.usersService.resetPassword(id, resetPasswordDto.newPassword)
    return {
      message: `用户 ${id} 的密码已重置，${messageResponse.message}`
    }
  }

  /**
   * 强制指定用户登出（管理员）
   * POST /api/users/:id/force-logout
   */
  @Post(':id/force-logout')
  @RequireRoles('admin-test')
  async forceLogoutUser(@Param('id', ParseIntPipe) id: number) {
    await this.authService.forceLogout(id)
    await this.userPermissionsService.clearUserCache(id)
    return {
      message: `用户 ${id} 已被强制登出`,
      success: true
    }
  }

  /**
   * 清除指定用户的权限缓存（管理员）
   * POST /api/users/:id/cache/clear
   */
  @Post(':id/cache/clear')
  @RequireRoles('admin')
  async clearUserCache(@Param('id', ParseIntPipe) id: number) {
    await this.userPermissionsService.clearUserCache(id)
    return {
      message: `已清除用户 ${id} 的权限缓存`,
      success: true
    }
  }

  // ==================== 权限示例路由（可选，用于测试） ====================

  /**
   * 编辑者路由示例（需要 admin 或 editor 角色之一）
   * GET /api/users/examples/editor
   */
  @Get('examples/editor')
  @RequireRoles('admin', 'editor')
  editorExample(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '此路由可由管理员或编辑访问',
      currentUser
    }
  }

  /**
   * 高级权限路由示例（需要多个权限）
   * GET /api/users/examples/advanced
   */
  @Get('examples/advanced')
  @RequirePermissions('user.read', 'user.write')
  advancedExample(@CurrentUser() currentUser: CurrentUserDto) {
    return {
      message: '此路由同时需要 user.read AND user.write 权限',
      currentUser
    }
  }
}
