import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OSSController } from './oss.controller'
import { OSSService } from '../../shared/services/oss.service'
import { Project } from '../../shared/entities/project.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [OSSController],
  providers: [OSSService],
  exports: [OSSService]
})
export class OSSModule {}
