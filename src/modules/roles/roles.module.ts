import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RolesService } from './roles.service'
import { RolesController } from './roles.controller'
import { Role } from '../../shared/entities/role.entity'
import { Permission } from '../../shared/entities/permission.entity'
import { User } from '../../shared/entities/user.entity'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User]), SharedModule],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService]
})
export class RolesModule {}
