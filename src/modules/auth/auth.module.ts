import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '@/shared/entities/user.entity';
import { jwtConfig } from '@/shared/config/jwt.config';
import { UserPermissionsService } from '@/shared/services/user-permissions.service';
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserPermissionsService, TokenBlacklistService],
  exports: [AuthService],
})
export class AuthModule { }
