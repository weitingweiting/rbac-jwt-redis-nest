# VS Code TypeScript 语言服务崩溃解决方案

## 🔴 问题现象

```
The JS/TS language service crashed 5 times in the last 5 Minutes.
This may be caused by a plugin contributed by one of these extensions: GitHub.copilot-chat
```

## ✅ 已实施的优化

### 1. VS Code 设置优化（`.vscode/settings.json`）

已添加以下关键配置：

```json
{
  // 增加 TS Server 内存限制（4GB）
  "typescript.tsserver.maxTsServerMemory": 4096,

  // 禁用自动类型获取
  "typescript.disableAutomaticTypeAcquisition": true,

  // 关闭 TS Server 日志
  "typescript.tsserver.log": "off",

  // 减少代码提示延迟
  "editor.quickSuggestionsDelay": 10,

  // 限制建议来源
  "editor.suggest.showWords": false
}
```

### 2. TypeScript 配置（`tsconfig.json`）

已包含的性能优化：

```json
{
  "compilerOptions": {
    "incremental": true, // 增量编译
    "skipLibCheck": true, // 跳过库文件检查
    "strict": false // 关闭严格模式（减少类型检查负担）
  }
}
```

---

## 🚀 立即执行的操作

### 步骤 1：重启 TypeScript 服务器

在 VS Code 中按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows/Linux），输入：

```
TypeScript: Restart TS Server
```

### 步骤 2：清理并重新安装依赖（如果步骤 1 无效）

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules pnpm-lock.yaml

# 清理 pnpm 缓存
pnpm store prune

# 重新安装
pnpm install
```

### 步骤 3：清理 VS Code 缓存（如果步骤 2 无效）

```bash
# 关闭 VS Code
# 删除 TypeScript 缓存
rm -rf ~/Library/Caches/typescript  # macOS
# 或 %LOCALAPPDATA%\Microsoft\TypeScript  # Windows

# 重新打开项目
```

---

## 🔧 进阶排查步骤

### 1. 临时禁用 Copilot Chat 扩展

错误提示指向 `GitHub.copilot-chat`，尝试：

1. 打开 VS Code 扩展面板（`Cmd+Shift+X`）
2. 搜索 "GitHub Copilot Chat"
3. 点击"禁用（工作区）"
4. 重启 VS Code
5. 观察是否还崩溃

### 2. 启用 TS Server 日志（调试）

临时修改 `.vscode/settings.json`：

```json
{
  "typescript.tsserver.log": "verbose"
}
```

日志位置：

- Mac: `~/Library/Application Support/Code/logs/`
- Windows: `%APPDATA%\Code\logs\`

查看 `tsserver.log` 文件，找到崩溃前的错误信息。

### 3. 检查 Node.js 版本

```bash
node --version
```

推荐版本：Node.js 18.x 或 20.x

如果版本过旧，升级 Node.js：

```bash
# 使用 nvm（推荐）
nvm install 20
nvm use 20

# 或使用官方安装包
# https://nodejs.org/
```

### 4. 检查系统资源

```bash
# macOS
top -l 1 | grep "PhysMem"
# 查看可用内存

# 检查 VS Code 进程
ps aux | grep "Code Helper (Plugin)"
```

如果内存不足（< 8GB 可用），考虑：

- 关闭其他大型应用
- 降低 TS Server 内存限制为 3072 或 2048

---

## 🛡️ 预防措施

### 1. 避免循环依赖

使用工具检测循环依赖：

```bash
# 安装 madge
pnpm add -D madge

# 检测循环依赖
npx madge --circular --extensions ts src
```

### 2. 优化导入路径

使用路径别名（已配置 `@/*`），避免：

```typescript
// ❌ 不推荐（相对路径）
import { User } from '../../../shared/entities/user.entity'

// ✅ 推荐（路径别名）
import { User } from '@/shared/entities/user.entity'
```

### 3. 分批导入大型模块

避免一次性导入过多：

```typescript
// ❌ 不推荐
import * as _ from 'lodash'

// ✅ 推荐
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
```

### 4. 定期清理

```bash
# 每周执行一次
pnpm store prune
rm -rf node_modules/.cache
```

---

## 📊 监控和调优

### 性能监控命令

```bash
# 查看 TS Server 进程
ps aux | grep tsserver

# 监控内存使用
top -pid $(pgrep -f tsserver)
```

### 如果问题持续

1. **减少内存限制**：

   ```json
   "typescript.tsserver.maxTsServerMemory": 3072
   ```

2. **禁用更多功能**：

   ```json
   {
     "typescript.suggest.autoImports": false,
     "typescript.updateImportsOnFileMove.enabled": "never"
   }
   ```

3. **使用轻量级编辑器**：
   - 考虑使用 Cursor（基于 VS Code，但优化更好）
   - 或临时使用 Vim/Neovim

---

## 🆘 最后手段

### 完全重置 VS Code

```bash
# 1. 备份设置
cp ~/.config/Code/User/settings.json ~/settings.json.backup

# 2. 删除 VS Code 数据（macOS）
rm -rf ~/Library/Application\ Support/Code
rm -rf ~/Library/Caches/com.microsoft.VSCode*
rm -rf ~/.vscode

# 3. 重新安装 VS Code
# 从官网下载最新版本

# 4. 恢复项目设置（保留工作区设置）
# .vscode/settings.json 已保留
```

---

## 📈 效果验证

优化后，您应该看到：

- ✅ TS Server 不再频繁崩溃
- ✅ 代码提示响应更快
- ✅ 文件保存时格式化速度提升
- ✅ 项目打开速度加快

如果问题仍存在，请：

1. 查看 TS Server 日志（启用 verbose 模式）
2. 在 VS Code GitHub 仓库提 Issue
3. 附上系统信息、日志和项目配置

---

## 🔗 参考资源

- [VS Code TypeScript Performance](https://code.visualstudio.com/docs/typescript/typescript-performance)
- [TypeScript Wiki - Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [NestJS Performance Tips](https://docs.nestjs.com/techniques/performance)
