# 项目结构说明

```
rbac+jwt+redis-DEMO/
├── src/
│   ├── main.ts                              # 应用入口文件
│   ├── app.module.ts                        # 根模块，组装所有模块
│   │
│   ├── auth/                                # 认证模块
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts         # @Public() - 标记公开接口
│   │   │   └── current-user.decorator.ts   # @CurrentUser() - 获取当前用户
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts           # JWT 认证守卫
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts             # Passport JWT 策略
│   │   ├── auth.service.ts                 # 认证服务（登录、注册、验证）
│   │   ├── auth.controller.ts              # 认证控制器（/auth 路由）
│   │   └── auth.module.ts                  # 认证模块配置
│   │
│   ├── config/                              # 配置文件
│   │   ├── jwt.config.ts                   # JWT 配置（密钥、过期时间）
│   │   └── redis.config.ts                 # Redis 缓存配置
│   │
│   ├── controllers/                         # 业务控制器
│   │   └── users.controller.ts             # 用户控制器（/users 路由）
│   │
│   ├── decorators/                          # 权限装饰器
│   │   ├── permissions.decorator.ts        # @RequirePermissions() - 权限检查
│   │   └── roles.decorator.ts              # @RequireRoles() - 角色检查
│   │
│   ├── entities/                            # 数据库实体
│   │   ├── user.entity.ts                  # 用户实体
│   │   ├── role.entity.ts                  # 角色实体
│   │   └── permission.entity.ts            # 权限实体
│   │
│   ├── guards/                              # 权限守卫
│   │   ├── permissions.guard.ts            # 权限守卫（检查用户权限）
│   │   └── roles.guard.ts                  # 角色守卫（检查用户角色）
│   │
│   ├── services/                            # 业务服务
│   │   └── user-permissions.service.ts     # 用户权限服务（含 Redis 缓存）
│   │
│   └── seed/                                # 数据库初始化
│       ├── seed.service.ts                 # 种子数据服务
│       └── seed.ts                         # 种子数据执行脚本
│
├── .env.example                             # 环境变量示例
├── .gitignore                               # Git 忽略文件
├── api-test.http                            # API 测试文件（REST Client）
├── nest-cli.json                            # NestJS CLI 配置
├── package.json                             # 项目依赖和脚本
├── README.md                                # 项目说明文档
├── QUICKSTART.md                            # 快速开始指南
├── PROJECT_STRUCTURE.md                     # 项目结构说明（本文件）
└── tsconfig.json                            # TypeScript 配置
```

## 核心文件说明

### 1. 入口和配置

- **`main.ts`**: 应用启动入口，配置全局前缀、CORS 等
- **`app.module.ts`**: 根模块，导入数据库、Redis、Auth 模块，注册全局 JWT Guard

### 2. 认证模块 (auth/)

#### 装饰器

- **`public.decorator.ts`**: 标记公开接口，跳过 JWT 认证
- **`current-user.decorator.ts`**: 从 request 中提取当前用户信息

#### 守卫

- **`jwt-auth.guard.ts`**: 继承 Passport 的 JWT 守卫，检查 @Public() 标记

#### 策略

- **`jwt.strategy.ts`**: Passport JWT 策略，验证 Token 并返回用户信息

#### 服务和控制器

- **`auth.service.ts`**: 处理登录、注册、Token 验证和刷新
- **`auth.controller.ts`**: 提供 `/auth/login`, `/auth/register` 等接口

### 3. 权限模块

#### 装饰器

- **`permissions.decorator.ts`**: 使用 SetMetadata 定义权限要求
- **`roles.decorator.ts`**: 使用 SetMetadata 定义角色要求

#### 守卫

- **`permissions.guard.ts`**: 检查用户是否拥有所需权限（AND 逻辑）
- **`roles.guard.ts`**: 检查用户是否拥有所需角色（OR 逻辑）

### 4. 数据层

#### 实体

- **`user.entity.ts`**: 用户表，关联角色（多对多）
- **`role.entity.ts`**: 角色表，关联用户和权限（多对多）
- **`permission.entity.ts`**: 权限表，关联角色（多对多）

#### 服务

- **`user-permissions.service.ts`**:
  - 从数据库加载用户权限和角色
  - 使用 Redis 缓存结果
  - 提供缓存清除方法

### 5. 业务控制器

- **`users.controller.ts`**:
  - 演示各种权限和角色检查
  - 使用 @RequirePermissions 和 @RequireRoles
  - 提供缓存管理接口

### 6. 配置文件

- **`jwt.config.ts`**: JWT 密钥和过期时间
- **`redis.config.ts`**: Redis 连接配置和 TTL

### 7. 数据初始化

- **`seed.service.ts`**: 创建默认权限、角色和用户
- **`seed.ts`**: 执行种子数据的脚本

## 数据流程

### 认证流程

```
1. 用户登录 → auth.service.login()
2. 验证用户名密码 → SHA-256 哈希对比
3. 生成 JWT Token → jwtService.sign()
4. 返回 Token 给客户端
```

### 鉴权流程

```
1. 请求携带 Token → Authorization: Bearer <token>
2. JwtAuthGuard 验证 Token → jwt.strategy.validate()
3. 提取 userId 挂载到 request.user
4. PermissionsGuard/RolesGuard 检查权限
5. 从 Redis 读取权限（缓存命中）或从数据库加载（缓存未命中）
6. 检查是否满足权限/角色要求
7. 通过/拒绝请求
```

### Redis 缓存流程

```
1. 首次请求 → Cache miss
2. 查询数据库获取用户权限
3. 写入 Redis：key = user:{userId}:permissions
4. 后续请求 → Cache hit
5. 直接从 Redis 读取，跳过数据库查询
6. 角色/权限变更 → 调用 clearUserCache() 清除缓存
```

## Guard 执行顺序

在 `users.controller.ts` 中：

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
```

执行顺序：

1. **JwtAuthGuard**: 验证 JWT Token，提取用户信息
2. **PermissionsGuard**: 检查用户权限（如果接口标记了 @RequirePermissions）
3. **RolesGuard**: 检查用户角色（如果接口标记了 @RequireRoles）

## 装饰器组合使用

### 示例 1：需要特定权限

```typescript
@Get()
@RequirePermissions('users:read')
findAll() { ... }
```

### 示例 2：需要特定角色

```typescript
@Get('admin')
@RequireRoles('admin')
adminOnly() { ... }
```

### 示例 3：需要多个权限（AND）

```typescript
@Get('advanced')
@RequirePermissions('users:read', 'users:write')
advancedRoute() { ... }
```

### 示例 4：需要多个角色之一（OR）

```typescript
@Get('editor')
@RequireRoles('admin', 'editor')
editorRoute() { ... }
```

### 示例 5：公开接口（无需认证）

```typescript
@Public()
@Post('login')
login() { ... }
```

## 核心概念总结

### 1. RBAC 模型

- **User → Roles → Permissions** 的三层结构
- 用户通过角色间接获得权限
- 支持多对多关系（一个用户多个角色，一个角色多个权限）

### 2. JWT 认证

- 无状态认证，Token 包含用户信息
- 使用 Passport JWT 策略自动验证
- 支持 Token 刷新

### 3. Redis 缓存

- 缓存用户权限列表，提升性能
- TTL 自动过期 + 主动清除
- 减少数据库查询压力

### 4. 装饰器模式

- 使用 SetMetadata 设置元数据
- Guard 通过 Reflector 读取元数据
- 实现声明式的权限控制

这个 Demo 是一个完整的、生产级的 RBAC 权限系统实现，适合学习和参考！
