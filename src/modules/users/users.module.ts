import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from '../../shared/entities/user.entity';
import { Role } from '../../shared/entities/role.entity';
import { Permission } from '../../shared/entities/permission.entity';
import { UserPermissionsService } from '../../shared/services/user-permissions.service';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserPermissionsService],
  exports: [UsersService, UserPermissionsService],
})
export class UsersModule { }