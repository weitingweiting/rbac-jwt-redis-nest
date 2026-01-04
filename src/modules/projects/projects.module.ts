import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { Project } from '@/shared/entities/project.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import { SharedModule } from '@/shared/shared.module'
import { OSSService } from '@/shared/services/oss.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectSpace]), SharedModule],
  providers: [ProjectsService, OSSService],
  controllers: [ProjectsController],
  exports: [ProjectsService]
})
export class ProjectsModule {}
