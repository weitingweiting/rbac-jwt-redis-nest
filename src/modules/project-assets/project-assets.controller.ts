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
import { ProjectAssetsService } from './project-assets.service'
import {
  CreateProjectAssetDto,
  UpdateProjectAssetDto,
  QueryProjectAssetDto
} from './dto/project-asset.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { RequirePermissions } from '../../shared/decorators/permissions.decorator'
import { PermissionsGuard } from '../../shared/guards/permissions.guard'

@Controller('project-assets')
@UseGuards(PermissionsGuard)
export class ProjectAssetsController {
  constructor(private readonly projectAssetsService: ProjectAssetsService) {}

  /**
   * 获取项目资源列表
   * GET /api/project-assets?page=1&limit=10&projectId=1&type=image
   */
  @Get()
  @RequirePermissions('project-asset.read')
  async findAll(@Query() pagination: PaginationDto, @Query() query: QueryProjectAssetDto) {
    const assets = await this.projectAssetsService.findAllWithPagination(pagination, query)
    return {
      message: '获取项目资源列表成功',
      ...assets
    }
  }

  /**
   * 获取单个项目资源详情
   * GET /api/project-assets/:id
   */
  @Get(':id')
  @RequirePermissions('project-asset.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const asset = await this.projectAssetsService.findOneAsset(id)
    return {
      message: '获取项目资源详情成功',
      data: asset
    }
  }

  /**
   * 创建项目资源
   * POST /api/project-assets
   */
  @Post()
  @RequirePermissions('project-asset.create')
  async create(@Body() createDto: CreateProjectAssetDto) {
    const asset = await this.projectAssetsService.createAsset(createDto)
    return {
      message: '创建项目资源成功',
      data: asset
    }
  }

  /**
   * 更新项目资源
   * PUT /api/project-assets/:id
   */
  @Put(':id')
  @RequirePermissions('project-asset.update')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProjectAssetDto) {
    const asset = await this.projectAssetsService.updateAsset(id, updateDto)
    return {
      message: '更新项目资源成功',
      data: asset
    }
  }

  /**
   * 删除项目资源（软删除）
   * DELETE /api/project-assets/:id
   */
  @Delete(':id')
  @RequirePermissions('project-asset.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.projectAssetsService.deleteAsset(id)
    return {
      message: '删除项目资源成功'
    }
  }
}
