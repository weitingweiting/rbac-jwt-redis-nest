import { createHash } from 'crypto'

/**
 * 密码工具类
 * 提供密码加密和验证的统一方法
 */
export class PasswordUtil {
  /**
   * 使用 SHA-256 哈希密码
   * @param password 明文密码
   * @returns 加密后的密码
   */
  static hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex')
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @param hashedPassword 加密后的密码
   * @returns 是否匹配
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    const inputHash = this.hashPassword(password)
    return inputHash === hashedPassword
  }
}
