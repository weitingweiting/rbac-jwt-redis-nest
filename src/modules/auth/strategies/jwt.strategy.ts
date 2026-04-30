import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '@/modules/auth/auth.service'
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService,
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
      algorithms: ['HS256']
    })
  }

  async validate(request: any, payload: any) {
    // payload 包含 JWT 中的数据：{ sub: userId, username, iat }
    const token = request.headers.authorization?.replace('Bearer ', '')

    if (!payload || !payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload')
    }

    // 1. 检查 Token 是否在黑名单中
    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked')
    }

    // 2. 检查用户是否被强制登出
    if (
      payload.iat &&
      (await this.tokenBlacklistService.isUserBlacklisted(payload.sub, payload.iat))
    ) {
      throw new UnauthorizedException('User has been logged out')
    }

    // 3. 验证用户是否存在
    const user = await this.authService.validateToken(payload.sub)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      avatarUrl: user.avatarUrl,
      tokenIssuedAt: payload.iat
    }
  }
}
