/**
 * 当前用户信息 DTO
 * 用于 @CurrentUser() 装饰器的类型定义
 * 对应 JWT Strategy 返回的用户信息
 */
export class CurrentUserDto {
  /**
   * 用户ID
   */
  id!: number;

  /**
   * 用户名
   */
  username!: string;

  /**
   * 邮箱
   */
  email!: string;

  /**
   * Token 签发时间戳
   */
  tokenIssuedAt!: number;
}