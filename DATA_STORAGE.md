# 数据存储配置说明

## 📂 存储方式对比

### 之前：Docker Named Volumes（命名卷）

```yaml
volumes:
  - mysql_data:/var/lib/mysql # Docker 管理的卷
  - redis_data:/data # Docker 管理的卷
```

**特点：**

- ❌ 数据存储在 Docker 内部位置（/var/lib/docker/volumes/）
- ❌ 不便于直接查看和管理
- ❌ 迁移需要使用 Docker 命令

### 现在：本地目录挂载（Bind Mounts）

```yaml
volumes:
  - ./docker-data/mysql:/var/lib/mysql # 本地目录
  - ./docker-data/redis:/data # 本地目录
```

**特点：**

- ✅ 数据直接存储在项目目录下
- ✅ 可以直接访问和管理文件
- ✅ 备份和迁移非常简单（直接复制目录）
- ✅ 适合开发和学习环境

---

## 🗂️ 目录结构

```
rbac+jwt+redis-DEMO/
├── docker-data/              # Docker 数据目录
│   ├── mysql/               # MySQL 数据文件（自动创建）
│   │   ├── ibdata1
│   │   ├── mysql/
│   │   ├── rbac_demo/       # 项目数据库
│   │   └── ...
│   ├── redis/               # Redis 数据文件（自动创建）
│   │   ├── dump.rdb         # RDB 快照
│   │   ├── appendonly.aof   # AOF 日志
│   │   └── ...
│   └── README.md
├── docker-compose.yml
├── redis.conf
└── ...
```

---

## 🔄 数据持久化说明

### 为什么 MySQL 必须挂载到 `/var/lib/mysql`？

这是 MySQL 官方镜像的**默认数据目录**，MySQL 进程会在这个路径下：

- 存储数据库文件
- 创建系统表
- 写入日志文件

**左边是宿主机路径，右边是容器内路径：**

```yaml
- ./docker-data/mysql:/var/lib/mysql
  ↑                   ↑
  本地项目目录          容器内 MySQL 数据目录（固定）
```

### 为什么 Redis 必须挂载到 `/data`？

这是 Redis 官方镜像的**默认数据目录**，Redis 会在这个路径下：

- 保存 RDB 快照（dump.rdb）
- 写入 AOF 日志（appendonly.aof）

**左边是宿主机路径，右边是容器内路径：**

```yaml
- ./docker-data/redis:/data
  ↑                   ↑
  本地项目目录          容器内 Redis 数据目录（固定）
```

---

## 🎯 与 TypeORM synchronize 的配合

### app.module.ts 配置

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'rbac_demo',
  entities: [User, Role, Permission],
  synchronize: true, // ✅ 开启自动同步
}),
```

### 工作流程

1. **启动 Docker**

   ```bash
   docker-compose up -d
   ```

   - MySQL 容器启动
   - 自动创建 `rbac_demo` 数据库（通过环境变量 MYSQL_DATABASE）

2. **启动 NestJS 应用**

   ```bash
   npm run start:dev
   ```

   - TypeORM 连接到 MySQL
   - `synchronize: true` 自动创建表结构
   - 根据 Entity 定义同步数据库 schema

3. **初始化种子数据**
   ```bash
   npm run seed
   ```
   - 插入默认用户、角色、权限数据

**优势：**

- ✅ 无需手动执行 init.sql
- ✅ 表结构自动同步，修改 Entity 立即生效
- ✅ 适合快速开发和学习

**注意：**

- ⚠️ 生产环境应禁用 `synchronize`，使用 Migration

---

## 💾 备份和恢复

### 方式一：直接复制目录（推荐）

```bash
# 备份
tar -czf backup.tar.gz docker-data/

# 恢复
tar -xzf backup.tar.gz

# 查看
tar -tzf backup.tar.gz
```

### 方式二：使用 Makefile

```bash
# 备份（自动添加时间戳）
make backup

# 清理数据
make clean

# 完整初始化
make init
```

---

## 🧹 清理数据

### 清理并保留目录结构

```bash
# 停止容器
docker-compose down

# 删除数据文件（保留目录）
rm -rf docker-data/mysql/*
rm -rf docker-data/redis/*

# 重新启动
docker-compose up -d
npm run start:dev    # TypeORM 自动创建表
npm run seed         # 初始化数据
```

### 使用 Makefile

```bash
make clean   # 会提示确认
```

---

## 🔍 查看数据

### MySQL 数据

```bash
# 查看数据文件
ls -lh docker-data/mysql/

# 使用 Adminer 可视化管理
docker-compose --profile tools up -d
# 访问 http://localhost:8080
```

### Redis 数据

```bash
# 查看 Redis 文件
ls -lh docker-data/redis/

# 查看 RDB 文件信息
file docker-data/redis/dump.rdb

# 使用 Redis Commander 可视化管理
docker-compose --profile tools up -d
# 访问 http://localhost:8081
```

---

## 📊 磁盘空间管理

### 查看占用

```bash
# 查看 docker-data 目录大小
du -sh docker-data/
du -sh docker-data/mysql/
du -sh docker-data/redis/

# 详细列表
du -h docker-data/ | sort -h
```

### 优化空间

```bash
# 清理 MySQL binlog（如果启用）
docker exec rbac-demo-mysql mysql -uroot -ppassword -e "PURGE BINARY LOGS BEFORE NOW();"

# 压缩 Redis AOF
docker exec rbac-demo-redis redis-cli BGREWRITEAOF
```

---

## 🎉 总结

**配置要点：**

1. ✅ 使用本地目录挂载（`./docker-data/`）
2. ✅ 容器内路径固定（`/var/lib/mysql` 和 `/data`）
3. ✅ 配合 TypeORM synchronize 自动建表
4. ✅ 移除 init.sql 挂载（不再需要）
5. ✅ 数据目录已加入 `.gitignore`

**工作流程：**

```bash
make init      # 启动服务 + 安装依赖 + 初始化数据
make dev       # 启动开发服务器
make backup    # 随时备份数据
make clean     # 重置环境
```

简单、直观、高效！🚀
