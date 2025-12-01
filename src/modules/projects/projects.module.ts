import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { Project } from '../../shared/entities/project.entity'
import { ProjectSpace } from '../../shared/entities/project-space.entity'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectSpace]), SharedModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService]
})
export class ProjectsModule {}
