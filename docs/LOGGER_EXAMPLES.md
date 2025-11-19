# Winston 日志使用示例

## 目录结构

```
src/
├── config/
│   └── winston.config.ts          # Winston 核心配置
├── logger/
│   ├── logger.module.ts           # 日志模块
│   └── logging.interceptor.ts     # HTTP 请求日志拦截器
├── app.module.ts                  # 导入日志模块
└── main.ts                        # 设置全局日志器
```

## 使用示例

### 1. 在控制器中使用（推荐方式）

```typescript
import { Controller, Get, Post, Body, Inject } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  @Get()
  async findAll() {
    this.logger.info("Fetching all users");

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

  @Post()
  async create(@Body() createUserDto: any) {
    this.logger.info("Creating new user", {
      username: createUserDto.username,
    });

    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.info("User created successfully", {
        userId: user.id,
        username: user.username,
      });
      return user;
    } catch (error) {
      this.logger.error("User creation failed", {
        username: createUserDto.username,
        error: error.message,
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
export class UsersService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  async findOne(id: number) {
    this.logger.debug("Finding user by id", { userId: id });

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn("User not found", { userId: id });
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updatePermissions(userId: number, permissions: string[]) {
    this.logger.info("Updating user permissions", {
      userId,
      permissions,
    });

    try {
      const result = await this.userRepository.update(userId, { permissions });

      this.logger.info("Permissions updated successfully", {
        userId,
        affectedRows: result.affected,
      });

      return result;
    } catch (error) {
      this.logger.error("Failed to update permissions", {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### 3. 在中间件中使用

```typescript
import { Injectable, NestMiddleware, Inject } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;

    this.logger.http("Incoming request", {
      method,
      url: originalUrl,
      ip,
      userAgent: req.get("user-agent"),
    });

    next();
  }
}
```

### 4. 在守卫中使用

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredRoles = this.reflector.get("roles", context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const hasRole = user.roles.some((role) => requiredRoles.includes(role));

    if (!hasRole) {
      this.logger.warn("Access denied - insufficient roles", {
        userId: user.id,
        userRoles: user.roles,
        requiredRoles,
      });
    }

    return hasRole;
  }
}
```

### 5. 推荐的标准用法

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
    // 使用 Winston 结构化日志
    this.logger.info("Processing data", {
      context: "MyService",
      operation: "doSomething",
      timestamp: new Date().toISOString(),
    });

    this.logger.warn("Low memory warning", {
      context: "MyService",
      memoryUsage: "85%",
      threshold: "80%",
    });

    this.logger.error("Processing failed", {
      context: "MyService",
      error: "Connection timeout",
      stack: "Error stack trace...",
      retryCount: 3,
    });
    this.logger.debug("Variable value", "MyService");
  }
}
```

## 日志级别使用指南

### error - 错误（最高优先级）

用于记录错误和异常

```typescript
this.logger.error("Database connection failed", {
  host: dbConfig.host,
  port: dbConfig.port,
  error: error.message,
  stack: error.stack,
});
```

### warn - 警告

用于潜在问题或不常见的情况

```typescript
this.logger.warn("API rate limit approaching", {
  userId: user.id,
  currentCount: 95,
  limit: 100,
});
```

### info - 信息

用于重要的业务事件

```typescript
this.logger.info("User logged in", {
  userId: user.id,
  username: user.username,
  loginTime: new Date().toISOString(),
});
```

### http - HTTP 请求

用于 HTTP 请求和响应（拦截器自动处理）

```typescript
this.logger.http("External API call", {
  url: "https://api.example.com/users",
  method: "GET",
  statusCode: 200,
  responseTime: "125ms",
});
```

### debug - 调试

用于开发和调试信息

```typescript
this.logger.debug("Cache lookup", {
  key: cacheKey,
  hit: true,
  ttl: 3600,
});
```

## 最佳实践

### ✅ 推荐做法

1. **添加上下文信息**

```typescript
// 好
this.logger.info("Order created", {
  orderId: order.id,
  userId: user.id,
  total: order.total,
  items: order.items.length,
});

// 不好
this.logger.info("Order created");
```

2. **使用结构化日志**

```typescript
// 好
this.logger.error("Payment failed", {
  orderId: 123,
  amount: 99.99,
  error: error.message,
});

// 不好
this.logger.error(
  `Payment failed for order 123, amount: 99.99, error: ${error.message}`
);
```

3. **记录错误堆栈**

```typescript
// 好
this.logger.error("Unexpected error", {
  message: error.message,
  stack: error.stack,
  context: "UsersService.create",
});

// 不好
this.logger.error(error.message);
```

### ❌ 避免的做法

1. **不要记录敏感信息**

```typescript
// 危险！
this.logger.info("User login", {
  username: user.username,
  password: user.password, // ❌ 不要记录密码！
});

// 安全
this.logger.info("User login", {
  username: user.username,
});
```

2. **不要在循环中过度记录**

```typescript
// 不好 - 可能产生大量日志
users.forEach((user) => {
  this.logger.debug("Processing user", { userId: user.id });
  // ...
});

// 好 - 只记录汇总信息
this.logger.info("Processing users", { count: users.length });
users.forEach((user) => {
  // ...
});
this.logger.info("Users processed successfully");
```

3. **不要记录过大的对象**

```typescript
// 不好 - 可能包含大量数据
this.logger.debug("Full request", { request });

// 好 - 只记录关键信息
this.logger.debug("Request received", {
  method: request.method,
  url: request.url,
  bodySize: JSON.stringify(request.body).length,
});
```

## HTTP 拦截器自动日志

已配置的 `LoggingInterceptor` 会自动记录所有 HTTP 请求和响应：

**请求日志示例：**

```json
{
  "level": "http",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "ip": "::1",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "body": {
    "username": "admin",
    "password": "***REDACTED***"
  },
  "timestamp": "2025-11-13 10:30:45"
}
```

**响应日志示例：**

```json
{
  "level": "http",
  "message": "HTTP Response",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": "125ms",
  "timestamp": "2025-11-13 10:30:45"
}
```

**错误日志示例：**

```json
{
  "level": "error",
  "message": "HTTP Error",
  "method": "GET",
  "url": "/api/users/999",
  "statusCode": 404,
  "responseTime": "15ms",
  "error": "User not found",
  "stack": "Error: User not found\n    at UsersService.findOne...",
  "timestamp": "2025-11-13 10:30:45"
}
```

## 环境配置

### 开发环境 (.env.development)

```bash
NODE_ENV=development
```

- 日志级别：debug
- 输出：控制台（彩色）+ 文件
- 格式：美观的嵌套格式

### 生产环境 (.env.production)

```bash
NODE_ENV=production
```

- 日志级别：info
- 输出：仅文件
- 格式：JSON（便于分析）

## 查看日志

### 实时查看

```bash
# 查看今天的应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 查看 HTTP 日志
tail -f logs/http-$(date +%Y-%m-%d).log
```

### 格式化 JSON 日志

```bash
# 使用 jq 格式化
tail -f logs/application-$(date +%Y-%m-%d).log | jq '.'

# 过滤特定级别
tail -f logs/application-$(date +%Y-%m-%d).log | jq 'select(.level=="error")'

# 提取特定字段
tail -f logs/application-$(date +%Y-%m-%d).log | jq '{level, message, timestamp}'
```

### 搜索日志

```bash
# 搜索特定用户的日志
grep "userId.*123" logs/application-$(date +%Y-%m-%d).log

# 搜索错误
grep "level.*error" logs/application-$(date +%Y-%m-%d).log

# 统计错误数量
grep -c "level.*error" logs/application-$(date +%Y-%m-%d).log
```

## 性能考虑

1. **日志级别**：生产环境使用 `info`，避免使用 `debug`
2. **日志量**：避免在高频路径记录过多日志
3. **文件轮转**：已配置自动轮转和压缩
4. **异步写入**：Winston 默认异步写入，不会阻塞应用

## 日志分析建议

### 使用 ELK Stack

1. 安装 Filebeat 收集日志
2. 发送到 Logstash 处理
3. 存储到 Elasticsearch
4. 使用 Kibana 可视化

### 使用 Grafana Loki

1. 配置 Promtail 采集日志
2. 推送到 Loki
3. 在 Grafana 中查询和可视化

### 云服务

- AWS CloudWatch Logs
- Azure Monitor
- Google Cloud Logging
- 阿里云 SLS
