.PHONY: help up down restart logs ps clean install seed dev build

# 默认目标
help:
	@echo "🎯 RBAC JWT Redis Demo - 可用命令："
	@echo ""
	@echo "  make up          - 启动 MySQL 和 Redis"
	@echo "  make up-tools    - 启动所有服务（包含管理工具）"
	@echo "  make down        - 停止所有服务（包含管理工具）"
	@echo "  make down-basic  - 只停止基础服务（MySQL 和 Redis）"
	@echo "  make create-dirs - 创建必要的数据目录"
	@echo "  make open-adminer - 打开 MySQL 管理工具"
	@echo "  make open-redis  - 打开 Redis 管理工具"
	@echo "  make restart     - 重启所有服务（包含管理工具）"
	@echo "  make restart-basic - 只重启基础服务"
	@echo "  make logs        - 查看所有服务日志"
	@echo "  make logs-mysql  - 查看 MySQL 日志"
	@echo "  make logs-redis  - 查看 Redis 日志"
	@echo "  make logs-tools  - 查看管理工具日志"
	@echo "  make ps          - 查看服务状态"
	@echo "  make clean       - 清理容器和数据（⚠️ 会删除数据）"
	@echo "  make backup      - 备份数据目录"
	@echo "  make install     - 安装 npm 依赖"
	@echo "  make seed        - 初始化数据库种子数据"
	@echo "  make clear-components - 清空组件表（Docker 方式）⚠️"
	@echo "  make dev         - 启动开发服务器（直接运行）"
	@echo "  make build       - 构建生产版本"
	@echo "  make start       - 启动生产服务器（PM2）"
	@echo "  make stop        - 停止生产服务器"
	@echo "  make restart     - 重启生产服务器"
	@echo "  make status      - 查看 PM2 进程状态"
	@echo "  make logs-app    - 查看应用日志"
	@echo "  make health      - 检查服务健康状态"
	@echo "  make backup-db   - 备份数据库"
	@echo "  make restore-db  - 恢复数据库（需要 backup.sql）"
	@echo ""

# 创建必要的数据目录
create-dirs:
	@echo "📁 创建数据目录（项目外部）..."
	@mkdir -p ../docker-data/mysql ../docker-data/redis ../docker-data/redis-insight
	@mkdir -p ../logs
	@echo "✅ 目录创建完成"
	@echo "   📂 docker-data: $$(cd .. && pwd)/docker-data"
	@echo "   📂 logs: $$(cd .. && pwd)/logs"

# 启动服务
up:
	@echo "🚀 启动 MySQL 和 Redis..."
	docker-compose up -d mysql redis

up-tools:
	@echo "🚀 启动所有服务（包含管理工具）..."
	docker-compose --profile tools up -d

# 停止服务
down:
	@echo "🛑 停止所有服务..."
	docker-compose --profile tools down

# 只停止基础服务（MySQL 和 Redis）
down-basic:
	@echo "🛑 停止基础服务（MySQL 和 Redis）..."
	docker-compose down

# 重启服务
restart:
	@echo "🔄 重启所有服务..."
	docker-compose --profile tools restart

# 只重启基础服务
restart-basic:
	@echo "🔄 重启基础服务（MySQL 和 Redis）..."
	docker-compose restart mysql redis

# 查看日志
logs:
	docker-compose --profile tools logs -f

logs-mysql:
	docker-compose logs -f mysql

logs-redis:
	docker-compose logs -f redis

logs-tools:
	docker-compose --profile tools logs -f redis-insight adminer

# 查看状态
ps:
	@echo "📊 服务状态："
	@docker-compose --profile tools ps

# 清理
clean:
	@echo "⚠️  警告：这将删除所有容器和外部数据目录！"
	@read -p "确认继续？(y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose --profile tools down --volumes --remove-orphans
	rm -rf ../docker-data/mysql/* ../docker-data/redis/* ../docker-data/redis-insight/*
	rm -rf ../logs/*
	@echo "✅ 清理完成"

# 备份数据
backup:
	@echo "💾 备份数据目录..."
	@cd .. && tar -czf docker-data-backup-$$(date +%Y%m%d-%H%M%S).tar.gz docker-data/
	@echo "✅ 备份完成：../docker-data-backup-$$(date +%Y%m%d-%H%M%S).tar.gz"

# 安装依赖
install:
	@echo "📦 安装 pnpm 依赖..."
	pnpm install

# 数据库种子数据
seed:
	@echo "🌱 初始化数据库种子数据..."
	npm run seed

# 清空组件表
clear-components:
	@echo "🧹 清空组件相关表（components, component_versions, development_applications）..."
	@bash scripts/clear-component-tables.sh

# 开发环境
dev:
	@echo "🔨 启动开发服务器（直接运行）..."
	pnpm start:dev

# 构建
build:
	@echo "📦 构建生产版本..."
	pnpm build

# 生产环境 - PM2 管理
start:
	@echo "🚀 启动生产服务器（PM2）..."
	@npx pm2 start ecosystem.config.js

stop:
	@echo "🛑 停止生产服务器..."
	@npx pm2 stop rbac-nest-prod

restart:
	@echo "🔄 重启生产服务器..."
	@npx pm2 restart rbac-nest-prod

status:
	@echo "📊 PM2 进程状态："
	@npx pm2 status

logs-app:
	@echo "📋 应用日志："
	@npx pm2 logs rbac-nest-prod --lines 50

delete:
	@echo "🗑️  删除 PM2 进程..."
	@npx pm2 delete rbac-nest-prod

# 健康检查
health:
	@echo "🏥 检查服务健康状态..."
	@echo ""
	@echo "MySQL:"
	@docker exec rbac-demo-mysql mysqladmin ping -h localhost -u root -ppassword && echo "  ✅ MySQL 运行正常" || echo "  ❌ MySQL 连接失败"
	@echo ""
	@echo "Redis:"
	@docker exec rbac-demo-redis redis-cli ping | grep -q PONG && echo "  ✅ Redis 运行正常" || echo "  ❌ Redis 连接失败"

# 备份数据库
backup-db:
	@echo "💾 备份数据库到 backup.sql..."
	docker exec rbac-demo-mysql mysqldump -uroot -ppassword rbac_demo > ../backup.sql
	@echo "✅ 备份完成：../backup.sql"

# 恢复数据库
restore-db:
	@if [ ! -f ../backup.sql ]; then echo "❌ ../backup.sql 文件不存在"; exit 1; fi
	@echo "📥 从 ../backup.sql 恢复数据库..."
	docker exec -i rbac-demo-mysql mysql -uroot -ppassword rbac_demo < ../backup.sql
	@echo "✅ 恢复完成"

# 完整初始化流程
init: create-dirs up install
	@echo "⏳ 等待数据库启动（30秒）..."
	@sleep 30
	@$(MAKE) seed
	@echo ""
	@echo "🎉 初始化完成！"
	@echo ""
	@echo "📝 下一步："
	@echo "  1. 复制 .env.example 为 .env 并配置"
	@echo "  2. 运行 'make dev' 启动开发服务器"
	@echo "  3. 访问 http://localhost:3000/api"
	@echo "  4. MySQL 管理：http://localhost:8080"
	@echo "  5. Redis 管理：http://localhost:8001"
	@echo ""

# 完整清理和重新初始化
reset: clean init

# 打开管理工具
open-adminer:
	@echo "🌐 打开 Adminer (MySQL 管理工具)..."
	@open http://localhost:8080 || xdg-open http://localhost:8080

open-redis:
	@echo "🌐 打开 RedisInsight (Redis 管理工具)..."
	@open http://localhost:8001 || xdg-open http://localhost:8001

# 创建必要的数据目录
create-dirs:
	@echo "📁 创建数据目录..."
	@mkdir -p ../docker-data/mysql ../docker-data/redis ../docker-data/redis-insight
	@echo "✅ 目录创建完成"
