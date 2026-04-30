import { Injectable, UnauthorizedException, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@/shared/entities/user.entity'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service'
import { UserPermissionsService } from '@/shared/services/user-permissions.service'
import { PasswordUtil } from '@/common/utils/password.util'
import {
  RegisterDto,
  LoginDto,
  LoginResponseDto,
  TokenResponseDto,
  MessageResponseDto
} from './dto'
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private userPermissionsService: UserPermissionsService
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<MessageResponseDto> {
    const { username, password } = registerDto

    const existingUsername = await this.userRepository.findOne({
      where: { username },
      withDeleted: false
    })

    if (existingUsername) {
      throw new BusinessException(
        '用户名已存在，请选择其他用户名',
        HttpStatus.CONFLICT,
        ERROR_CODES.USERNAME_EXISTS
      )
    }

    const hashedPassword = PasswordUtil.hashPassword(password)

    const user = this.userRepository.create({
      username,
      password: hashedPassword
    })

    await this.userRepository.save(user)

    return { message: '用户注册成功' }
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto

    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException(
        '用户名或密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    const isPasswordValid = PasswordUtil.verifyPassword(password, user.password)
    if (!isPasswordValid) {
      throw new BusinessException(
        '用户名或密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    await this.userPermissionsService.clearUserCache(user.id)

    const payload = {
      sub: user.id,
      username: user.username
    }

    const accessToken = this.jwtService.sign(payload)

    const { password: _, ...userWithoutPassword } = user

    return {
      accessToken,
      user: userWithoutPassword
    }
  }

  async validateToken(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
      withDeleted: false
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  /**
   * 刷新 Token
   */
  async refreshToken(userId: number): Promise<TokenResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException(
        '用户不存在，无法刷新Token',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      )
    }

    const payload = {
      sub: user.id,
      username: user.username
    }

    const accessToken = this.jwtService.sign(payload)

    return { accessToken }
  }

  /**
   * 用户登出
   */
  async logout(token: string): Promise<MessageResponseDto> {
    try {
      const decoded = this.jwtService.decode(token)
      console.log('🚀 ~ AuthService ~ logout ~ decoded:', decoded)
      if (!decoded || !decoded.exp) {
        throw new BusinessException(
          'Token格式无效',
          HttpStatus.UNAUTHORIZED,
          ERROR_CODES.TOKEN_INVALID
        )
      }

      const now = Math.floor(Date.now() / 1000)
      const expiresIn = decoded.exp - now

      if (expiresIn > 0) {
        await this.tokenBlacklistService.addToBlacklist(token, expiresIn)
      }

      const userId = (decoded as any).sub
      await this.userPermissionsService.clearUserCache(userId)

      return { message: `用户 ${userId} 已成功登出` }
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error
      }
      throw new BusinessException(
        'Token处理失败',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.TOKEN_INVALID
      )
    }
  }

  /**
   * 强制用户登出
   */
  async forceLogout(userId: number): Promise<MessageResponseDto> {
    const maxTokenLifetime = 24 * 60 * 60
    await this.tokenBlacklistService.blacklistUser(userId, maxTokenLifetime)
    return { message: `用户 ${userId} 已被强制登出` }
  }

  /**
   * 恢复用户登录状态
   */
  async restoreLogin(userId: number): Promise<MessageResponseDto> {
    await this.tokenBlacklistService.removeUserFromBlacklist(userId)
    return { message: `用户 ${userId} 允许重新登录` }
  }
}
