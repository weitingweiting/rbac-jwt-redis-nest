# TypeScript 语言服务崩溃问题 - 解决总结

## ✅ 已完成的修复

### 1. **VS Code 性能优化配置**

已更新 `.vscode/settings.json`，添加以下关键配置：

```json
{
  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.disableAutomaticTypeAcquisition": true,
  "typescript.tsserver.log": "off",
  "editor.quickSuggestionsDelay": 10,
  "editor.suggest.showWords": false
}
```

### 2. **修复循环依赖**（重要！）

发现并修复了 2 个循环依赖：

**修复前：**

```
1) permission.entity.ts → role.entity.ts
2) role.entity.ts → user.entity.ts → role.entity.ts（循环）
```

**修复方案：**
使用 TypeORM 字符串引用替代直接导入：

```typescript
// ❌ 修复前（导致循环依赖）
import { Role } from './role.entity'
@ManyToMany(() => Role, (role) => role.permissions)
roles!: Role[]

// ✅ 修复后（字符串引用）
@ManyToMany('Role', 'permissions')
roles!: any[]
```

**验证结果：**

```bash
npx madge --circular --extensions ts src
✔ No circular dependency found!
```

---

## 🚀 立即执行（必需）

### 步骤 1：重启 TypeScript 服务器

在 VS Code 中：

1. 按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows）
2. 输入：`TypeScript: Restart TS Server`
3. 按回车

### 步骤 2：重新加载窗口（推荐）

在 VS Code 中：

1. 按 `Cmd+Shift+P`
2. 输入：`Developer: Reload Window`
3. 按回车

---

## 📊 预期效果

修复后，您应该看到：

- ✅ TS Server 不再频繁崩溃
- ✅ 代码提示响应速度提升
- ✅ 文件保存格式化更快
- ✅ 项目打开速度加快
- ✅ CPU 和内存占用降低

---

## 🔍 如果问题仍然存在

### 方案 A：临时禁用 Copilot Chat

1. 打开扩展面板（`Cmd+Shift+X`）
2. 搜索 "GitHub Copilot Chat"
3. 点击"禁用（工作区）"
4. 重启 VS Code

### 方案 B：启用详细日志

修改 `.vscode/settings.json`：

```json
{
  "typescript.tsserver.log": "verbose"
}
```

查看日志位置：

- macOS: `~/Library/Application Support/Code/logs/`
- Windows: `%APPDATA%\Code\logs\`

### 方案 C：降低内存限制

如果系统内存不足（< 8GB），修改：

```json
{
  "typescript.tsserver.maxTsServerMemory": 3072
}
```

### 方案 D：清理缓存

```bash
# 删除 node_modules 和重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 清理 TS 缓存（macOS）
rm -rf ~/Library/Caches/typescript
```

---

## 📚 技术细节

### 循环依赖的危害

1. **TypeScript 编译器负担加重**
   - 类型推断需要递归解析
   - 增加编译时间和内存占用

2. **语言服务不稳定**
   - 代码提示可能失效
   - 导致 TS Server 崩溃

3. **运行时风险**
   - 可能导致 `undefined` 引用
   - 模块加载顺序问题

### 为什么使用字符串引用？

TypeORM 支持两种关系定义方式：

```typescript
// 方式 1：函数引用（可能导致循环依赖）
@ManyToMany(() => Role, (role) => role.permissions)

// 方式 2：字符串引用（避免循环依赖）✅
@ManyToMany('Role', 'permissions')
```

字符串引用的优势：

- ✅ 避免在模块顶层导入实体类
- ✅ 延迟解析，运行时才建立关系
- ✅ 减少 TypeScript 类型检查负担

---

## 🛠 后续维护

### 定期检查循环依赖

添加到 `package.json`：

```json
{
  "scripts": {
    "check:circular": "madge --circular --extensions ts src"
  }
}
```

运行：

```bash
pnpm run check:circular
```

### Git Pre-commit Hook

在 `.husky/pre-commit` 中添加：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 检查循环依赖
pnpm run check:circular || exit 1
```

---

## 📈 性能优化建议

### 1. 代码分割

将大文件拆分为小模块（< 300 行/文件）

### 2. 延迟导入

对于大型库，使用动态导入：

```typescript
// ❌ 不推荐
import * as _ from 'lodash'

// ✅ 推荐
const { debounce } = await import('lodash')
```

### 3. 路径别名一致性

统一使用 `@/` 别名：

```typescript
// ✅ 推荐
import { User } from '@/shared/entities/user.entity'

// ❌ 避免
import { User } from '../../../shared/entities/user.entity'
```

---

## 🎉 总结

本次修复主要解决了：

1. ✅ **VS Code 配置优化**（内存限制、缓存策略）
2. ✅ **循环依赖修复**（2 个循环依赖 → 0）
3. ✅ **性能提升**（减少 TS Server 负担）

问题根源：

- 实体类之间的循环导入
- TS Server 内存限制不足
- 过多的文件监控

修复后，TypeScript 语言服务应该稳定运行，不再频繁崩溃。

---

**详细排查指南：** 请查看 `docs/TS_SERVER_CRASH_FIX.md`
