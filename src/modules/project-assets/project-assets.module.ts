import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectAssetsService } from './project-assets.service'
import { ProjectAssetsController } from './project-assets.controller'
import { ProjectAsset } from '../../shared/entities/project-asset.entity'
import { Project } from '../../shared/entities/project.entity'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAsset, Project]), SharedModule],
  providers: [ProjectAssetsService],
  controllers: [ProjectAssetsController],
  exports: [ProjectAssetsService]
})
export class ProjectAssetsModule {}
