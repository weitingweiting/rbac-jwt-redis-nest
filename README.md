# RBAC + JWT + Redis NestJS Demo

🚀 一个完整的基于角色的访问控制 (RBAC) + JWT 认证 + Redis 缓存的 NestJS 演示项目。

## ✨ 主要特性

- 🔐 完整的 RBAC 权限控制系统
- 🎫 JWT Token 认证与刷新
- ✅ class-validator 请求验证体系
- 📊 Redis 缓存优化
- 🗄️ TypeORM + MySQL 数据库
- 📝 Winston 日志系统
- 🚨 全局异常处理
- 🐳 Docker 容器化部署

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone <repository-url>
cd rbac+jwt+redis-DEMO

# 2. 安装依赖
node --version # 需要 v24.19.0
pnpm --version # 需要 11.23.0
pnpm install

# 3. 启动服务 (Docker)
make up

# 4. 启动应用
pnpm run start:dev
```

访问：http://localhost:3000

## 📚 完整文档

所有详细文档已按功能分类整理，请查看：

### 📖 [文档总览](docs/README.md)

### 🚀 快速开始

- [安装和配置](docs/getting-started/quickstart.md) - 详细的安装和配置步骤
- [项目结构](docs/getting-started/project-structure.md) - 完整的项目结构介绍

### 🛠️ 开发指南

- [认证与授权](docs/development/auth-rbac.md) - RBAC 和 JWT 实现
- [API 设计](docs/development/api-design.md) - 接口设计规范
- [数据验证](docs/development/validation.md) - class-validator 使用指南
- [异常处理](docs/development/exception-handling.md) - 全局异常处理

### 🚀 部署运维

- [Docker 部署](docs/deployment/docker.md) - 容器化部署指南
- [数据库配置](docs/deployment/database.md) - 数据库初始化和配置
- [日志管理](docs/deployment/logging.md) - Winston 日志系统

### 🧪 测试指南

- [API 测试](docs/testing/api-testing.md) - Bruno 测试集合使用
- [验证测试](docs/testing/validation-testing.md) - 输入验证测试

## 🎯 核心功能

### 认证与授权

- JWT Token 认证机制
- 基于角色和权限的访问控制
- Token 黑名单和强制登出

### 性能优化

- Redis 缓存用户权限信息
- 数据库查询优化
- 日志性能优化

### 开发体验

- 模块化架构设计
- 完整的异常处理体系
- 结构化日志记录
- TypeScript 类型安全

## 🛠️ 技术栈

- **框架**: NestJS 11
- **认证**: JWT + Passport
- **数据库**: MySQL + TypeORM
- **缓存**: Redis
- **日志**: Winston
- **容器**: Docker & Docker Compose

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

详细文档请查看 [`docs/`](docs/) 目录。
