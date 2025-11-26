#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}   NestJS 项目构建开始${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# 显示构建时间
START_TIME=$(date +%s)
echo -e "${YELLOW}📅 开始时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# 清理旧的构建目录
echo -e "${YELLOW}🧹 清理旧的构建文件...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✅ 已删除 dist 目录${NC}"
else
    echo -e "${BLUE}ℹ️  dist 目录不存在，跳过清理${NC}"
fi
echo ""

# 显示 Node 和 npm 版本
echo -e "${YELLOW}🔍 环境信息:${NC}"
echo -e "   Node 版本: $(node -v)"
echo -e "   npm 版本: $(npm -v)"
echo -e "   pnpm 版本: $(pnpm -v)"
echo ""

# 运行 TypeScript 编译
echo -e "${YELLOW}🔨 开始 TypeScript 编译...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}使用 NestJS CLI 构建...${NC}"
nest build
# echo -e "${BLUE}使用 TypeScript 编译器检查...${NC}"
# tsc --noEmit --listFiles

# 检查构建是否成功
if [ $? -eq 0 ]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 构建成功！${NC}"
    echo ""
    
    # 显示构建产物信息
    echo -e "${YELLOW}📦 构建产物信息:${NC}"
    if [ -d "dist" ]; then
        echo -e "   输出目录: dist/"
        echo -e "   文件数量: $(find dist -type f | wc -l | xargs)"
        echo -e "   总大小: $(du -sh dist | cut -f1)"
        echo ""
        echo -e "${YELLOW}📂 主要文件:${NC}"
        ls -lh dist/*.js 2>/dev/null | awk '{print "   " $9 " - " $5}'
    fi
    
    echo ""
    echo -e "${YELLOW}⏱️  构建耗时: ${DURATION}秒${NC}"
    echo -e "${YELLOW}📅 完成时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    echo -e "${BLUE}=================================${NC}"
    echo -e "${GREEN}   构建完成！可以运行了！${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "   运行生产模式: ${GREEN}pnpm run start:prod${NC}"
    echo -e "   运行开发模式: ${GREEN}pnpm run start:dev${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ 构建失败！${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示: 请检查上面的错误信息${NC}"
    echo ""
    exit 1
fi
