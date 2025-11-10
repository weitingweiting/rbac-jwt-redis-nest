import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UsersController } from './controllers/users.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserPermissionsService } from './services/user-permissions.service';
import { RedisConfig } from './config/redis.config';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SeedService } from './seed/seed.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Module({
  imports: [
    RedisConfig,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 3306,
      username: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'rbac_demo',
      entities: [User, Role, Permission],
      synchronize: true, // 生产环境应禁用
    }),
    TypeOrmModule.forFeature([User, Role, Permission]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    UserPermissionsService,
    PermissionsGuard,
    RolesGuard,
    SeedService,
    TokenBlacklistService,
    // 全局应用 JWT Guard（所有接口默认需要认证，除非标记 @Public()）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
