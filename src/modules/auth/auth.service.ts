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

    // 检查用户名是否已存在（排除软删除的用户）
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

    // 密码加密
    const hashedPassword = PasswordUtil.hashPassword(password)

    // 创建用户（默认不分配角色，需要管理员分配）
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

    // 查找用户（排除软删除的用户）
    const user = await this.userRepository.findOne({
      where: { username },
      relations: { roles: { permissions: true } },
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException(
        '用户名或密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    // 验证密码
    const isPasswordValid = PasswordUtil.verifyPassword(password, user.password)
    if (!isPasswordValid) {
      throw new BusinessException(
        '用户名或密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    // 登录成功，清除该用户的权限缓存
    await this.userPermissionsService.clearUserCache(user.id)

    // 生成 JWT Token
    const payload = {
      sub: user.id,
      username: user.username
    }

    const accessToken = this.jwtService.sign(payload)

    // 返回 token 和用户信息（排除密码）
    const { password: _, ...userWithoutPassword } = user

    return {
      accessToken,
      user: userWithoutPassword
    }
  }

  /**
   * 验证 JWT Token 并返回用户信息
   */
  async validateToken(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true },
      withDeleted: false // 不返回软删除的用户
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return user
  }

  /**
   * 刷新 Token（可选功能）
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
   * 用户登出（将 Token 加入黑名单）
   */
  async logout(token: string): Promise<MessageResponseDto> {
    try {
      // 解码 Token 获取过期时间
      const decoded = this.jwtService.decode(token)
      console.log('🚀 ~ AuthService ~ logout ~ decoded:', decoded)
      if (!decoded || !decoded.exp) {
        throw new BusinessException(
          'Token格式无效',
          HttpStatus.UNAUTHORIZED,
          ERROR_CODES.TOKEN_INVALID
        )
      }

      // 计算 Token 剩余有效时间
      const now = Math.floor(Date.now() / 1000)
      const expiresIn = decoded.exp - now

      if (expiresIn > 0) {
        // 将 Token 加入黑名单
        await this.tokenBlacklistService.addToBlacklist(token, expiresIn)
      }

      // 清除该用户的权限缓存
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
   * 强制用户登出（将用户所有 Token 失效）
   */
  async forceLogout(userId: number): Promise<MessageResponseDto> {
    // 假设 Token 最长有效期为 24 小时
    const maxTokenLifetime = 24 * 60 * 60 // 24 小时（秒）
    await this.tokenBlacklistService.blacklistUser(userId, maxTokenLifetime)
    return { message: `用户 ${userId} 已被强制登出` }
  }

  /**
   * 恢复用户登录状态（将用户从黑名单放出）
   */
  async restoreLogin(userId: number): Promise<MessageResponseDto> {
    // 将用户的黑名单记录删除
    await this.tokenBlacklistService.removeUserFromBlacklist(userId)
    return { message: `用户 ${userId} 允许重新登录` }
  }
}
