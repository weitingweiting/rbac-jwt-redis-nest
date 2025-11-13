# RBAC + JWT + Redis Demo

NestJS 完整的 RBAC（基于角色的访问控制）+ JWT 认证 + Redis 缓存优化 Demo。

## 功能特性

- ✅ 基于角色的访问控制 (RBAC)
- ✅ JWT Token 认证
- ✅ Redis 缓存用户权限
- ✅ Token 黑名单（用户登出、强制登出）
- ✅ TypeORM + MySQL 数据库
- ✅ 密码 SHA-256 加密
- ✅ 装饰器实现权限控制
- ✅ 全局 JWT Guard
- ✅ 公开接口标记

## 技术栈

- NestJS 10
- TypeORM
- MySQL
- Redis
- JWT
- Passport
- Node.js Crypto (SHA-256)

## 前置要求

- Node.js >= 16
- Docker & Docker Compose（推荐）
- 或者 MySQL >= 5.7 + Redis >= 5.0（手动安装）

## 快速开始

### 方式一：使用 Makefile（推荐）

```bash
# 查看所有可用命令
make help

# 一键初始化（启动服务 + 安装依赖 + 初始化数据）
make init

# 启动开发服务器
make dev
```

### 方式二：手动步骤

#### 1. 克隆项目并安装依赖

```bash
npm install
```

#### 2. 启动数据库服务（推荐使用 Docker）

```bash
# 启动 MySQL 和 Redis
docker-compose up -d

# 查看服务状态
docker-compose ps

# (可选) 启动管理工具
docker-compose --profile tools up -d
# 访问 http://localhost:8080 (Adminer - MySQL 管理)
# 访问 http://localhost:8081 (Redis Commander)
```

详细 Docker 使用说明请查看 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

## 配置环境变量

创建 `.env` 文件：

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=rbac_demo
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 初始化数据

```bash
npm run seed
```

默认用户（所有密码都是 `root123456`）：

- 管理员：`admin` / `root123456`
- 编辑者：`editor` / `root123456`
- 普通用户：`john_doe` / `root123456`

## API 使用示例

### 1. 注册

```bash
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com"
}
```

### 2. 登录

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "root123456"
}
```

### 3. 访问受保护接口

```bash
GET /users
Authorization: Bearer {your-jwt-token}
```

### 4. 获取用户信息

```bash
GET /auth/profile
Authorization: Bearer {your-jwt-token}
```

### 5. 用户登出（Token 加入黑名单）

```bash
POST /auth/logout
Authorization: Bearer {your-jwt-token}
```

### 6. 管理员强制登出用户

```bash
POST /users/force-logout/:userId
Authorization: Bearer {admin-token}
```

## 项目结构

```
src/
├── auth/                    # 认证模块
│   ├── decorators/         # 装饰器（Public, CurrentUser）
│   ├── guards/             # JWT Guard
│   ├── strategies/         # Passport JWT 策略
│   ├── auth.service.ts     # 认证服务
│   ├── auth.controller.ts  # 认证控制器
│   └── auth.module.ts      # 认证模块
├── config/                  # 配置文件
│   ├── jwt.config.ts       # JWT 配置
│   └── redis.config.ts     # Redis 配置
├── controllers/            # 控制器
│   └── users.controller.ts
├── decorators/             # 权限装饰器
│   ├── permissions.decorator.ts
│   └── roles.decorator.ts
├── entities/               # 数据库实体
│   ├── user.entity.ts
│   ├── role.entity.ts
│   └── permission.entity.ts
├── guards/                 # 权限 Guard
│   ├── permissions.guard.ts
│   └── roles.guard.ts
├── services/               # 服务层
│   └── user-permissions.service.ts
├── seed/                   # 数据库种子
│   └── seed.service.ts
├── app.module.ts           # 根模块
└── main.ts                 # 入口文件
```

## 核心概念

### 1. RBAC 模型

- User（用户）→ User_Roles → Role（角色）→ Role_Permissions → Permission（权限）
- 用户通过角色间接获得权限

### 2. JWT 认证

- 登录后返回 JWT Token
- 请求时携带 Token 在 Authorization Header
- JwtAuthGuard 自动验证 Token

### 3. Redis 缓存

- 缓存用户权限列表，避免频繁查询数据库
- 首次查询写入缓存，后续从缓存读取
- 角色/权限变更时清除缓存

### 4. Token 黑名单

- 用户登出后 Token 立即失效
- 管理员可强制踢出指定用户
- 使用 Redis 存储，自动过期清理
- 详见 [TOKEN_BLACKLIST.md](TOKEN_BLACKLIST.md)

### 5. 装饰器使用

```typescript
// 标记公开接口（无需认证）
@Public()

// 要求特定权限
@RequirePermissions('users:read', 'users:write')

// 要求特定角色
@RequireRoles('admin', 'superadmin')

// 获取当前用户
@CurrentUser() user: any
```

## 学习要点

1. **SetMetadata** vs **Reflect.metadata**：装饰器工厂的使用
2. **Guard 执行顺序**：JwtAuthGuard → PermissionsGuard → RolesGuard
3. **Redis 缓存策略**：TTL + 主动清除
4. **JWT 策略**：Passport Strategy 的实现
5. **装饰器组合**：自定义装饰器的实践
6. **Token 黑名单**：用户登出和强制登出的实现

## License

MIT
