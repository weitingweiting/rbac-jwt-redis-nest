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
import { ProjectSpacesService } from './project-spaces.service'
import {
  CreateProjectSpaceDto,
  UpdateProjectSpaceDto,
  QueryProjectSpaceDto,
  AddUsersToSpaceDto
} from './dto/project-space.dto'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

@Controller('project-spaces')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectSpacesController {
  constructor(private readonly projectSpacesService: ProjectSpacesService) {}

  /**
   * 获取项目空间列表
   * GET /api/project-spaces?page=1&limit=10&name=xxx
   */
  @Get()
  @RequirePermissions('project-space.read')
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() query: QueryProjectSpaceDto,
    @CurrentUser() user: CurrentUserDto
  ) {
    const spaces = await this.projectSpacesService.findAllWithPagination(pagination, query, user.id)
    return {
      message: '获取项目空间列表成功',
      ...spaces
    }
  }

  /**
   * 获取单个项目空间详情
   * GET /api/project-spaces/:id
   */
  @Get(':id')
  @RequirePermissions('project-space.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const space = await this.projectSpacesService.findOneSpace(id)
    return {
      message: '获取项目空间详情成功',
      data: space
    }
  }

  /**
   * 创建项目空间
   * POST /api/project-spaces
   */
  @Post()
  @RequirePermissions('project-space.create')
  async create(@Body() createDto: CreateProjectSpaceDto, @CurrentUser() user: any) {
    const space = await this.projectSpacesService.createSpace(createDto, user.id)
    return {
      message: '创建项目空间成功',
      data: space
    }
  }

  /**
   * 更新项目空间
   * PUT /api/project-spaces/:id
   */
  @Put(':id')
  @RequirePermissions('project-space.update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProjectSpaceDto) {
    const space = await this.projectSpacesService.updateSpace(id, updateDto)
    return {
      message: '更新项目空间成功',
      data: space
    }
  }

  /**
   * 添加用户到项目空间
   * PUT /api/project-spaces/:id/users
   */
  @Put(':id/users')
  @RequirePermissions('project-space.update')
  async addUsers(@Param('id', ParseIntPipe) id: number, @Body() addUsersDto: AddUsersToSpaceDto) {
    const space = await this.projectSpacesService.addUsersToSpace(id, addUsersDto.userIds)
    return {
      message: '添加用户成功',
      data: space
    }
  }

  /**
   * 从项目空间移除用户
   * DELETE /api/project-spaces/:id/users/:userId
   */
  @Delete(':id/users/:userId')
  @RequirePermissions('project-space.update')
  async removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    const space = await this.projectSpacesService.removeUserFromSpace(id, userId)
    return {
      message: '移除用户成功',
      data: space
    }
  }

  /**
   * 删除项目空间（软删除）
   * DELETE /api/project-spaces/:id
   */
  @Delete(':id')
  @RequirePermissions('project-space.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.projectSpacesService.deleteSpace(id)
    return {
      message: '删除项目空间成功'
    }
  }
}
