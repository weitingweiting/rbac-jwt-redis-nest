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
