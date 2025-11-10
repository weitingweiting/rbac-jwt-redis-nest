# Token 黑名单功能说明

## 功能概述

Token 黑名单功能用于实现用户登出后立即失效 JWT Token，以及管理员强制踢出用户的能力。

## 核心特性

### 1. 用户主动登出
- 用户调用 `/auth/logout` 接口
- Token 被加入 Redis 黑名单
- 该 Token 立即失效，无法继续访问受保护接口
- 黑名单记录会在 Token 原本的过期时间自动清除

### 2. 管理员强制登出
- 管理员调用 `/users/force-logout/:userId` 接口
- 将指定用户的所有 Token 失效
- 用户需要重新登录才能继续使用系统

### 3. 自动过期
- 黑名单记录使用 Redis 的 TTL 机制
- 当 Token 过期后，黑名单记录自动删除
- 不会占用额外的存储空间

## 技术实现

### 数据结构

#### 单个 Token 黑名单
```
Key: blacklist:token:<token>
Value: 1
TTL: Token 剩余有效时间（秒）
```

#### 用户级黑名单（强制登出）
```
Key: blacklist:user:<userId>
Value: 黑名单创建时间戳（毫秒）
TTL: Token 最长有效时间（24小时）
```

### 检查流程

```
请求 → JwtAuthGuard → JwtStrategy.validate()
                           ↓
                    1. 检查 Token 黑名单
                    2. 检查用户级黑名单
                    3. 验证用户是否存在
                           ↓
                    通过 / 拒绝（401）
```

## API 接口

### 1. 用户登出
```http
POST /api/auth/logout
Authorization: Bearer <your-token>

Response:
{
  "message": "Logged out successfully"
}
```

**说明**：
- 将当前 Token 加入黑名单
- Token 立即失效
- 需要重新登录获取新 Token

### 2. 强制用户登出（管理员专用）
```http
POST /api/users/force-logout/:userId
Authorization: Bearer <admin-token>

Response:
{
  "message": "User 2 has been forcefully logged out",
  "success": true
}
```

**说明**：
- 需要 `admin` 角色
- 将指定用户的所有 Token 失效
- 用户需要重新登录

## 使用示例

### 场景 1：正常登出

```bash
# 1. 登录获取 Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"root123456"}'

# Response:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {...}
# }

# 2. 使用 Token 访问接口（成功）
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# 3. 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <token>"

# 4. 再次使用相同 Token 访问（失败 - 401）
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Response:
# {
#   "statusCode": 401,
#   "message": "Token has been revoked"
# }
```

### 场景 2：管理员强制登出用户

```bash
# 1. 用户 john_doe（userId=3）登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"root123456"}'

# 2. john_doe 使用 Token 访问（成功）
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <john_token>"

# 3. 管理员强制登出 john_doe
curl -X POST http://localhost:3000/api/users/force-logout/3 \
  -H "Authorization: Bearer <admin_token>"

# 4. john_doe 的 Token 立即失效（失败 - 401）
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <john_token>"

# Response:
# {
#   "statusCode": 401,
#   "message": "User has been logged out"
# }

# 5. john_doe 需要重新登录
```

## 工作原理

### 1. Token 黑名单检查

在 `jwt.strategy.ts` 中：

```typescript
async validate(request: any, payload: any) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  // 检查 Token 是否在黑名单中
  if (token && await this.tokenBlacklistService.isBlacklisted(token)) {
    throw new UnauthorizedException('Token has been revoked');
  }

  // 检查用户是否被强制登出
  if (payload.iat && await this.tokenBlacklistService.isUserBlacklisted(payload.sub, payload.iat)) {
    throw new UnauthorizedException('User has been logged out');
  }

  // ... 其他验证逻辑
}
```

### 2. 用户级黑名单原理

- 记录用户被强制登出的时间戳
- 对比 Token 的签发时间（`iat`）
- 如果 Token 签发时间 < 黑名单时间 → Token 失效
- 如果 Token 签发时间 > 黑名单时间 → Token 有效（重新登录后的新 Token）

### 3. 自动清理机制

```typescript
// 单个 Token 黑名单：使用 Token 剩余有效期作为 TTL
const expiresIn = decoded.exp - now; // 剩余秒数
await cacheManager.set(`blacklist:token:${token}`, '1', expiresIn * 1000);

// 用户级黑名单：使用 Token 最长有效期作为 TTL
const maxTokenLifetime = 24 * 60 * 60; // 24 小时
await cacheManager.set(`blacklist:user:${userId}`, timestamp, maxTokenLifetime * 1000);
```

## 性能考虑

### Redis 存储开销

假设：
- Token 长度：~200 字符
- 日活用户：10,000
- 每个用户每天登出 1 次

存储空间：
- 单个 Token 黑名单：200 bytes × 10,000 = 2 MB
- 用户级黑名单：20 bytes × 100 = 2 KB（假设 100 个用户被强制登出）

**总计：约 2 MB**（非常小）

### 性能影响

每次请求增加的开销：
1. Redis 查询 Token 黑名单：~1ms
2. Redis 查询用户黑名单：~1ms

**总计：约 2ms**（可接受）

## 安全性考虑

### 优点
1. ✅ 用户登出后 Token 立即失效
2. ✅ 支持管理员强制踢出用户
3. ✅ 防止 Token 泄露后继续使用
4. ✅ 自动清理，不会无限增长

### 注意事项
1. ⚠️ 依赖 Redis，如果 Redis 故障，黑名单功能失效
2. ⚠️ 短 Token 有效期（如 1 小时）可以减少黑名单压力
3. ⚠️ 考虑使用 Refresh Token 机制进一步提升安全性

## 扩展功能建议

### 1. Token 刷新机制
- Access Token（短有效期，1 小时）
- Refresh Token（长有效期，7 天）
- 登出时同时撤销两种 Token

### 2. 黑名单统计
- 记录登出次数
- 记录被强制登出的用户
- 用于审计和安全分析

### 3. IP 绑定
- Token 绑定 IP 地址
- IP 变更时自动失效
- 增强安全性

### 4. 设备管理
- 记录用户的所有登录设备
- 支持查看和管理设备
- 支持单设备登出

## 测试清单

- [ ] 用户登录后可以正常访问接口
- [ ] 用户登出后 Token 立即失效
- [ ] 登出后的 Token 无法访问受保护接口
- [ ] 重新登录后获得新 Token 可以正常使用
- [ ] 管理员可以强制登出指定用户
- [ ] 被强制登出的用户 Token 立即失效
- [ ] 被强制登出的用户重新登录后正常
- [ ] 黑名单记录在 Token 过期后自动清除
- [ ] 并发登出不会导致 Redis 错误
- [ ] Redis 故障时系统仍能正常运行（可选）

## 总结

Token 黑名单功能是生产环境中必不可少的安全特性，可以有效防止 Token 泄露带来的安全风险。通过 Redis 实现的黑名单机制，既保证了性能，又实现了自动清理，是一个轻量级且高效的解决方案。
