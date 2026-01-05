import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ComponentsService } from '../services/components.service'
import { ComponentUploadService } from '../services/component-upload.service'
import { QueryComponentDto } from '../dto/component.dto'
import { ComponentOverviewDto } from '../dto/component-overview.dto'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'
import { COMPONENT_FILE_UPLOAD_RULES } from '../constants/validation-rules.constant'

/**
 * 组件管理控制器
 *
 * 提供组件的查询、上传、删除等功能
 * 注意：组件信息的修改通过上传新版本实现，不提供直接更新接口
 */
@Controller('components')
@UseGuards(PermissionsGuard)
export class ComponentsController {
  constructor(
    private readonly componentsService: ComponentsService,
    private readonly uploadService: ComponentUploadService
  ) {}

  /**
   * 获取组件列表（分页、筛选）
   * GET /api/components?page=1&limit=10&keyword=xxx&classificationLevel1=chart&hasPublishedVersion=true
   */
  @Get()
  @RequirePermissions('component.read')
  async findAll(@Query() query: QueryComponentDto) {
    console.log('🚀 ~ ComponentsController ~ findAll ~ query:', query)
    const result = await this.componentsService.findAllWithPagination(query)
    return {
      message: '获取组件列表成功',
      ...result
    }
  }

  /**
   * 获取组件总览（树形结构）
   * GET /api/components/overview?keyword=xxx&status=draft&framework=Vue 3
   *
   * 用于管理员页面的树形表格展示
   * 返回完整的分类树 → 组件 → 版本的4层嵌套结构
   *
   * 树形结构：
   * - Level 1: 一级分类（如：图表）
   * - Level 2: 二级分类（如：柱状图）
   * - Level 3: 组件（如：BarChart）
   * - Level 4: 版本（如：v1.2.0）
   */
  @Get('overview')
  @RequirePermissions('component.read')
  async getOverview(@Query() query: ComponentOverviewDto) {
    const tree = await this.componentsService.getComponentOverview(query)
    return {
      message: '获取组件总览成功',
      data: tree
    }
  }

  /**
   * 获取单个组件详情
   * GET /api/components/:componentId
   *
   * @param componentId - 组件ID（如：BarChart）
   */
  @Get(':componentId')
  @RequirePermissions('component.read')
  async findOne(@Param('componentId') componentId: string) {
    const component = await this.componentsService.findOneComponent(componentId)
    return {
      message: '获取组件详情成功',
      data: component
    }
  }

  /**
   * 上传组件 ZIP 包
   * POST /api/components/upload
   *
   * 流程：
   * 1. 验证 ZIP 文件结构
   * 2. 解析 component.meta.json
   * 3. 上传文件到 OSS
   * 4. 创建/更新组件记录
   * 5. 创建版本记录
   *
   * @param file - ZIP 文件（必须包含 component.meta.json）
   * @param currentUser - 当前用户信息
   */
  @Post('upload')
  @RequirePermissions('component.create')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: COMPONENT_FILE_UPLOAD_RULES.MAX_ZIP_SIZE,
            message: `文件大小不能超过 ${COMPONENT_FILE_UPLOAD_RULES.MAX_ZIP_SIZE_MB}MB`
          }),
          new FileTypeValidator({
            fileType: 'application/zip'
          })
        ]
      })
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: CurrentUserDto
  ) {
    const result = await this.uploadService.processUpload(file, currentUser.id)

    return {
      message: result.isNewComponent ? '组件上传成功（新组件）' : '组件版本上传成功',
      data: {
        component: {
          componentId: result.component.componentId,
          name: result.component.name,
          description: result.component.description,
          classificationLevel1: result.component.classificationLevel1,
          classificationLevel2: result.component.classificationLevel2,
          versionCount: result.component.versionCount,
          publishedVersionCount: result.component.publishedVersionCount
        },
        version: {
          id: result.version.id,
          version: result.version.version,
          status: result.version.status,
          entryUrl: result.version.entryUrl,
          styleUrl: result.version.styleUrl,
          previewUrl: result.version.previewUrl,
          type: result.version.type,
          framework: result.version.framework
        },
        isNewComponent: result.isNewComponent,
        isNewVersion: result.isNewVersion,
        warnings: result.warnings
      }
    }
  }

  /**
   * 删除组件
   * DELETE /api/components/:componentId
   *
   * 注意：
   * - 只能删除没有已发布版本的组件
   * - 删除操作为软删除（可恢复）
   * - 会级联软删除所有关联的版本记录
   *
   * @param componentId - 组件ID（如：BarChart）
   */
  @Delete(':componentId')
  @RequirePermissions('component.delete')
  async remove(@Param('componentId') componentId: string) {
    await this.componentsService.deleteComponent(componentId)
    return {
      message: '删除组件成功'
    }
  }
}
