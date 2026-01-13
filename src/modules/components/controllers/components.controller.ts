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
  FileTypeValidator,
  HttpStatus
} from '@nestjs/common'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
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
    const result = await this.componentsService.findAllWithPagination(query)
    return {
      message: '获取组件列表成功',
      ...result
    }
  }

  /**
   * 获取组件总览（树形结构）
   * GET /api/components/overview?keyword=xxx&status=draft&leaf=Level3
   *
   * 用于管理员页面的树形表格展示
   * 根据 leaf 参数返回不同深度的树形结构
   *
   * leaf 参数说明：
   * - Level1: 只返回一级分类（最轻量）
   * - Level2: 返回一、二级分类
   * - Level3: 返回一、二级分类、组件
   * - Level4: 返回一、二级分类、组件、版本（完整数据，默认）
   *
   * 树形结构示例：
   * - Level 1: 一级分类（如：图表）
   *   - Level 2: 二级分类（如：柱状图）
   *     - Level 3: 组件（如：BarChart）
   *       - Level 4: 版本（如：v1.2.0）
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
   * POST /api/components/upload?applicationNo=APP-20260112-0007
   *
   * 新流程（先审批，后开发）：
   * 1. 验证 ZIP 文件基本格式
   * 2. 解析 supplement.json（来自研发申请系统）
   * 3. 验证前端传递的 applicationNo 与 supplement.json 中的一致性（防止混用）
   * 4. 验证与研发申请记录的一致性
   * 5. 检查申请状态（必须为 APPROVED）
   * 6. 解析 meta.json（来自 abd-cli 构建）
   * 7. 验证两个 meta 文件的一致性
   * 8. 上传文件到 OSS
   * 9. 创建/更新组件和版本记录
   * 10. 更新申请状态为 COMPLETED
   *
   * @param file - ZIP 文件（必须包含 component.meta.json 和 component.meta.supplement.json）
   * @param applicationNo - 申请单号（必须与 supplement.json 中的一致，防止混用）
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
    @Query('applicationNo') applicationNo: string,
    @CurrentUser() currentUser: CurrentUserDto
  ) {
    // 验证必传参数
    if (!applicationNo) {
      throw new BusinessException(
        '缺少申请单号参数 applicationNo',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_PARAMS
      )
    }

    const result = await this.uploadService.processUpload(file, applicationNo, currentUser.id)

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
        // 研发申请相关
        applicationNo: result.applicationNo,
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
