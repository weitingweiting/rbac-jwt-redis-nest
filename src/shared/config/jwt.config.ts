import { JwtModuleOptions } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

/**
 * JWT 配置工厂函数
 * 使用 ConfigService 动态获取配置
 * @param configService - NestJS 配置服务
 * @returns JWT 模块配置选项
 */
export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get('jwt.expiresIn')
  }
})
