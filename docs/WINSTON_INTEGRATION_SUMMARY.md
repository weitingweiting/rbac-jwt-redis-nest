# Winston 日志模块集成总结

## 已完成的工作

### 1. ✅ 安装依赖

- `winston` - 核心日志库
- `nest-winston` - NestJS 集成
- `winston-daily-rotate-file` - 日志文件轮转

### 2. ✅ 创建配置文件

- `src/config/winston.config.ts` - Winston 核心配置
  - 多级别日志配置（error, warn, info, http, debug）
  - 环境感知（开发/生产环境不同配置）
  - 文件轮转配置（按日期、大小）
  - 异常和拒绝处理

### 3. ✅ 创建日志模块

- `src/logger/logger.module.ts` - 日志模块
- `src/logger/logging.interceptor.ts` - HTTP 请求日志拦截器

### 4. ✅ 集成到应用

- 在 `app.module.ts` 中导入 LoggerModule
- 在 `app.module.ts` 中全局注册 LoggingInterceptor
- 在 `main.ts` 中设置 Winston 为全局日志器

### 5. ✅ 添加使用示例

- 在 `auth.controller.ts` 中添加了日志使用示例
- 记录登录、注册、登出等关键操作

### 6. ✅ 配置管理

- 更新 `.env.example` 添加 NODE_ENV 配置
- 创建 `scripts/ensure-logs-dir.js` 确保日志目录存在
- 更新 `package.json` 添加 prestart 脚本

### 7. ✅ 文档完善

- 创建 `LOGGER_GUIDE.md` - 日志功能完整指南
- 创建 `LOGGER_EXAMPLES.md` - 详细使用示例
- 创建 `logs/README.md` - 日志目录说明
- 更新主 `README.md` 添加日志系统说明

## 日志功能特性

### 📁 日志文件分类

- `application-YYYY-MM-DD.log` - 所有级别日志（保留 14 天）
- `error-YYYY-MM-DD.log` - 仅错误日志（保留 30 天）
- `http-YYYY-MM-DD.log` - HTTP 请求日志（保留 7 天）
- `exceptions.log` - 未捕获异常
- `rejections.log` - Promise 拒绝

### 🎯 日志级别

1. **error** - 错误信息
2. **warn** - 警告信息
3. **info** - 一般信息
4. **http** - HTTP 请求
5. **debug** - 调试信息

### 🔒 安全特性

- 自动脱敏敏感字段（password, token, secret, apiKey）
- 可配置的敏感字段列表
- 生产环境不输出调试日志

### 🔄 自动化功能

- 日志文件按日期轮转
- 超过 20MB 自动分割
- 旧日志自动压缩
- 过期日志自动删除
- HTTP 请求/响应自动记录

### 🎨 开发体验

- 开发环境彩色控制台输出
- 美观的嵌套格式
- 生产环境 JSON 格式便于分析
- 包含时间戳、上下文等元信息

## 使用方法

### 在控制器/服务中注入日志器

```typescript
import { Controller, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async getUsers() {
    this.logger.info("Fetching users");

    try {
      const users = await this.usersService.findAll();
      this.logger.debug("Users retrieved", { count: users.length });
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### HTTP 请求自动日志

LoggingInterceptor 会自动记录：

- 请求信息（method, url, ip, userAgent, body）
- 响应信息（statusCode, responseTime）
- 错误信息（error, stack）

无需手动编写代码！

## 查看日志

```bash
# 实时查看今天的应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 查看 HTTP 日志
tail -f logs/http-$(date +%Y-%m-%d).log

# 使用 jq 格式化 JSON 日志
tail -f logs/application-$(date +%Y-%m-%d).log | jq '.'

# 过滤错误级别日志
tail -f logs/application-$(date +%Y-%m-%d).log | jq 'select(.level=="error")'

# 搜索特定用户的日志
grep "userId.*123" logs/application-$(date +%Y-%m-%d).log
```

## 环境配置

### 开发环境

```bash
NODE_ENV=development
```

- 日志级别：debug
- 输出：控制台（彩色）+ 文件
- 格式：美观的嵌套格式

### 生产环境

```bash
NODE_ENV=production
```

- 日志级别：info
- 输出：仅文件
- 格式：JSON（便于分析）

## 最佳实践

### ✅ 推荐

1. **添加上下文信息**

```typescript
this.logger.info("User login", {
  userId: user.id,
  username: user.username,
});
```

2. **使用结构化日志**

```typescript
this.logger.error("Payment failed", {
  orderId: 123,
  amount: 99.99,
  error: error.message,
  stack: error.stack,
});
```

3. **记录关键业务事件**

- 用户登录/登出
- 权限变更
- 重要操作（创建、删除等）

### ❌ 避免

1. **不记录敏感信息**（已自动脱敏，但仍需注意）
2. **不在循环中过度记录**
3. **不记录过大的对象**

## 性能考虑

1. ✅ Winston 默认异步写入，不阻塞应用
2. ✅ 生产环境使用 info 级别，减少日志量
3. ✅ 自动日志轮转和压缩，节省存储空间
4. ✅ 自动清理过期日志

## 日志分析建议

### 本地开发

- 使用 `tail -f` 实时查看
- 使用 `jq` 格式化和过滤 JSON

### 生产环境

建议集成专业日志分析工具：

1. **ELK Stack**

   - Elasticsearch + Logstash + Kibana
   - 强大的搜索和可视化能力

2. **Grafana Loki**

   - 轻量级日志聚合系统
   - 与 Grafana 无缝集成

3. **云服务**
   - AWS CloudWatch Logs
   - Azure Monitor
   - Google Cloud Logging
   - 阿里云 SLS

## 文件清单

### 核心代码

- ✅ `src/config/winston.config.ts`
- ✅ `src/logger/logger.module.ts`
- ✅ `src/logger/logging.interceptor.ts`

### 配置文件

- ✅ `package.json` (添加依赖和脚本)
- ✅ `.env.example` (添加 NODE_ENV)
- ✅ `scripts/ensure-logs-dir.js`

### 文档

- ✅ `LOGGER_GUIDE.md`
- ✅ `LOGGER_EXAMPLES.md`
- ✅ `logs/README.md`
- ✅ `README.md` (更新主文档)

### 示例

- ✅ `src/auth/auth.controller.ts` (添加日志使用示例)

## 测试验证

```bash
# 1. 编译检查（已通过）
pnpm run build

# 2. 启动应用
pnpm run start:dev

# 3. 发送测试请求
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"root123456"}'

# 4. 查看日志
tail -f logs/application-$(date +%Y-%m-%d).log
tail -f logs/http-$(date +%Y-%m-%d).log
```

## 后续优化建议

1. **日志采样**：高流量情况下对 HTTP 日志进行采样
2. **日志脱敏增强**：根据实际需求添加更多敏感字段
3. **日志聚合**：接入 ELK 或 Loki 等日志分析平台
4. **告警配置**：基于错误日志设置告警通知
5. **性能监控**：添加响应时间统计和慢查询日志

## 总结

✅ Winston 日志模块已完全集成并按照最佳实践配置  
✅ 支持多级别、多文件、自动轮转  
✅ 自动记录 HTTP 请求和响应  
✅ 敏感信息自动脱敏  
✅ 提供完整的使用文档和示例  
✅ 开发和生产环境配置分离  
✅ 编译通过，无错误

日志系统已准备就绪，可以立即投入使用！🎉
