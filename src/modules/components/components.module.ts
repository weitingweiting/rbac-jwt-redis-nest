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

@Module({
  imports: [
    TypeOrmModule.forFeature([ComponentCategory, Component, ComponentVersion]),
    SharedModule
  ],
  providers: [
    ComponentCategoriesService,
    ComponentsService,
    ComponentVersionsService,
    ComponentUploadService,
    ComponentValidationService
  ],
  controllers: [],
  exports: [
    ComponentCategoriesService,
    ComponentsService,
    ComponentVersionsService,
    ComponentUploadService,
    ComponentValidationService
  ]
})
export class ComponentsModule {}
