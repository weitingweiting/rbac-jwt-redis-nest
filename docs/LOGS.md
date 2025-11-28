# 日志目录

此目录用于存储应用程序的日志文件。

## 日志文件类型

- `application-YYYY-MM-DD.log` - 所有级别的应用日志
- `error-YYYY-MM-DD.log` - 仅错误日志
- `http-YYYY-MM-DD.log` - HTTP 请求/响应日志
- `exceptions.log` - 未捕获的异常
- `rejections.log` - 未处理的 Promise 拒绝

## 注意事项

- 日志文件会自动按日期轮转
- 超过配置保留期的日志会自动删除
- 日志文件会自动压缩以节省空间
- 此目录已在 `.gitignore` 中忽略，不会提交到版本控制

## 查看日志

```bash
# 实时查看应用日志
tail -f logs/application-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log

# 使用 jq 格式化 JSON 日志
tail -f logs/application-$(date +%Y-%m-%d).log | jq '.'
```
