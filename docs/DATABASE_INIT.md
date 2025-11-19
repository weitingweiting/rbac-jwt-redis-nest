# 数据库初始化指南

本项目提供两种数据库初始化方式，根据你的需求选择其一。

## 方式一：TypeORM 自动同步 + 种子脚本（推荐用于开发）

### 优点

- ✅ 自动创建表结构，无需手动编写 SQL
- ✅ 实体定义即文档，代码与数据库结构同步
- ✅ 支持快速迭代和修改

### 缺点

- ⚠️ 不适合生产环境（`synchronize: true` 可能导致数据丢失）
- ⚠️ 依赖 TypeORM 和 Node.js 环境

### 使用步骤

#### 1. 确保配置开启同步

在 `src/app.module.ts` 中：

```typescript
TypeOrmModule.forRoot({
  // ...
  synchronize: true, // 开发环境使用
});
```

#### 2. 启动应用（自动创建表）

```bash
npm run start:dev
```

TypeORM 会自动创建所有表结构。

#### 3. 运行种子脚本（插入初始数据）

```bash
npm run seed
```

#### 4. 验证

```bash
# 使用 MySQL 客户端连接
mysql -u root -p

USE rbac_demo;
SHOW TABLES;
SELECT * FROM users;
```

---

## 方式二：SQL 脚本初始化（推荐用于生产）

### 优点

- ✅ 完全控制数据库结构
- ✅ 适合生产环境部署
- ✅ 不依赖应用代码
- ✅ 可以直接查看完整的表结构

### 缺点

- ⚠️ 需要手动维护 SQL 文件
- ⚠️ 实体定义变更时需要同步更新 SQL

### 使用步骤

#### 1. 关闭 TypeORM 同步

在 `src/app.module.ts` 中：

```typescript
TypeOrmModule.forRoot({
  // ...
  synchronize: false, // 生产环境禁用
});
```

#### 2. 执行 SQL 脚本

```bash
# 方法 1：使用 MySQL 客户端
mysql -u root -p < init.sql

# 方法 2：登录后执行
mysql -u root -p
source /path/to/init.sql

# 方法 3：使用 Docker（如果使用 docker-compose）
docker exec -i rbac-demo-mysql mysql -uroot -ppassword < init.sql
```

#### 3. 验证

```bash
mysql -u root -p

USE rbac_demo;
SHOW TABLES;
SELECT * FROM users;
```

---

## 两种方式对比

| 特性           | TypeORM 自动同步   | SQL 脚本           |
| -------------- | ------------------ | ------------------ |
| **初始化速度** | 快（npm run seed） | 中（执行 SQL）     |
| **维护成本**   | 低（自动同步）     | 中（手动维护）     |
| **适用环境**   | 开发环境           | 生产环境           |
| **灵活性**     | 高（代码即结构）   | 中（需要修改 SQL） |
| **风险**       | 高（可能误删表）   | 低（可控）         |
| **依赖**       | Node.js + TypeORM  | 仅需 MySQL         |

---

## 注意事项（重要！）

### ⚠️ 密码哈希问题

`init.sql` 中的密码哈希是**示例占位符**，实际使用时需要替换为真实的 SHA-256 哈希值。

#### 生成真实密码哈希

```bash
# 方法 1：使用项目提供的脚本（推荐）
npm run gen-hash admin123

# 方法 2：使用 Node.js REPL
node
> const { createHash } = require('crypto');
> console.log(createHash('sha256').update('admin123').digest('hex'));

# 方法 3：创建临时脚本
node -e "console.log(require('crypto').createHash('sha256').update('admin123').digest('hex'))"
```

然后替换 `init.sql` 中的密码字段：

```sql
INSERT INTO `users` (`username`, `password`, `email`) VALUES
('admin', '替换为真实哈希值', 'admin@example.com');
```

### 🔧 生产环境建议

1. **禁用 synchronize**

```typescript
synchronize: process.env.NODE_ENV !== "production" ? true : false;
```

2. **使用数据库迁移**

```bash
# 安装 TypeORM CLI
npm install -g typeorm

# 生成迁移文件
typeorm migration:generate -n InitialMigration

# 运行迁移
typeorm migration:run
```

3. **使用环境变量管理配置**

```env
DATABASE_SYNC=false  # 生产环境
DATABASE_SYNC=true   # 开发环境
```

---

## 常见问题

### Q1: 为什么这个 Demo 默认使用 TypeORM 自动同步？

**A**: 因为这是一个学习 Demo，主要目的是快速上手和理解 RBAC 权限系统。自动同步可以减少配置步骤，让学习者专注于核心逻辑。

### Q2: 如果我想在生产环境使用，该怎么做？

**A**:

1. 关闭 `synchronize: true`
2. 使用 `init.sql` 初始化数据库
3. 或者使用 TypeORM 的 Migration 功能
4. 定期备份数据库

### Q3: `npm run seed` 和 `init.sql` 有什么区别？

**A**:

- `npm run seed`: 使用 TypeORM 操作数据库，密码会自动加密
- `init.sql`: 直接执行 SQL，需要预先生成密码哈希

### Q4: 能同时使用两种方式吗？

**A**: 不建议。选择其一即可：

- 开发环境：TypeORM 自动同步 + seed
- 生产环境：SQL 脚本或 Migration

### Q5: 如何切换到 SQL 脚本初始化？

**A**:

```typescript
// src/app.module.ts
synchronize: false, // 改为 false

// 然后执行
mysql -u root -p < init.sql
```

---

## 推荐工作流

### 开发阶段

```bash
1. npm install
2. docker-compose up -d  # 启动 MySQL 和 Redis
3. npm run start:dev     # TypeORM 自动创建表
4. npm run seed          # 插入测试数据
```

### 生产部署

```bash
1. 修改 synchronize: false
2. 执行 init.sql（或使用 Migration）
3. npm run build
4. npm run start:prod
```

---

## 总结

- **学习 Demo**: 使用 TypeORM 自动同步（当前配置）
- **生产环境**: 使用 `init.sql` 或 TypeORM Migration
- **两种方式各有优缺点，根据场景选择**

现在你有了完整的 `init.sql` 文件，可以随时切换到 SQL 脚本初始化方式！🎉
