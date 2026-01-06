import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common'
import { ComponentVersionsService } from '../services/component-versions.service'
import { QueryComponentVersionDto } from '../dto/component-version.dto'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'

/**
 * 组件版本管理控制器
 *
 * 提供版本的查询、发布、推荐设置、删除等功能
 */
@Controller()
@UseGuards(PermissionsGuard)
export class ComponentVersionsController {
  constructor(private readonly versionsService: ComponentVersionsService) {}

  /**
   * 获取组件版本列表
   * GET /api/components/:componentId/versions
   *
   * 支持查询参数：
   * - status: 版本状态（draft/published）
   * - isLatest: 是否推荐版本
   * - all: 是否查询所有版本（包括草稿）
   * - page, limit: 分页参数
   *
   * @param componentId - 组件ID（如：BarChart）
   * @param query - 查询参数
   */
  @Get('components/:componentId/versions')
  @RequirePermissions('component.read')
  async getVersionList(
    @Param('componentId') componentId: string,
    @Query() query: QueryComponentVersionDto
  ) {
    // 将 componentId 注入到查询参数中
    query.componentId = componentId

    const result = await this.versionsService.findAllWithPagination(query)

    return {
      message: '获取版本列表成功',
      ...result
    }
  }

  /**
   * 获取版本详情
   * GET /api/component-versions/:versionId
   *
   * @param versionId - 版本ID（数据库主键，number）
   */
  @Get('component-versions/:versionId')
  @RequirePermissions('component.read')
  async getVersionDetail(@Param('versionId', ParseIntPipe) versionId: number) {
    const version = await this.versionsService.findOneVersion(versionId)

    return {
      message: '获取版本详情成功',
      data: version
    }
  }

  /**
   * 发布版本（draft → published）
   * POST /api/component-versions/:versionId/publish
   *
   * 功能：
   * 1. 将版本状态从 draft 改为 published
   * 2. 更新组件的 publishedVersionCount
   * 3. 设置 publishedAt 时间戳
   * 4. 如果是首个发布版本，自动设为推荐版本
   *
   * 权限要求：component.publish（需要审核权限）
   *
   * @param versionId - 版本ID（数据库主键，number）
   */
  @Post('component-versions/:versionId/publish')
  @RequirePermissions('component.publish')
  async publishVersion(@Param('versionId', ParseIntPipe) versionId: number) {
    const version = await this.versionsService.publishVersion(versionId)

    return {
      message: '版本发布成功',
      data: {
        id: version.id,
        componentId: version.componentId,
        version: version.version,
        status: version.status,
        publishedAt: version.publishedAt
      }
    }
  }

  /**
   * 撤回发布（published → draft）
   * POST /api/component-versions/:versionId/unpublish
   *
   * 功能：
   * 1. 将版本状态从 published 改回 draft
   * 2. 更新组件的 publishedVersionCount（减1）
   * 3. 清空 publishedAt 时间戳
   *
   * 限制：
   * - 不能撤回推荐版本（isLatest=true），需先设置其他版本为推荐版
   *
   * 权限要求：component.publish
   *
   * @param versionId - 版本ID（数据库主键，number）
   */
  @Post('component-versions/:versionId/unpublish')
  @RequirePermissions('component.publish')
  async unpublishVersion(@Param('versionId', ParseIntPipe) versionId: number) {
    const version = await this.versionsService.unpublishVersion(versionId)

    return {
      message: '版本撤回发布成功',
      data: {
        id: version.id,
        componentId: version.componentId,
        version: version.version,
        status: version.status,
        publishedAt: version.publishedAt
      }
    }
  }

  /**
   * 设置推荐版本
   * POST /api/component-versions/:versionId/set-latest
   *
   * 功能：
   * 1. 将当前版本的 is_latest 设为 true
   * 2. 将同组件其他版本的 is_latest 设为 false（唯一性保证）
   *
   * 注意：
   * - 只有 published 状态的版本才能设为推荐
   * - 前端画布将使用推荐版本（is_latest=true）
   *
   * 权限要求：component.publish
   *
   * @param versionId - 版本ID（数据库主键，number）
   */
  @Post('component-versions/:versionId/set-latest')
  @RequirePermissions('component.publish')
  async setLatestVersion(@Param('versionId', ParseIntPipe) versionId: number) {
    // 先查询版本获取 componentId
    const versionInfo = await this.versionsService.findOneVersion(versionId)

    // 调用 Service 设置推荐版本
    const version = await this.versionsService.setLatestVersion(versionInfo.componentId, versionId)

    return {
      message: '推荐版本设置成功',
      data: {
        id: version.id,
        componentId: version.componentId,
        version: version.version,
        isLatest: version.isLatest
      }
    }
  }

  /**
   * 删除版本（软删除）
   * DELETE /api/component-versions/:versionId
   *
   * 功能：
   * 1. 软删除版本（设置 deleted_at）
   * 2. 更新组件的版本计数
   *
   * 注意：
   * - 如果删除的是推荐版本（is_latest=true），需要手动设置新的推荐版本
   * - 如果是 published 版本，会减少 publishedVersionCount
   *
   * 权限要求：component.delete
   *
   * @param versionId - 版本ID（数据库主键，number）
   */
  @Delete('component-versions/:versionId')
  @RequirePermissions('component.delete')
  async deleteVersion(@Param('versionId', ParseIntPipe) versionId: number) {
    await this.versionsService.deleteVersion(versionId)

    return {
      message: '版本删除成功'
    }
  }
}
