import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Permission } from '../../shared/entities/permission.entity'
import { Role } from '../../shared/entities/role.entity'
import { User } from '../../shared/entities/user.entity'
import { SharedModule } from '../../shared/shared.module'
import { AuthModule } from '../auth/auth.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    SharedModule, // 导入共享模块获取 UserPermissionsService
    AuthModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
