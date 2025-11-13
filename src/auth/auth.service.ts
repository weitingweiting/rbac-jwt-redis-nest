import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { createHash } from 'crypto';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) { }

  /**
   * 使用 SHA-256 哈希密码
   */
  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * 验证密码
   */
  private verifyPassword(password: string, hashedPassword: string): boolean {
    const inputHash = createHash('sha256').update(password).digest('hex');
    return inputHash === hashedPassword;
  }

  /**
   * 用户注册
   */
  async register(username: string, password: string, email: string): Promise<{ message: string }> {
    // 检查用户是否已存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // 密码加密
    const hashedPassword = this.hashPassword(password);

    // 创建用户（默认不分配角色，需要管理员分配）
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      email,
    });

    await this.userRepository.save(user);

    return { message: 'User registered successfully' };
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<{ accessToken: string; user: any }> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const isPasswordValid = this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 生成 JWT Token
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    // 返回 token 和用户信息（排除密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  /**
   * 验证 JWT Token 并返回用户信息
   */
  async validateToken(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * 刷新 Token（可选功能）
   */
  async refreshToken(userId: number): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * 用户登出（将 Token 加入黑名单）
   */
  async logout(token: string): Promise<{ message: string }> {
    try {
      // 解码 Token 获取过期时间
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) {
        throw new UnauthorizedException('Invalid token');
      }

      // 计算 Token 剩余有效时间
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;

      if (expiresIn > 0) {
        // 将 Token 加入黑名单
        await this.tokenBlacklistService.addToBlacklist(token, expiresIn);
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * 强制用户登出（将用户所有 Token 失效）
   */
  async forceLogout(userId: number): Promise<{ message: string }> {
    // 假设 Token 最长有效期为 24 小时
    const maxTokenLifetime = 24 * 60 * 60; // 24 小时（秒）
    await this.tokenBlacklistService.blacklistUser(userId, maxTokenLifetime);
    return { message: `User ${userId} has been forcefully logged out` };
  }
}
