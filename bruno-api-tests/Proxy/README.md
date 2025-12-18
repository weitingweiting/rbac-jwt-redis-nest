# Proxy API Tests

代理转发服务的 API 测试集合。

## 测试场景

### 成功场景（外部 API）

- `01-proxy-get-request.bru` - GET 请求代理（GitHub API）
- `02-proxy-post-request.bru` - POST 请求代理（JSONPlaceholder）
- `03-proxy-with-params.bru` - 带查询参数的代理请求

### 失败场景

- `10-proxy-no-token.bru` - 缺少认证 Token
- `11-proxy-invalid-url.bru` - 无效的目标 URL
- `12-proxy-missing-url.bru` - 缺少必需的 targetUrl 参数

### 本地测试场景（推荐开发使用）

- `20-proxy-local-test.bru` - 代理到本地测试接口
- `21-proxy-local-post.bru` - 代理到本地 POST 接口
- `22-proxy-retry-test.bru` - 测试重试机制（不稳定接口）

## 测试说明

### 外部测试 API

这些测试使用公共的测试 API：

- **GitHub API**: https://api.github.com - 用于测试 GET 请求
- **JSONPlaceholder**: https://jsonplaceholder.typicode.com - 用于测试 POST 和查询参数

⚠️ 在生产环境中，请确保这些域名在 `PROXY_ALLOWED_DOMAINS` 白名单中。

### 本地测试 API

开发阶段推荐使用本地测试接口（`/proxy-test/*`）：

- ✅ 无需网络连接
- ✅ 响应速度快
- ✅ 可测试各种场景（成功、失败、慢响应、重试等）
- ✅ 不需要配置白名单

可用的测试接口：

- `GET /api/v1/proxy-test/success` - 成功响应
- `GET /api/v1/proxy-test/list` - 列表数据
- `GET /api/v1/proxy-test/slow` - 慢响应（5秒）
- `GET /api/v1/proxy-test/very-slow` - 极慢响应（40秒，测试超时）
- `GET /api/v1/proxy-test/error` - 服务器错误
- `GET /api/v1/proxy-test/bad-request` - 客户端错误
- `GET /api/v1/proxy-test/unstable` - 不稳定接口（50% 失败率，测试重试）
- `POST /api/v1/proxy-test/echo` - 回显请求数据
- `POST /api/v1/proxy-test/create` - 创建资源
- `GET /api/v1/proxy-test/random` - 随机延迟（1-10秒）
- `GET /api/v1/proxy-test/large-data` - 大数据响应

## 运行测试

1. 确保已登录并获取 `access_token`（先运行 Auth 测试）
2. 在 Bruno 中选择 Proxy 文件夹
3. 点击 "Run Collection" 运行所有测试

## 环境变量

测试使用的环境变量：

- `base_url`: API 基础 URL（例如：http://localhost:3000/api/v1）
- `access_token`: JWT 认证 Token（从登录接口获取）

## 测试重试机制

要测试重试机制，需要配置环境变量：

```bash
# .env
PROXY_MAX_RETRIES=2  # 最多重试 2 次
```

然后运行 `22-proxy-retry-test.bru`，观察日志中的重试信息。

## 注意事项

1. 测试外部 API（01-03）需要网络连接
2. 本地测试（20-22）可以离线使用
3. 生产环境可以删除 `ProxyTestController`
4. 重试测试可能需要较长时间
