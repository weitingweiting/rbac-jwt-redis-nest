import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User } from '@/shared/entities/user.entity'
import { getJwtConfig } from '@/shared/config/jwt.config'
import { SharedModule } from '@/shared/shared.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    SharedModule, // 导入共享模块获取 UserPermissionsService 和 TokenBlacklistService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
