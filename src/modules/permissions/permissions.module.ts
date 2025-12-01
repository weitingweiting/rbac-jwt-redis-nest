import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PermissionsService } from './permissions.service'
import { PermissionsController } from './permissions.controller'
import { Permission } from '../../shared/entities/permission.entity'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), SharedModule],
  providers: [PermissionsService],
  controllers: [PermissionsController],
  exports: [PermissionsService]
})
export class PermissionsModule {}
