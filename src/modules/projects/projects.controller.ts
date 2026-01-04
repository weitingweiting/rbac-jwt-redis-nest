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
import { ProjectsService } from './projects.service'
import {
  CreateProjectDto,
  UpdateProjectDto,
  QueryProjectDto,
  PublishProjectDto
} from './dto/project.dto'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

@Controller('projects')
@UseGuards(PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * 获取项目列表
   * GET /api/projects?page=1&limit=10&name=xxx&status=draft&projectSpaceId=1
   */
  @Get()
  @RequirePermissions('project.read')
  async findAll(@Query() query: QueryProjectDto, @CurrentUser() currentUser: CurrentUserDto) {
    const projects = await this.projectsService.findAllWithPagination(query, currentUser.id)
    return {
      message: '获取项目列表成功',
      ...projects
    }
  }

  /**
   * 获取单个项目详情
   * GET /api/projects/:id
   */
  @Get(':id')
  @RequirePermissions('project.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.findOneProject(id)
    return {
      message: '获取项目详情成功',
      data: project
    }
  }

  /**
   * 创建项目
   * POST /api/projects
   */
  @Post()
  @RequirePermissions('project.create')
  async create(@Body() createDto: CreateProjectDto, @CurrentUser() currentUser: CurrentUserDto) {
    const project = await this.projectsService.createProject(createDto, currentUser.id)
    return {
      message: '创建项目成功',
      data: project
    }
  }

  /**
   * 更新项目
   * PUT /api/projects/:id
   */
  @Put(':id')
  @RequirePermissions('project.update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProjectDto) {
    const project = await this.projectsService.updateProject(id, updateDto)
    return {
      message: '更新项目成功',
      data: project
    }
  }

  /**
   * 发布项目
   * PUT /api/projects/:id/publish
   */
  @Put(':id/publish')
  @RequirePermissions('project.publish')
  async publish(@Param('id', ParseIntPipe) id: number, @Body() publishDto: PublishProjectDto) {
    const project = await this.projectsService.publishProject(id, publishDto.publishUrl)
    return {
      message: '发布项目成功',
      data: project
    }
  }

  /**
   * 归档项目
   * PUT /api/projects/:id/archive
   */
  @Put(':id/archive')
  @RequirePermissions('project.update')
  async archive(@Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.archiveProject(id)
    return {
      message: '归档项目成功',
      data: project
    }
  }

  /**
   * 删除项目（软删除）
   * DELETE /api/projects/:id
   */
  @Delete(':id')
  @RequirePermissions('project.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id)
    return {
      message: '删除项目成功'
    }
  }

  /**
   * 更新项目封面
   * PUT /api/projects/:id/cover
   */
  @Put(':id/cover')
  @RequirePermissions('project.update')
  async updateCover(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { coverUrl: string; sceneJson?: string }
  ) {
    const project = await this.projectsService.updateCover(id, body.coverUrl, body.sceneJson)
    return {
      message: '更新封面成功',
      data: {
        coverUrl: project.coverUrl,
        sceneJson: project.sceneJson
      }
    }
  }

  /**
   * 删除项目封面
   * DELETE /api/projects/:id/cover
   */
  @Delete(':id/cover')
  @RequirePermissions('project.update')
  async deleteCover(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteCover(id)
    return {
      message: '删除封面成功'
    }
  }
}
