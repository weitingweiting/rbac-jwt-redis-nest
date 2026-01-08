import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SharedModule } from '@/shared/shared.module'

// Entities
import { DevelopmentApplication } from '@/shared/entities/development-application.entity'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import { ComponentCategory } from '@/shared/entities/component-category.entity'

import { DevelopmentApplicationsService } from './development-applications.service'
import { DevelopmentApplicationsController } from './development-applications.controller'

/**
 * 组件研发申请模块
 *
 * 新流程说明：
 * 1. 创建申请 → 待审核（PENDING_REVIEW）
 * 2. 管理员审核 → 通过（APPROVED）/ 拒绝（REJECTED）
 * 3. 审核通过后下载 supplement.json 进行开发
 * 4. 开发完成后上传组件包（由上传服务校验并创建版本）
 * 5. 上传成功 → 已完成（COMPLETED）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DevelopmentApplication,
      Component,
      ComponentVersion,
      ComponentCategory
    ]),
    SharedModule
  ],
  controllers: [DevelopmentApplicationsController],
  providers: [DevelopmentApplicationsService],
  exports: [DevelopmentApplicationsService]
})
export class DevelopmentApplicationsModule {}
