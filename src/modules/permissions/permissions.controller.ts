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
import { PermissionsService } from './permissions.service'
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto/permission.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { RequirePermissions } from '../../shared/decorators/permissions.decorator'
import { PermissionsGuard } from '../../shared/guards/permissions.guard'

@Controller('permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 获取权限列表
   * GET /api/permissions?page=1&limit=10&code=project
   */
  @Get()
  @RequirePermissions('permission.read')
  async findAll(@Query() pagination: PaginationDto, @Query() query: QueryPermissionDto) {
    const permissions = await this.permissionsService.findAllWithPagination(pagination, query)
    return {
      message: '获取权限列表成功',
      ...permissions
    }
  }

  /**
   * 获取单个权限详情
   * GET /api/permissions/:id
   */
  @Get(':id')
  @RequirePermissions('permission.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOnePermission(id)
    return {
      message: '获取权限详情成功',
      data: permission
    }
  }

  /**
   * 创建权限
   * POST /api/permissions
   */
  @Post()
  @RequirePermissions('permission.create')
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionsService.createPermission(createPermissionDto)
    return {
      message: '创建权限成功',
      data: permission
    }
  }

  /**
   * 更新权限
   * PUT /api/permissions/:id
   */
  @Put(':id')
  @RequirePermissions('permission.update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    const permission = await this.permissionsService.updatePermission(id, updatePermissionDto)
    return {
      message: '更新权限成功',
      data: permission
    }
  }

  /**
   * 删除权限（软删除）
   * DELETE /api/permissions/:id
   */
  @Delete(':id')
  @RequirePermissions('permission.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.deletePermission(id)
    return {
      message: '删除权限成功'
    }
  }
}
