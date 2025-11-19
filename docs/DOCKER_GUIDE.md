# Docker Compose 使用指南

## 📋 配置说明

### 优化点

#### 1. **MySQL 优化**

- ✅ 添加了健康检查（healthcheck）
- ✅ 设置时区为 Asia/Shanghai
- ✅ 添加专用数据库用户（rbac_user）
- ✅ **使用本地目录存储数据**（`./docker-data/mysql`）
- ✅ **配合 TypeORM synchronize 自动建表**（无需 init.sql）
- ✅ 优化字符集为 utf8mb4
- ✅ 调整性能参数（最大连接数、缓冲池大小）
- ✅ 改用 `unless-stopped` 重启策略

#### 2. **Redis 优化**

- ✅ 添加健康检查
- ✅ **使用本地目录存储数据**（`./docker-data/redis`）
- ✅ 使用自定义配置文件（redis.conf）
- ✅ 配置 AOF + RDB 双重持久化
- ✅ 设置最大内存和淘汰策略（LRU）
- ✅ 优化网络和性能参数

#### 3. **可选管理工具**

- ✅ Redis Commander（Redis 可视化管理）
- ✅ Adminer（轻量级数据库管理工具）
- ✅ 使用 profiles 控制是否启动

#### 4. **网络和依赖**

- ✅ 创建自定义网络（rbac-network）
- ✅ 添加服务依赖和健康检查
- ✅ 确保服务启动顺序

---

## 🚀 快速开始

### 1. 启动核心服务（MySQL + Redis）

```bash
docker-compose up -d
```

### 2. 启动所有服务（包含管理工具）

```bash
docker-compose --profile tools up -d
```

### 3. 查看服务状态

```bash
docker-compose ps
```

预期输出：

```
NAME                         STATUS                    PORTS
rbac-demo-mysql             Up (healthy)              0.0.0.0:3306->3306/tcp
rbac-demo-redis             Up (healthy)              0.0.0.0:6379->6379/tcp
rbac-demo-adminer           Up                        0.0.0.0:8080->8080/tcp
rbac-demo-redis-commander   Up                        0.0.0.0:8081->8081/tcp
```

### 4. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mysql
docker-compose logs -f redis
```

---

## 🔧 常用命令

### 启动和停止

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器 + 数据卷（⚠️ 会删除所有数据）
docker-compose down -v
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart mysql
docker-compose restart redis
```

### 查看资源使用

```bash
# 查看容器资源占用
docker stats rbac-demo-mysql rbac-demo-redis
```

---

## 🌐 管理工具访问

启动管理工具后，可以通过以下地址访问：

### Adminer（MySQL 管理）

- **URL**: http://localhost:8080
- **服务器**: `mysql`
- **用户名**: `root` 或 `rbac_user`
- **密码**: `password` 或 `rbac_password`
- **数据库**: `rbac_demo`

### Redis Commander（Redis 管理）

- **URL**: http://localhost:8081
- 自动连接到本地 Redis，无需配置

---

## 🗄️ 数据库连接信息

### 应用连接（.env 配置）

```env
# MySQL
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=rbac_user
DATABASE_PASSWORD=rbac_password
DATABASE_NAME=rbac_demo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Root 用户（管理用）

```env
DATABASE_USER=root
DATABASE_PASSWORD=password
```

---

## 📊 健康检查说明

### MySQL 健康检查

- **检查命令**: `mysqladmin ping`
- **检查间隔**: 10 秒
- **超时时间**: 5 秒
- **启动等待**: 30 秒
- **重试次数**: 5 次

### Redis 健康检查

- **检查命令**: `redis-cli ping`
- **检查间隔**: 10 秒
- **超时时间**: 3 秒
- **启动等待**: 10 秒
- **重试次数**: 5 次

---

## 🛠️ 故障排查

### 1. MySQL 无法启动

```bash
# 查看 MySQL 日志
docker-compose logs mysql

# 常见问题：端口占用
lsof -i :3306
# 或
sudo netstat -tulpn | grep 3306

# 解决：停止本地 MySQL
brew services stop mysql
```

### 2. Redis 无法启动

```bash
# 查看 Redis 日志
docker-compose logs redis

# 常见问题：端口占用
lsof -i :6379

# 解决：停止本地 Redis
brew services stop redis
```

### 3. 权限问题

```bash
# 如果遇到 docker-data 目录权限错误
sudo chmod -R 755 docker-data/

# 确保配置文件可读
chmod 644 redis.conf
```

### 4. 数据目录说明

本项目使用**本地目录挂载**方式存储数据：

```
docker-data/
├── mysql/    # MySQL 数据文件
└── redis/    # Redis 数据文件
```

**优点：**

- ✅ 数据直接存储在项目目录，便于查看和备份
- ✅ 停止容器后数据依然保留
- ✅ 可以直接复制 docker-data 目录迁移数据

**注意：**

- docker-data 目录已在 `.gitignore` 中，不会提交到 Git
- 首次启动会自动创建目录结构

### 5. 重置数据

```bash
# ⚠️ 警告：这会删除所有数据
docker-compose down

# 删除数据目录
rm -rf docker-data/mysql/* docker-data/redis/*

# 重新启动
docker-compose up -d

# 重新初始化数据（TypeORM 会自动创建表）
npm run seed
```

---

## 🔄 数据备份和恢复

### 方式一：备份整个数据目录（推荐）

```bash
# 备份
tar -czf docker-data-backup-$(date +%Y%m%d).tar.gz docker-data/

# 恢复
tar -xzf docker-data-backup-20241110.tar.gz

# 查看备份内容
tar -tzf docker-data-backup-20241110.tar.gz
```

### 方式二：使用数据库命令备份

#### MySQL 备份

```bash
# 备份数据库
docker exec rbac-demo-mysql mysqldump -uroot -ppassword rbac_demo > backup.sql

# 恢复数据库
docker exec -i rbac-demo-mysql mysql -uroot -ppassword rbac_demo < backup.sql
```

#### Redis 备份

```bash
# 手动触发 RDB 保存
docker exec rbac-demo-redis redis-cli BGSAVE

# 数据已保存在 docker-data/redis/dump.rdb
# 直接复制文件即可
cp docker-data/redis/dump.rdb redis-backup.rdb
```

---

## 🎯 生产环境建议

如果要用于生产环境，建议进行以下调整：

### 1. 安全性

```yaml
# 修改默认密码
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
  MYSQL_PASSWORD: ${MYSQL_PASSWORD}

# Redis 添加密码
command: redis-server /usr/local/etc/redis/redis.conf --requirepass ${REDIS_PASSWORD}
```

### 2. 资源限制

```yaml
services:
  mysql:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
```

### 3. 网络隔离

```yaml
# 不暴露端口到宿主机
# ports:
#   - "3306:3306"

# 仅通过 Docker 网络访问
expose:
  - "3306"
```

### 4. 日志管理

```yaml
services:
  mysql:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 📝 环境变量配置

创建 `.env.docker` 文件用于 Docker Compose：

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=rbac_demo
MYSQL_USER=rbac_user
MYSQL_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# Timezone
TZ=Asia/Shanghai
```

然后在 docker-compose.yml 中引用：

```yaml
env_file:
  - .env.docker
```

---

## 🎉 完成

现在你的 Docker Compose 配置已优化完成！

**特性总结：**

- ✅ 自动健康检查
- ✅ 数据持久化
- ✅ 性能优化
- ✅ 可选管理工具
- ✅ 完善的日志和监控
- ✅ 易于备份和恢复

祝使用愉快！🚀
