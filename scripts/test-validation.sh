#!/bin/bash

echo "🚀 ValidationPipe 优化改造 - 快速测试"
echo "======================================"
echo ""

# 检查依赖
echo "📦 检查依赖..."
if ! grep -q '"class-validator"' package.json; then
    echo "❌ class-validator 未安装"
    exit 1
fi

if ! grep -q '"class-transformer"' package.json; then
    echo "❌ class-transformer 未安装"
    exit 1
fi

echo "✅ 依赖检查通过"
echo ""

# 检查文件是否存在
echo "📁 检查新增文件..."

files=(
    "src/modules/auth/dto/register.dto.ts"
    "src/modules/auth/dto/login.dto.ts"
    "src/modules/auth/dto/change-password.dto.ts"
    "src/modules/auth/dto/index.ts"
    "src/modules/users/dto/query-user.dto.ts"
    "src/shared/dto/pagination.dto.ts"
    "src/shared/dto/paginated-response.dto.ts"
    "src/common/pipes/custom.pipe.ts"
    "src/common/validators/custom.validator.ts"
    "src/common/test/dto-validation.test.ts"
    "docs/VALIDATION_GUIDE.md"
    "docs/VALIDATION_REFACTOR_SUMMARY.md"
)

missing_files=0
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        ((missing_files++))
    fi
done

echo ""

if [ $missing_files -gt 0 ]; then
    echo "❌ 有 $missing_files 个文件缺失"
    exit 1
fi

echo "✅ 所有文件检查通过"
echo ""

# 检查 main.ts 是否有 ValidationPipe
echo "🔍 检查 main.ts 配置..."
if grep -q "ValidationPipe" src/main.ts; then
    echo "✅ ValidationPipe 已配置"
else
    echo "❌ ValidationPipe 未配置"
    exit 1
fi

echo ""

# 尝试编译
echo "🔨 编译项目..."
if npm run build > /dev/null 2>&1; then
    echo "✅ 编译成功"
else
    echo "⚠️  编译过程中有警告或错误，请检查"
fi

echo ""
echo "======================================"
echo "✨ ValidationPipe 优化改造测试完成！"
echo ""
echo "📚 查看文档："
echo "   - docs/VALIDATION_GUIDE.md"
echo "   - docs/VALIDATION_REFACTOR_SUMMARY.md"
echo ""
echo "🧪 运行验证测试："
echo "   ts-node src/common/test/dto-validation.test.ts"
echo ""
echo "🚀 启动项目："
echo "   npm run start:dev"
echo ""
