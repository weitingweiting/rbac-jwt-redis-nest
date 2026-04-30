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
import { ComponentsService } from '@/modules/components/services/components.service'
import { ComponentUploadService } from '@/modules/components/services/component-upload.service'
import { QueryComponentDto } from '@/modules/components/dto/component.dto'
import {
  ComponentOverviewDto,
  CanvasOverviewDto
} from '@/modules/components/dto/component-overview.dto'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'
import { COMPONENT_FILE_UPLOAD_RULES } from '@/modules/components/constants/validation-rules.constant'

/**
 * 组件管理控制器
 *
 * 提供组件的查询、上传、删除等功能
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
   * GET /api/components?page=1&limit=10&keyword=xxx&classificationLevel1=chart&classificationLevel2=bar&hasPublishedVersion=true
   *
   */
  @Get()
  @RequirePermissions('component.read')
  async findAll(@Query() query: QueryComponentDto, @CurrentUser() user: CurrentUserDto) {
    const result = await this.componentsService.findAllWithPagination(query, user)
    return {
      message: '获取组件列表成功',
      ...result
    }
  }

  /**
   * 获取组件总览（树形结构）
   * GET /api/components/overview?keyword=xxx&status=draft&leaf=Level3
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
   * 获取画布场景的组件总览（树形结构）
   * GET /api/components/overview-for-canvas?keyword=xxx&classificationLevel1=chart&includeDrafts=true
   */
  @Get('overview-for-canvas')
  @RequirePermissions('component.read')
  async getOverviewForCanvas(
    @Query() query: CanvasOverviewDto,
    @CurrentUser() user: CurrentUserDto
  ) {
    const tree = await this.componentsService.getOverviewForCanvas(query, user)
    return {
      message: '获取画布场景组件总览成功',
      data: tree
    }
  }

  /**
   * 获取单个组件详情
   * GET /api/components/:componentId
   *
   * @param componentId - 组件ID
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
   * 流程：先审批，后开发，最后上传组件包
   *
   * @param file
   * @param applicationNo - 申请单号（必须与 supplement.json 中的一致，防止混用）
   * @param currentUser
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
