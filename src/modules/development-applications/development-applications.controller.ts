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
  Res,
  UseGuards,
  Inject
} from '@nestjs/common'
import { Response } from 'express'
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
 *
 * 新流程说明：
 * 1. 创建申请（填写组件信息）→ PENDING_REVIEW
 * 2. 管理员审核申请（是否允许开发）→ APPROVED / REJECTED
 * 3. 审核通过后，用户下载 supplement.json 开始开发
 * 4. 开发完成后，上传组件包（由上传服务校验 meta.json + supplement.json）
 * 5. 校验成功 → COMPLETED（组件入库 draft）
 * 6. 校验失败 → 保持 APPROVED（用户可重新上传）
 *
 * 管理接口：
 * - POST   /                    创建申请
 * - GET    /                    查询申请列表
 * - GET    /mine                查询我的申请
 * - GET    /pending-review      查询待审核申请（审核人员用）
 * - GET    /:applicationNo          查询申请详情
 * - PATCH  /:applicationNo          编辑申请（仅待审核状态）
 * - GET    /:applicationNo/export-meta     导出元数据补充文件（仅审核通过状态）
 * - POST   /:applicationNo/review          审核申请
 * - POST   /:applicationNo/self-approve    管理员自助审批
 * - POST   /:applicationNo/cancel          取消申请（仅待审核状态）
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
   *
   * 支持筛选：状态、申请类型、组件ID、申请人、关键词
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
   *
   * 获取当前用户提交的申请列表
   */
  @Get('mine')
  @RequirePermissions('development:application:read')
  async findMine(@Query() query: QueryApplicationListDto, @CurrentUser() user: CurrentUserDto) {
    // 覆盖 applicantId 为当前用户
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
   *
   * 获取所有待审核状态的申请（审核人员使用）
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
   *
   * 仅允许在待审核状态下编辑
   * 仅允许申请人本人编辑
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
   *
   * 返回 component.meta.supplement.json 文件
   * 新流程：只有审核通过状态才能下载
   * 开发者需要将此文件放入组件目录，由 abd-cli 构建时合并
   */
  @Get(':applicationNo/export-meta')
  @RequirePermissions('development:application:read')
  async exportMeta(@Param('applicationNo') applicationNo: string, @Res() res: Response) {
    const supplement = await this.applicationsService.exportMetaSupplement(applicationNo)

    const filename = `component.meta.supplement.json`

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    return res.send(JSON.stringify(supplement, null, 2))
  }

  /**
   * 审核申请
   * POST /api/development-applications/:id/review
   *
   * 新流程说明：
   * - 管理员审核的是"是否允许开发该组件"
   * - 审核通过后状态变为 APPROVED，用户才能下载 supplement.json
   * - 不能审核自己的申请（除非使用自助审批接口）
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
   *
   * 允许管理员审批自己的申请
   * 需要特殊权限：development:application:self-approve
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
   *
   * 取消待审核状态的申请
   * 仅允许申请人本人取消
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
