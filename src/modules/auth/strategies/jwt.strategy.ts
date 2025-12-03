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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从 Bearer Token 中提取 JWT
      ignoreExpiration: false, // 不忽略过期时间，过期的 Token 会被拒绝
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true, // 允许在 validate 方法中访问 request, 以便获取完整的请求信息
      algorithms: ['HS256'] // 指定签名算法
    })
  }

  async validate(request: any, payload: any) {
    // payload 包含 JWT 中的数据：{ sub: userId, username, iat }
    // 为满足jwt规范.在登陆成功后，手动设置的 sub 字段，表示用户的唯一标识符（通常是用户ID）。
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

    // 返回的数据会被挂载到 request.user
    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      avatarUrl: user.avatarUrl,
      tokenIssuedAt: payload.iat // 保存 Token 签发时间
    }
  }
}
