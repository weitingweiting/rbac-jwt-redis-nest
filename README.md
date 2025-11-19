# RBAC + JWT + Redis NestJS Demo

🚀 一个完整的基于角色的访问控制 (RBAC) + JWT 认证 + Redis 缓存的 NestJS 演示项目。

## ✨ 主要特性

- 🔐 完整的 RBAC 权限控制系统
- 🎫 JWT Token 认证与刷新
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
pnpm install

# 3. 启动服务 (Docker)
make up

# 4. 启动应用
pnpm run start:dev
```

访问：http://localhost:3000

## 📚 完整文档

所有详细文档已统一整理到 [`docs/`](docs/) 目录下：

- 📖 [完整项目文档](docs/INDEX.md) - 文档总览
- 🚀 [快速开始指南](docs/QUICKSTART.md) - 详细的安装和配置步骤
- 🏗️ [项目架构说明](docs/PROJECT_STRUCTURE.md) - 完整的项目结构介绍
- 🗄️ [数据库初始化](docs/DATABASE_INIT.md) - 数据库配置和初始化
- 📝 [日志系统指南](docs/LOGGER_GUIDE.md) - Winston 日志系统使用
- 🚨 [异常处理指南](docs/EXCEPTION_FILTER_GUIDE.md) - 全局异常过滤器使用
- 🐳 [Docker 部署指南](docs/DOCKER_GUIDE.md) - 容器化部署说明

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

- **框架**: NestJS 10
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
