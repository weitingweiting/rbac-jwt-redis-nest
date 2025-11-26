# 📚 RBAC + JWT + Redis Demo 文档

欢迎查看完整的项目文档！所有文档已按照功能和用途重新整理分类。

## 📁 文档结构

```
docs/
├── 🚀 getting-started/     # 快速开始
│   ├── quickstart.md       # 安装配置指南
│   └── project-structure.md # 项目结构说明
├── 🛠️ development/         # 开发指南
│   ├── auth-rbac.md       # 认证与权限
│   ├── api-design.md      # API 设计规范
│   ├── validation.md      # 数据验证
│   └── exception-handling.md # 异常处理
├── 🚀 deployment/          # 部署运维
│   ├── docker.md          # Docker 部署
│   ├── database.md        # 数据库配置
│   └── logging.md         # 日志管理
├── 🧪 testing/            # 测试指南
│   ├── api-testing.md     # API 测试
│   └── validation-testing.md # 验证测试
└── 📖 references/         # 参考文档
    └── optimization.md    # 性能优化指南
```

## 🚀 快速导航

### 新用户开始这里

- [📖 快速开始指南](getting-started/quickstart.md) - 5 分钟快速上手
- [🏗️ 项目结构说明](getting-started/project-structure.md) - 了解项目架构

### 开发者指南

- [🔐 认证与权限系统](development/auth-rbac.md) - RBAC 和 JWT 完整实现
- [📋 API 设计规范](development/api-design.md) - RESTful API 最佳实践
- [✅ 数据验证指南](development/validation.md) - class-validator 使用
- [🚨 异常处理指南](development/exception-handling.md) - 全局异常处理

### 部署运维

- [🐳 Docker 部署指南](deployment/docker.md) - 容器化部署完整方案
- [🗄️ 数据库配置](deployment/database.md) - MySQL 配置和初始化
- [📝 日志管理](deployment/logging.md) - Winston 日志系统

### 测试指南

- [🧪 API 测试指南](testing/api-testing.md) - Bruno 测试集合使用
- [✅ 验证测试指南](testing/validation-testing.md) - 输入验证测试

## 🎯 核心特性

### 🔐 认证与授权

- JWT Token 认证机制
- 基于角色的访问控制 (RBAC)
- 权限细粒度控制
- Token 黑名单机制

### 📊 性能优化

- Redis 缓存用户权限
- 数据库查询优化
- 日志性能优化
- 异常处理优化

### 🛠️ 开发体验

- 模块化架构设计
- TypeScript 类型安全
- 完整的异常处理体系
- 结构化日志记录
- 自动化测试集合

## 🔄 从旧文档迁移

如果你之前使用的是散乱的文档结构，以下是新旧文档的对应关系：

| 旧文档                      | 新位置                                 | 说明             |
| --------------------------- | -------------------------------------- | ---------------- |
| `QUICKSTART.md`             | `getting-started/quickstart.md`        | 快速开始指南     |
| `PROJECT_STRUCTURE.md`      | `getting-started/project-structure.md` | 项目结构         |
| `TOKEN_BLACKLIST.md`        | `development/auth-rbac.md`             | 合并到认证文档   |
| `VALIDATION_GUIDE.md`       | `development/validation.md`            | 数据验证指南     |
| `EXCEPTION_FILTER_GUIDE.md` | `development/exception-handling.md`    | 异常处理         |
| `DOCKER_GUIDE.md`           | `deployment/docker.md`                 | Docker 部署      |
| `DATABASE_INIT.md`          | `deployment/database.md`               | 数据库配置       |
| `LOGGER_*.md`               | `deployment/logging.md`                | 日志系统（合并） |
| `USERS_API_REFERENCE.md`    | `development/api-design.md`            | API 设计规范     |

## 🤝 贡献指南

如果你想为文档做贡献：

1. 保持文档结构的一致性
2. 使用清晰的标题和章节
3. 提供实际的代码示例
4. 更新相关的导航链接

## 📞 获得帮助

如果你在使用过程中遇到问题：

1. 查看对应章节的文档
2. 检查 [GitHub Issues](../../issues)
3. 提交新的 Issue 描述问题

---

💡 **提示**: 所有文档都支持在线查看，建议按顺序从快速开始指南开始阅读。

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
# 应用环境（development 或 production）
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=rbac_demo

# Redis 配置
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
│   ├── redis.config.ts     # Redis 配置
│   └── winston.config.ts   # Winston 日志配置
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
├── logger/                 # 日志模块
│   ├── logger.module.ts    # 日志模块
│   └── logging.interceptor.ts  # HTTP 日志拦截器
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

## 日志系统

本项目集成了完整的 Winston 日志系统：

- 📝 多级别日志（error、warn、info、http、debug）
- 📁 自动日志轮转和归档
- 🎨 开发环境彩色控制台输出
- 🔒 敏感信息自动脱敏
- 📊 HTTP 请求/响应自动记录
- 💾 按日期和类型分类存储

详细使用说明请查看：

- [LOGGER_GUIDE.md](LOGGER_GUIDE.md) - 日志功能介绍
- [LOGGER_EXAMPLES.md](LOGGER_EXAMPLES.md) - 使用示例和最佳实践

```bash
# 实时查看日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 格式化 JSON 日志
tail -f logs/application-$(date +%Y-%m-%d).log | jq '.'
```

## 学习要点

1. **SetMetadata** vs **Reflect.metadata**：装饰器工厂的使用
2. **Guard 执行顺序**：JwtAuthGuard → PermissionsGuard → RolesGuard
3. **Redis 缓存策略**：TTL + 主动清除
4. **JWT 策略**：Passport Strategy 的实现
5. **装饰器组合**：自定义装饰器的实践
6. **Token 黑名单**：用户登出和强制登出的实现
7. **Winston 日志**：结构化日志、拦截器、日志轮转的最佳实践

## License

MIT
