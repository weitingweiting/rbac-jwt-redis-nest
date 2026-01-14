#!/bin/bash

# ================================================
# 清空组件相关表的便捷脚本
# ================================================
# 使用方法：
#   bash scripts/clear-component-tables.sh
# ================================================

set -e

# Docker 配置（对应 docker-compose.yml）
CONTAINER_NAME="rbac-demo-mysql"
MYSQL_USER="rbac_user"
MYSQL_PASSWORD="rbac_password"
MYSQL_DATABASE="rbac_demo"
SCRIPT_PATH="./scripts/clear-component-tables.sql"

echo "=========================================="
echo "清空组件相关表"
echo "=========================================="
echo "容器名: $CONTAINER_NAME"
echo "数据库: $MYSQL_DATABASE"
echo "用户: $MYSQL_USER"
echo ""

# 检查脚本文件是否存在
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ 错误：找不到清空脚本文件 $SCRIPT_PATH"
    exit 1
fi

# 检查 Docker 容器是否在运行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ 错误：MySQL 容器 '$CONTAINER_NAME' 未运行"
    echo ""
    echo "请先启动 MySQL 容器："
    echo "  make up"
    exit 1
fi

# 通过 Docker 容器执行 SQL 脚本
echo "⏳ 正在执行清空脚本..."
docker exec -i "$CONTAINER_NAME" mysql \
    --user="$MYSQL_USER" \
    --password="$MYSQL_PASSWORD" \
    "$MYSQL_DATABASE" < "$SCRIPT_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 清空完成！"
    echo ""
else
    echo ""
    echo "❌ 清空失败！"
    exit 1
fi

