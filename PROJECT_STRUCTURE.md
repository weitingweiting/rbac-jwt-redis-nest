# 项目结构说明

```
rbac+jwt+redis-DEMO/
├── src/
│   ├── main.ts                              # 应用入口文件
│   ├── app.module.ts                        # 根模块，组装所有模块
│   ├── app.controller.ts                    # 根控制器，提供基础接口
│   ├── app.service.ts                       # 根服务
│   │
│   ├── modules/                             # 业务模块
│   │   ├── auth/                           # 认证模块
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts     # @Public() - 标记公开接口
│   │   │   │   └── current-user.decorator.ts # @CurrentUser() - 获取当前用户
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts       # JWT 认证守卫
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts         # Passport JWT 策略
│   │   │   ├── auth.service.ts             # 认证服务（登录、注册、验证）
│   │   │   ├── auth.controller.ts          # 认证控制器（/auth 路由）
│   │   │   └── auth.module.ts              # 认证模块配置
│   │   │
│   │   └── users/                          # 用户管理模块
│   │       ├── users.controller.ts         # 用户控制器（/users 路由）
│   │       ├── users.service.ts            # 用户业务服务
│   │       └── users.module.ts             # 用户模块配置
│   │
│   ├── shared/                             # 共享组件
│   │   ├── entities/                       # 数据库实体
│   │   │   ├── user.entity.ts              # 用户实体
│   │   │   ├── role.entity.ts              # 角色实体
│   │   │   └── permission.entity.ts        # 权限实体
│   │   ├── config/                         # 配置文件
│   │   │   ├── jwt.config.ts               # JWT 配置（密钥、过期时间）
│   │   │   ├── redis.config.ts             # Redis 缓存配置
│   │   │   └── winston.config.ts           # Winston 日志配置
│   │   ├── decorators/                     # 权限装饰器
│   │   │   ├── permissions.decorator.ts    # @RequirePermissions() - 权限检查
│   │   │   └── roles.decorator.ts          # @RequireRoles() - 角色检查
│   │   ├── guards/                         # 权限守卫
│   │   │   ├── permissions.guard.ts        # 权限守卫（检查用户权限）
│   │   │   └── roles.guard.ts              # 角色守卫（检查用户角色）
│   │   └── services/                       # 共享服务
│   │       ├── user-permissions.service.ts # 用户权限服务（含 Redis 缓存）
│   │       └── token-blacklist.service.ts  # Token 黑名单服务
│   │
│   ├── common/                             # 通用功能
│   │   └── logger/                         # 日志模块
│   │       ├── logger.module.ts            # Winston 日志模块
│   │       └── logging.interceptor.ts      # 请求日志拦截器
│   │
│   └── database/                           # 数据库相关
│       └── seeds/                          # 数据库初始化
│           ├── seed.service.ts             # 种子数据服务
│           └── seed.ts                     # 种子数据执行脚本
│
├── docker-data/                            # Docker 数据目录
│   ├── mysql/                             # MySQL 数据文件
│   └── redis/                             # Redis 数据文件
│
├── scripts/                               # 工具脚本
│   └── generate-password-hash.js          # 密码哈希生成工具
│
├── .env.example                           # 环境变量示例
├── .gitignore                             # Git 忽略文件
├── api-test.http                          # API 测试文件（REST Client）
├── docker-compose.yml                     # Docker 编排文件
├── Dockerfile                             # Docker 构建文件
├── Makefile                              # Make 命令脚本
├── nest-cli.json                          # NestJS CLI 配置
├── package.json                           # 项目依赖和脚本
├── README.md                              # 项目说明文档
├── QUICKSTART.md                          # 快速开始指南
├── PROJECT_STRUCTURE.md                   # 项目结构说明（本文件）
└── tsconfig.json                          # TypeScript 配置
```

## 核心文件说明

### 1. 入口和配置

- **`main.ts`**: 应用启动入口，配置全局前缀、CORS 等
- **`app.module.ts`**: 根模块，导入数据库、Redis、Auth 模块，注册全局 JWT Guard
- **`app.controller.ts`**: 根控制器，提供健康检查等基础接口
- **`app.service.ts`**: 根服务，应用基础逻辑

### 2. 业务模块 (modules/)

#### 认证模块 (modules/auth/)

##### 装饰器

- **`public.decorator.ts`**: 标记公开接口，跳过 JWT 认证
- **`current-user.decorator.ts`**: 从 request 中提取当前用户信息

##### 守卫

- **`jwt-auth.guard.ts`**: 继承 Passport 的 JWT 守卫，检查 @Public() 标记

##### 策略

- **`jwt.strategy.ts`**: Passport JWT 策略，验证 Token 并返回用户信息

##### 服务和控制器

- **`auth.service.ts`**: 处理登录、注册、Token 验证和刷新
- **`auth.controller.ts`**: 提供 `/auth/login`, `/auth/register` 等接口
- **`auth.module.ts`**: 认证模块配置，导出 AuthService

#### 用户管理模块 (modules/users/)

- **`users.controller.ts`**: 用户管理控制器，提供 `/users` 路由
- **`users.service.ts`**: 用户业务逻辑服务
- **`users.module.ts`**: 用户模块配置，导入 AuthModule

### 3. 共享组件 (shared/)

#### 实体 (shared/entities/)

- **`user.entity.ts`**: 用户表，关联角色（多对多）
- **`role.entity.ts`**: 角色表，关联用户和权限（多对多）
- **`permission.entity.ts`**: 权限表，关联角色（多对多）

#### 配置 (shared/config/)

- **`jwt.config.ts`**: JWT 密钥和过期时间配置
- **`redis.config.ts`**: Redis 连接配置和 TTL
- **`winston.config.ts`**: Winston 日志配置

#### 装饰器 (shared/decorators/)

- **`permissions.decorator.ts`**: 使用 SetMetadata 定义权限要求
- **`roles.decorator.ts`**: 使用 SetMetadata 定义角色要求

#### 守卫 (shared/guards/)

- **`permissions.guard.ts`**: 检查用户是否拥有所需权限（AND 逻辑）
- **`roles.guard.ts`**: 检查用户是否拥有所需角色（OR 逻辑）

#### 服务 (shared/services/)

- **`user-permissions.service.ts`**:
  - 从数据库加载用户权限和角色
  - 使用 Redis 缓存结果
  - 提供缓存清除方法
- **`token-blacklist.service.ts`**: Token 黑名单管理服务

### 4. 通用功能 (common/)

#### 日志模块 (common/logger/)

- **`logger.module.ts`**: Winston 日志模块配置
- **`logging.interceptor.ts`**: 全局请求日志拦截器

### 5. 数据库相关 (database/)

#### 种子数据 (database/seeds/)

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

### 1. 模块化架构设计

- **modules/**: 业务功能模块（如 auth、users），每个模块自成体系
- **shared/**: 跨模块共享的实体、配置、装饰器、守卫和服务
- **common/**: 通用功能模块（如日志），可在任何项目中复用
- **database/**: 数据库相关功能（种子数据、迁移脚本）

### 2. RBAC 模型

- **User → Roles → Permissions** 的三层结构
- 用户通过角色间接获得权限
- 支持多对多关系（一个用户多个角色，一个角色多个权限）

### 3. JWT 认证

- 无状态认证，Token 包含用户信息
- 使用 Passport JWT 策略自动验证
- 支持 Token 刷新和黑名单机制

### 4. Redis 缓存

- 缓存用户权限列表，提升性能
- TTL 自动过期 + 主动清除
- 减少数据库查询压力

### 5. 装饰器模式

- 使用 SetMetadata 设置元数据
- Guard 通过 Reflector 读取元数据
- 实现声明式的权限控制

### 6. 日志系统

- 使用 Winston 进行结构化日志记录
- 支持日志轮转和多种输出格式
- 全局请求拦截器记录 API 调用

### 7. 可扩展性设计

- 模块间松耦合，易于添加新的业务模块
- 共享组件设计，避免代码重复
- 统一的错误处理和响应格式

这个 Demo 是一个完整的、生产级的 RBAC 权限系统实现，适合学习和参考！
