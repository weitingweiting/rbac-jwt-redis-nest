import { Controller, Post, Body, HttpCode, HttpStatus, Get, Headers, Inject } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { CurrentUser } from './decorators/current-user.decorator'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { RegisterDto, LoginDto } from './dto'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  /**
   * 用户注册
   * POST /api/auth/register
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto)
    this.logger.info('User registered successfully', {
      username: registerDto.username
    })
    return result
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto)
      this.logger.info('User logged in successfully', {
        username: loginDto.username,
        userId: result.user.id
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn('User login failed', {
        username: loginDto.username,
        reason: errorMessage
      })
      throw error
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserDto) {
    return {
      message: '获取用户信息成功',
      user
    }
  }

  /**
   * 刷新 Token
   * POST /api/auth/refresh
   */
  @Post('refresh')
  async refreshToken(@CurrentUser() user: CurrentUserDto) {
    // Token 刷新是安全相关操作，值得记录
    this.logger.info('Token refreshed', {
      userId: user.id,
      username: user.username
    })
    return this.authService.refreshToken(user.id)
  }

  /**
   * 用户登出
   * POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '')
    if (!token) {
      this.logger.warn('尝试登出但未提供令牌')
      return { message: '未提供令牌' }
    }

    try {
      const result = await this.authService.logout(token)
      this.logger.info('用户登出成功')
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error('登出失败', {
        error: errorMessage
      })
      throw error
    }
  }
}
