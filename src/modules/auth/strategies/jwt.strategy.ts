import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { TokenBlacklistService } from '../../../shared/services/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      passReqToCallback: true, // 允许在 validate 方法中访问 request
    });
  }

  async validate(request: any, payload: any) {
    // payload 包含 JWT 中的数据：{ sub: userId, username, email, iat }
    const token = request.headers.authorization?.replace('Bearer ', '');

    // 1. 检查 Token 是否在黑名单中
    if (token && await this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 2. 检查用户是否被强制登出
    if (payload.iat && await this.tokenBlacklistService.isUserBlacklisted(payload.sub, payload.iat)) {
      throw new UnauthorizedException('User has been logged out');
    }

    // 3. 验证用户是否存在
    const user = await this.authService.validateToken(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // 返回的数据会被挂载到 request.user
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      tokenIssuedAt: payload.iat, // 保存 Token 签发时间
    };
  }
}
