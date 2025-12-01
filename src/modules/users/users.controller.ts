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
import { RequirePermissions } from '../../shared/decorators/permissions.decorator'
import { RequireRoles } from '../../shared/decorators/roles.decorator'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { PermissionsGuard } from '../../shared/guards/permissions.guard'
import { RolesGuard } from '../../shared/guards/roles.guard'
import { UserPermissionsService } from '../../shared/services/user-permissions.service'
import { AuthService } from '../auth/auth.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateUserDto, QueryUserDto, UpdateUserDto } from './dto/user.dto'
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

  @Get('admin')
  @RequireRoles('admin')
  adminOnly(@CurrentUser() user: any) {
    return {
      message: 'Admin only route - Welcome to admin dashboard',
      currentUser: user
    }
  }

  @Get('profile')
  @RequirePermissions('profile:read')
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'User profile',
      user
    }
  }

  @Get('editor')
  @RequireRoles('admin', 'editor')
  editorRoute(@CurrentUser() user: any) {
    return {
      message: 'This route is accessible by admin or editor',
      currentUser: user
    }
  }

  @Get('advanced')
  @RequirePermissions('users:read', 'users:write')
  advancedRoute(@CurrentUser() user: any) {
    return {
      message: 'This route requires both users:read AND users:write permissions',
      currentUser: user
    }
  }

  @Post('cache/clear/:userId')
  @RequireRoles('admin')
  async clearUserCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.userPermissionsService.clearUserCache(userId)
    return {
      message: `Cache cleared for user ${userId}`,
      success: true
    }
  }

  @Post('force-logout/:userId')
  @RequireRoles('admin')
  async forceLogoutUser(@Param('userId', ParseIntPipe) userId: number) {
    await this.authService.forceLogout(userId)
    // 同时清除权限缓存
    await this.userPermissionsService.clearUserCache(userId)
    return {
      message: `User ${userId} has been forcefully logged out`,
      success: true
    }
  }
}
