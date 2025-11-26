import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  /**
   * 将 Token 加入黑名单
   * @param token JWT Token
   * @param expiresIn Token 剩余有效时间（秒）
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:token:${token}`
    // 设置过期时间为 Token 的剩余有效期
    await this.cacheManager.set(key, '1', expiresIn * 1000)
    console.log(`🚫 Token added to blacklist, expires in ${expiresIn}s`)
  }

  /**
   * 检查 Token 是否在黑名单中
   * @param token JWT Token
   * @returns true 表示在黑名单中（已失效）
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:token:${token}`
    const result = await this.cacheManager.get(key)
    return result !== null && result !== undefined
  }

  /**
   * 将用户的所有 Token 加入黑名单（强制登出）
   * @param userId 用户 ID
   * @param expiresIn Token 有效期（秒）
   */
  async blacklistUser(userId: number, expiresIn: number): Promise<void> {
    const key = `blacklist:user:${userId}`
    await this.cacheManager.set(key, Date.now().toString(), expiresIn * 1000)
    console.log(`🚫 All tokens for user ${userId} blacklisted`)
  }

  /**
   * 检查用户是否被强制登出
   * @param userId 用户 ID
   * @param tokenIssuedAt Token 签发时间（时间戳，秒）
   * @returns true 表示用户被强制登出
   */
  async isUserBlacklisted(userId: number, tokenIssuedAt: number): Promise<boolean> {
    const key = `blacklist:user:${userId}`
    const blacklistTime = await this.cacheManager.get<string>(key)

    if (!blacklistTime) {
      return false
    }

    // 如果 Token 签发时间早于黑名单时间，则视为已失效
    const blacklistTimestamp = parseInt(blacklistTime)
    return tokenIssuedAt * 1000 < blacklistTimestamp
  }

  /**
   * 移除用户黑名单（允许用户重新登录）
   * @param userId 用户 ID
   */
  async removeUserFromBlacklist(userId: number): Promise<void> {
    const key = `blacklist:user:${userId}`
    await this.cacheManager.del(key)
    console.log(`✅ User ${userId} removed from blacklist`)
  }
}
