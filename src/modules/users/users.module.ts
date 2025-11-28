import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Permission } from '../../shared/entities/permission.entity'
import { Role } from '../../shared/entities/role.entity'
import { User } from '../../shared/entities/user.entity'
import { UserPermissionsService } from '../../shared/services/user-permissions.service'
import { AuthModule } from '../auth/auth.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UserPermissionsService],
  exports: [UsersService, UserPermissionsService]
})
export class UsersModule {}
