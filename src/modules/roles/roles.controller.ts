import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common'
import { RolesService } from './roles.service'
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto, AssignPermissionsDto } from './dto/role.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * 获取角色列表
   * GET /api/roles?page=1&limit=10&name=admin
   */
  @Get()
  @RequirePermissions('role.read')
  async findAll(@Query() queryRoleDto: QueryRoleDto) {
    const roles = await this.rolesService.findAllWithPagination(queryRoleDto)
    return {
      message: '获取角色列表成功',
      ...roles
    }
  }

  /**
   * 获取单个角色详情
   * GET /api/roles/:id
   */
  @Get(':id')
  @RequirePermissions('role.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOneRole(id)
    return {
      message: '获取角色详情成功',
      data: role
    }
  }

  /**
   * 创建角色
   * POST /api/roles
   */
  @Post()
  @RequirePermissions('role.create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.createRole(createRoleDto)
    return {
      message: '创建角色成功',
      data: role
    }
  }

  /**
   * 更新角色
   * PUT /api/roles/:id
   */
  @Put(':id')
  @RequirePermissions('role.update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesService.updateRole(id, updateRoleDto)
    return {
      message: '更新角色成功',
      data: role
    }
  }

  /**
   * 为角色分配权限
   * PUT /api/roles/:id/permissions
   */
  @Put(':id/permissions')
  @RequirePermissions('role.update')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ) {
    const role = await this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds)
    return {
      message: '分配权限成功',
      data: role
    }
  }

  /**
   * 删除角色（软删除）
   * DELETE /api/roles/:id
   */
  @Delete(':id')
  @RequirePermissions('role.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.deleteRole(id)
    return {
      message: '删除角色成功'
    }
  }
}
