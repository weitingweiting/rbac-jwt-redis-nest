import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Logger } from 'winston'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
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
    this.logger.info(`🚫 Token 已加入黑名单，剩余有效期 ${expiresIn} 秒`)
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
   * admin专用，将用户加入黑名单
   * 和token加入黑名单不同，这里是将用户的所有Token都加入黑名单。
   * 意味着用户多处的登录状态都会被强制登出。（假设用户多端多处登录）
   * @param userId 用户 ID
   * @param expiresIn Token 有效期（秒）
   */
  async blacklistUser(userId: number, expiresIn: number): Promise<void> {
    const key = `blacklist:user:${userId}`
    await this.cacheManager.set(key, Date.now().toString(), expiresIn * 1000)
    this.logger.info(`🚫 用户 ${userId} 的所有 Token 已加入黑名单，剩余有效期 ${expiresIn} 秒`)
  }

  /**
   * 移除用户黑名单（允许用户重新登录）
   * @param userId 用户 ID
   */
  async removeUserFromBlacklist(userId: number): Promise<void> {
    const key = `blacklist:user:${userId}`
    await this.cacheManager.del(key)
    this.logger.info(`✅ 用户 ${userId} 已从黑名单中移除，允许重新登录`)
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

    // 如果没有黑名单时间，表示用户未被强制登出
    // 或者是者黑名单已过期
    if (!blacklistTime) {
      return false
    }

    // 必须等待黑名单过期模式
    // if (blacklistTime) {
    //   return true
    // }

    // 踢出用户，用户可以重新登录模式
    // 会比较用户重新签发的 Token
    // 如果最新的 Token 签发时间在黑名单之后，则表示用户重新登录，允许访问
    const blacklistTimestamp = parseInt(blacklistTime)
    return tokenIssuedAt * 1000 < blacklistTimestamp
  }
}
