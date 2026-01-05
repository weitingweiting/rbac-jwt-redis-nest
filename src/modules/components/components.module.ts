import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SharedModule } from '@/shared/shared.module'

// Entities
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'

// Services
import { ComponentCategoriesService } from './services/component-categories.service'
import { ComponentsService } from './services/components.service'
import { ComponentVersionsService } from './services/component-versions.service'
import { ComponentUploadService } from './services/component-upload.service'
import { ComponentValidationService } from './services/component-validation.service'

// Controllers
import { ComponentsController } from './controllers/components.controller'
import { ComponentVersionsController } from './controllers/component-versions.controller'

// External modules
import { OSSModule } from '@/modules/oss/oss.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ComponentCategory, Component, ComponentVersion]),
    SharedModule,
    OSSModule
  ],
  providers: [
    ComponentCategoriesService,
    ComponentsService,
    ComponentVersionsService,
    ComponentUploadService,
    ComponentValidationService
  ],
  controllers: [ComponentsController, ComponentVersionsController],
  exports: [
    ComponentCategoriesService,
    ComponentsService,
    ComponentVersionsService,
    ComponentUploadService,
    ComponentValidationService
  ]
})
export class ComponentsModule {}
