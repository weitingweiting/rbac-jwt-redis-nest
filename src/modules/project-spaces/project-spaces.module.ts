import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectSpacesService } from './project-spaces.service'
import { ProjectSpacesController } from './project-spaces.controller'
import { ProjectSpace } from '../../shared/entities/project-space.entity'
import { User } from '../../shared/entities/user.entity'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [TypeOrmModule.forFeature([ProjectSpace, User]), SharedModule],
  providers: [ProjectSpacesService],
  controllers: [ProjectSpacesController],
  exports: [ProjectSpacesService]
})
export class ProjectSpacesModule {}
