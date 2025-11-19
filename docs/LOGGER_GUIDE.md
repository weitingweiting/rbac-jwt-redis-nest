# Winston 日志模块

本项目使用 Winston 实现了完整的日志功能。

## 功能特性

- ✅ 多日志级别：error, warn, info, http, debug
- ✅ 日志文件按日期轮转（DailyRotateFile）
- ✅ 分类日志文件：
  - `application-*.log` - 所有日志（保留 14 天）
  - `error-*.log` - 错误日志（保留 30 天）
  - `http-*.log` - HTTP 请求日志（保留 7 天）
  - `exceptions.log` - 未捕获异常
  - `rejections.log` - 未处理的 Promise 拒绝
- ✅ 日志文件自动压缩
- ✅ 敏感信息过滤（密码、token 等）
- ✅ HTTP 请求/响应自动日志记录
- ✅ 彩色控制台输出（开发环境）
- ✅ 结构化日志（JSON 格式）

## 文件结构

```
src/
├── config/
│   └── winston.config.ts       # Winston配置
├── logger/
│   ├── logger.module.ts        # 日志模块
│   └── logging.interceptor.ts  # HTTP日志拦截器
```

## 使用方法

### 1. 在控制器或服务中使用

```typescript
import { Controller, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  getUsers() {
    this.logger.info("Fetching users list");

    try {
      // 业务逻辑
      const users = [];
      this.logger.debug("Found users", { count: users.length });
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

### 2. 在服务中使用

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class MyService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  doSomething() {
    this.logger.info("Processing data", {
      context: "MyService",
      action: "doSomething"
    });
    this.logger.warn("Low memory warning", {
      context: "MyService",
      memoryUsage: "85%"
    });
    this.logger.error("Processing failed", {
      context: "MyService",
      error: "Connection timeout",
      stack: "Error stack trace..."
    });
  }
}
}
```

### 3. HTTP 请求日志（自动）

HTTP 拦截器会自动记录：

- 请求方法、URL、IP、User-Agent
- 请求体（敏感字段已脱敏）
- 响应状态码和响应时间
- 错误信息和堆栈跟踪

示例日志输出：

```json
{
  "level": "http",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "ip": "::1",
  "userAgent": "Mozilla/5.0...",
  "body": {
    "username": "admin",
    "password": "***REDACTED***"
  },
  "timestamp": "2025-11-13 10:30:45"
}
```

## 日志级别

按优先级从高到低：

| 级别  | 用途      | 示例                         |
| ----- | --------- | ---------------------------- |
| error | 错误信息  | 数据库连接失败、API 调用失败 |
| warn  | 警告信息  | 弃用警告、配置缺失           |
| info  | 一般信息  | 应用启动、重要操作完成       |
| http  | HTTP 请求 | 请求/响应日志                |
| debug | 调试信息  | 变量值、执行流程             |

## 配置说明

### 环境变量控制

在 `.env` 文件中设置：

```bash
NODE_ENV=production  # production 或 development
```

- **开发环境** (`development`)：

  - 日志级别：`debug`
  - 控制台输出：彩色格式
  - 包含详细调试信息

- **生产环境** (`production`)：
  - 日志级别：`info`
  - 仅文件输出
  - JSON 格式

### 日志文件配置

在 `winston.config.ts` 中可以调整：

```typescript
// 修改日志保留天数
maxFiles: "14d"; // 保留14天

// 修改单个文件最大大小
maxSize: "20m"; // 每个文件最大20MB

// 修改日期格式
datePattern: "YYYY-MM-DD";
```

## 敏感信息保护

拦截器会自动脱敏以下字段：

- `password`
- `token`
- `secret`
- `apiKey`

在 `logging.interceptor.ts` 中可以添加更多敏感字段：

```typescript
const sensitiveFields = ["password", "token", "secret", "apiKey", "creditCard"];
```

## 查看日志

日志文件位于项目根目录的 `logs/` 文件夹：

```bash
# 查看今天的应用日志
tail -f logs/application-2025-11-13.log

# 查看错误日志
tail -f logs/error-2025-11-13.log

# 查看HTTP日志
tail -f logs/http-2025-11-13.log

# 使用jq格式化JSON日志
tail -f logs/application-2025-11-13.log | jq '.'
```

## 最佳实践

1. **使用合适的日志级别**

   - 不要在生产环境使用 `debug` 级别
   - 错误必须使用 `error` 级别
   - 警告使用 `warn` 级别

2. **添加上下文信息**

   ```typescript
   this.logger.info("User login", {
     userId: user.id,
     username: user.username,
   });
   ```

3. **记录错误堆栈**

   ```typescript
   catch (error) {
     this.logger.error('Operation failed', {
       message: error.message,
       stack: error.stack
     });
   }
   ```

4. **避免记录敏感信息**

   - 密码、token、个人身份信息等

5. **使用结构化日志**
   - 传递对象而不是字符串拼接
   - 便于日志分析和查询

## 日志监控建议

在生产环境中，建议集成日志监控服务：

- **ELK Stack**（Elasticsearch + Logstash + Kibana）
- **Grafana Loki**
- **云服务**：AWS CloudWatch、Azure Monitor、阿里云 SLS

可以通过 Winston 的 transport 插件轻松集成这些服务。

## 故障排查

### 日志文件未生成

1. 检查 `logs/` 目录权限
2. 确保应用有写入权限
3. 查看控制台是否有错误信息

### 日志级别不符合预期

检查 `NODE_ENV` 环境变量设置：

```bash
echo $NODE_ENV
```

### 性能问题

如果日志量很大：

1. 调整日志级别（生产环境使用 `info`）
2. 减少日志保留天数
3. 减小单个文件大小限制
