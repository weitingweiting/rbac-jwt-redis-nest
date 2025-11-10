# 快速开始指南

## 前置要求

- Node.js >= 16
- MySQL >= 5.7
- Redis >= 5.0

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=rbac_demo

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. 启动 MySQL 和 Redis

#### 使用 Docker Compose（推荐）

```bash
# MySQL
docker-compose -f docker-compose.mysql.yaml up -d

# Redis
docker-compose -f docker-compose.redis.yaml up -d
```

#### 或者手动启动

```bash
# MySQL
mysql -u root -p
CREATE DATABASE rbac_demo;

# Redis
redis-server
```

### 4. 初始化数据库

#### 方式一：TypeORM 自动同步 + 种子脚本（推荐）
```bash
# 启动应用（TypeORM 自动创建表）
npm run start:dev

# 在另一个终端运行种子脚本
npm run seed
```

#### 方式二：使用 SQL 脚本
```bash
# 先关闭 src/app.module.ts 中的 synchronize
# 然后执行 SQL 脚本
mysql -u root -p < init.sql

# 或者使用 Docker
docker exec -i rbac-demo-mysql mysql -uroot -ppassword < init.sql
```

💡 详细说明请查看 [DATABASE_INIT.md](DATABASE_INIT.md)

### 5. 启动应用

```bash
npm run start:dev
```

应用将在 http://localhost:3000 启动

## 测试 API

### 使用 REST Client（推荐）

1. 安装 VSCode 插件：REST Client
2. 打开 `api-test.http` 文件
3. 点击 `Send Request` 测试各个接口

### 使用 curl

#### 1. 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "root123456"
  }'
```

#### 2. 使用 Token 访问受保护接口

```bash
# 替换 YOUR_TOKEN 为上一步返回的 accessToken
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 默认账户

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | root123456 | admin | 所有权限 |
| editor | root123456 | editor | users:read, users:write, profile:read, profile:write |
| john_doe | root123456 | user | profile:read |

**注意**：所有用户的密码都是 `root123456`，方便学习和测试。

## 测试场景

### 场景 1：权限检查（AND 逻辑）

访问 `/api/users/advanced` 需要同时拥有 `users:read` 和 `users:write` 权限：

- ✅ admin 可以访问（拥有所有权限）
- ✅ editor 可以访问（拥有这两个权限）
- ❌ john_doe 无法访问（只有 profile:read）

### 场景 2：角色检查（OR 逻辑）

访问 `/api/users/editor` 需要 `admin` 或 `editor` 角色：

- ✅ admin 可以访问
- ✅ editor 可以访问
- ❌ john_doe 无法访问（只有 user 角色）

### 场景 3：Redis 缓存

1. 首次访问 `/api/users` - 从数据库加载权限（控制台显示 "Cache miss"）
2. 再次访问 `/api/users` - 从 Redis 读取权限（控制台显示 "Cache hit"）
3. 清除缓存 `POST /api/users/cache/clear/1`
4. 再次访问 - 又会从数据库加载

## 常见问题

### Q: 无法连接到 MySQL

- 检查 MySQL 是否启动
- 检查 `.env` 中的数据库配置是否正确
- 确保数据库 `rbac_demo` 已创建

### Q: 无法连接到 Redis

- 检查 Redis 是否启动：`redis-cli ping` 应返回 `PONG`
- 检查 `.env` 中的 Redis 配置

### Q: JWT Token 过期

- 重新登录获取新的 Token
- 或者使用 `/api/auth/refresh` 刷新 Token

### Q: 403 Forbidden

- 检查当前用户是否有对应的权限或角色
- 查看控制台日志确认缓存状态

## 学习要点

1. **装饰器使用**：`@RequirePermissions`, `@RequireRoles`, `@Public`, `@CurrentUser`
2. **Guard 执行顺序**：JwtAuthGuard → PermissionsGuard → RolesGuard
3. **权限逻辑**：Permissions 使用 AND（every），Roles 使用 OR（some）
4. **Redis 缓存**：首次查询数据库，后续从缓存读取
5. **JWT 认证**：Passport Strategy 自动解析 Token 并注入 user 到 request

## 进阶练习

1. 添加新的权限（如 `posts:read`, `posts:write`）
2. 创建新的角色（如 `moderator`）
3. 实现权限的动态分配接口
4. 添加 Token 黑名单功能
5. 实现基于资源所有权的权限检查（ABAC）

祝学习愉快！🎉
