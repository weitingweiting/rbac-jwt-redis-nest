import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  UseGuards,
  Inject,
  StreamableFile
} from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { DevelopmentApplicationsService } from './development-applications.service'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'
import {
  CreateDevelopmentApplicationDto,
  UpdateDevelopmentApplicationDto,
  ReviewApplicationDto,
  QueryApplicationListDto
} from './dto'
import { DevelopmentStatus } from './constants/development-status.enum'

/**
 * development-applications
 */
@Controller('development-applications')
@UseGuards(PermissionsGuard)
export class DevelopmentApplicationsController {
  constructor(
    private readonly applicationsService: DevelopmentApplicationsService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 创建研发申请
   * POST /api/development-applications
   *
   * 支持三种申请类型：
   * - NEW: 新组件申请
   * - VERSION: 版本迭代申请
   * - REPLACE: 替换版本申请
   */
  @Post()
  @RequirePermissions('development:application:create')
  async create(@Body() dto: CreateDevelopmentApplicationDto, @CurrentUser() user: CurrentUserDto) {
    const result = await this.applicationsService.createApplication(dto, user.id)

    this.logger.info('创建研发申请成功', {
      applicationNo: result.applicationNo,
      applicationType: dto.applicationType,
      componentId: dto.componentId,
      userId: user.id
    })

    return {
      message: '创建研发申请成功',
      data: result
    }
  }

  /**
   * 获取申请列表
   * GET /api/development-applications
   */
  @Get()
  @RequirePermissions('development:application:read')
  async findAll(@Query() query: QueryApplicationListDto) {
    const result = await this.applicationsService.getApplicationList(query)

    return {
      message: '获取申请列表成功',
      ...result
    }
  }

  /**
   * 获取我的申请列表
   * GET /api/development-applications/mine
   */
  @Get('mine')
  @RequirePermissions('development:application:read')
  async findMine(@Query() query: QueryApplicationListDto, @CurrentUser() user: CurrentUserDto) {
    query.applicantId = user.id
    const result = await this.applicationsService.getApplicationList(query)

    return {
      message: '获取我的申请列表成功',
      ...result
    }
  }

  /**
   * 获取待审核申请列表
   * GET /api/development-applications/pending-review
   */
  @Get('pending-review')
  @RequirePermissions('development:application:review')
  async findPendingReview(@Query() query: QueryApplicationListDto) {
    // 强制筛选待审核状态
    query.status = DevelopmentStatus.PENDING_REVIEW
    const result = await this.applicationsService.getApplicationList(query)

    return {
      message: '获取待审核申请列表成功',
      ...result
    }
  }

  /**
   * 获取申请详情
   * GET /api/development-applications/:applicationNo
   */
  @Get(':applicationNo')
  @RequirePermissions('development:application:read')
  async findOne(@Param('applicationNo') applicationNo: string) {
    const result = await this.applicationsService.getApplicationDetail(applicationNo)

    return {
      message: '获取申请详情成功',
      data: result
    }
  }

  /**
   * 编辑申请信息
   * PATCH /api/development-applications/:applicationNo
   */
  @Patch(':applicationNo')
  @RequirePermissions('development:application:update')
  async update(
    @Param('applicationNo') applicationNo: string,
    @Body() dto: UpdateDevelopmentApplicationDto,
    @CurrentUser() user: CurrentUserDto
  ) {
    const result = await this.applicationsService.updateApplication(applicationNo, dto, user.id)

    this.logger.info('更新研发申请成功', {
      applicationNo,
      userId: user.id
    })

    return {
      message: '更新申请成功',
      data: result
    }
  }

  /**
   * 导出元数据补充文件
   * GET /api/development-applications/:applicationNo/export-meta
   */
  @Get(':applicationNo/export-meta')
  @RequirePermissions('development:application:read')
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="component.meta.supplement.json"')
  async exportMeta(@Param('applicationNo') applicationNo: string): Promise<StreamableFile> {
    const supplement = await this.applicationsService.exportMetaSupplement(applicationNo)
    const jsonContent = JSON.stringify(supplement, null, 2)
    const buffer = Buffer.from(jsonContent, 'utf-8')

    return new StreamableFile(buffer)
  }

  /**
   * 审核申请
   * POST /api/development-applications/:id/review
   */
  @Post(':applicationNo/review')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('development:application:review')
  async review(
    @Param('applicationNo') applicationNo: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() user: CurrentUserDto
  ) {
    // 注：自助审批功能由单独的接口实现，普通审核不允许审核自己的申请
    const result = await this.applicationsService.reviewApplication(
      applicationNo,
      dto,
      user.id,
      user.username,
      false // 普通审核不允许自助审批
    )

    this.logger.info('审核申请完成', {
      applicationNo,
      reviewerId: user.id,
      action: dto.reviewAction
    })

    return {
      message: dto.reviewAction === 'approve' ? '审核通过' : '审核驳回',
      data: result
    }
  }

  /**
   * 管理员自助审批
   * POST /api/development-applications/:applicationNo/self-approve
   */
  @Post(':applicationNo/self-approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('development:application:self-approve')
  async selfApprove(
    @Param('applicationNo') applicationNo: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser() user: CurrentUserDto
  ) {
    const result = await this.applicationsService.reviewApplication(
      applicationNo,
      dto,
      user.id,
      user.username,
      true // 允许自助审批
    )

    this.logger.info('管理员自助审批完成', {
      applicationNo,
      reviewerId: user.id,
      action: dto.reviewAction
    })

    return {
      message: dto.reviewAction === 'approve' ? '自助审批通过' : '自助审批驳回',
      data: result
    }
  }

  /**
   * 取消申请
   * POST /api/development-applications/:applicationNo/cancel
   */
  @Post(':applicationNo/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('development:application:update')
  async cancel(@Param('applicationNo') applicationNo: string, @CurrentUser() user: CurrentUserDto) {
    const result = await this.applicationsService.cancelApplication(applicationNo, user.id)

    this.logger.info('取消申请成功', {
      applicationNo,
      userId: user.id
    })

    return {
      message: '取消申请成功',
      data: result
    }
  }
}
