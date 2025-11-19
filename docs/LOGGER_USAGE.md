# Winston 日志使用指南

## 如何在项目中使用日志

### 在控制器或服务中注入 Winston Logger

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

  async createUser(userData: any) {
    // 记录信息日志
    this.logger.info("Creating user", {
      username: userData.username,
      context: "UsersService",
    });

    try {
      const user = await this.userRepository.save(userData);

      // 记录成功日志
      this.logger.info("User created successfully", {
        userId: user.id,
        username: user.username,
        context: "UsersService",
      });

      return user;
    } catch (error) {
      // 记录错误日志
      this.logger.error("User creation failed", {
        username: userData.username,
        error: error.message,
        stack: error.stack,
        context: "UsersService",
      });

      throw error;
    }
  }
}
```

## 日志级别

| 方法             | 用途      | 示例                            |
| ---------------- | --------- | ------------------------------- |
| `logger.error()` | 错误信息  | 数据库连接失败、API 调用失败    |
| `logger.warn()`  | 警告信息  | 弃用警告、配置缺失              |
| `logger.info()`  | 一般信息  | 应用启动、重要操作完成          |
| `logger.http()`  | HTTP 请求 | 请求/响应日志（拦截器自动记录） |
| `logger.debug()` | 调试信息  | 变量值、执行流程                |

## 最佳实践

### ✅ 推荐

1. **使用结构化日志**

```typescript
// ✅ 好 - 便于搜索和分析
this.logger.info("Order created", {
  orderId: 123,
  userId: 456,
  amount: 99.99,
  context: "OrderService",
});
```

2. **包含上下文信息**

```typescript
// ✅ 总是添加 context
this.logger.error("Payment failed", {
  context: "PaymentService", // 便于追踪来源
  error: error.message,
  stack: error.stack,
  orderId: order.id,
});
```

### ❌ 避免

```typescript
// ❌ 不好 - 字符串拼接
this.logger.info(`User ${user.id} created order ${order.id}`);

// ❌ 不好 - 记录敏感信息
this.logger.info("Login attempt", {
  username: user.username,
  password: user.password, // 危险！
});
```

## HTTP 请求日志

HTTP 拦截器会自动记录所有请求，无需手动编写：

- ✅ 请求信息（method, url, ip, userAgent）
- ✅ 响应信息（statusCode, responseTime）
- ✅ 错误信息（error, stack）
- ✅ 敏感字段自动脱敏

## 查看日志

```bash
# 实时查看今天的应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 格式化 JSON 日志
tail -f logs/application-$(date +%Y-%m-%d).log | jq '.'
```

## 环境配置

在 `.env` 文件中设置：

```bash
# development: 控制台 + 文件输出，debug 级别
# production: 仅文件输出，info 级别
NODE_ENV=development
```

就这么简单！🚀
