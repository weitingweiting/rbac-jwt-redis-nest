import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '@/shared/entities/user.entity'
import { Role } from '@/shared/entities/role.entity'
import { Permission } from '@/shared/entities/permission.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import { Project } from '@/shared/entities/project.entity'
import { ProjectAsset } from '@/shared/entities/project-asset.entity'
import { getDatabaseConfig } from '@/shared/config/database.config'
import { DatabaseHealthService } from '@/shared/services/database-health.service'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'

@Module({
  imports: [
    getDatabaseConfig(),
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      ProjectSpace,
      Project,
      ProjectAsset,
      ComponentCategory,
      Component,
      ComponentVersion
    ])
  ],
  providers: [DatabaseHealthService],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
