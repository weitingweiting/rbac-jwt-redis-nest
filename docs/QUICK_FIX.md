# 🚨 TypeScript 服务崩溃 - 快速修复指南

## ⚡ 立即执行（3 步）

### 1️⃣ 重启 TypeScript 服务器

```
在 VS Code 中：
Cmd+Shift+P → 输入 "TypeScript: Restart TS Server" → 回车
```

### 2️⃣ 重新加载窗口

```
Cmd+Shift+P → 输入 "Developer: Reload Window" → 回车
```

### 3️⃣ 验证修复

```bash
# 检查是否还有循环依赖
pnpm run check:circular

# 应该显示：✔ No circular dependency found!
```

---

## ✅ 已修复的问题

### 1. **循环依赖修复**

- ❌ 修复前：2 个循环依赖
- ✅ 修复后：0 个循环依赖

**修复的文件：**

- `src/shared/entities/user.entity.ts`
- `src/shared/entities/role.entity.ts`
- `src/shared/entities/permission.entity.ts`

### 2. **VS Code 性能优化**

已更新 `.vscode/settings.json`：

- ✅ TS Server 内存限制提升到 4GB
- ✅ 禁用自动类型获取
- ✅ 优化文件监控范围
- ✅ 减少代码提示延迟

---

## 🔍 如果问题仍存在

### 选项 A：清理并重启

```bash
# 1. 清理缓存
rm -rf node_modules/.cache
rm -rf dist

# 2. 重启 VS Code
# 关闭并重新打开
```

### 选项 B：禁用 Copilot Chat

```
扩展面板 (Cmd+Shift+X) → 搜索 "GitHub Copilot Chat" → 禁用（工作区）
```

### 选项 C：降低内存限制

编辑 `.vscode/settings.json`：

```json
{
  "typescript.tsserver.maxTsServerMemory": 3072
}
```

---

## 📊 监控脚本

### 定期检查循环依赖

```bash
pnpm run check:circular
```

### 查看 TS Server 进程

```bash
# macOS
ps aux | grep tsserver

# 监控内存
top -pid $(pgrep -f tsserver)
```

---

## 📚 详细文档

- **完整排查指南：** `docs/TS_SERVER_CRASH_FIX.md`
- **循环依赖修复详情：** `docs/CIRCULAR_DEPENDENCY_FIX.md`

---

## 🎯 问题根源

1. **循环依赖**（已修复）
   - Entity 类之间的循环导入
   - 导致 TypeScript 类型推断陷入死循环

2. **内存不足**（已优化）
   - TS Server 默认内存限制过低
   - 现已提升到 4GB

3. **文件监控过多**（已优化）
   - 排除了不必要的文件夹监控
   - 减轻 I/O 负担

---

**现在重启 VS Code，问题应该已解决！** 🎉
