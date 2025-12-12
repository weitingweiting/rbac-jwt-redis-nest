#!/bin/bash

# NestJS 进程监控脚本
# 用于监控 NestJS 服务的运行状态

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/monitor.log"
PID_FILE="$PROJECT_DIR/.nest-pid"

# 确保日志目录存在
mkdir -p "$PROJECT_DIR/logs"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$LOG_FILE"
}

# 检查服务是否运行
check_service() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# 获取进程信息
get_process_info() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p $pid > /dev/null 2>&1; then
            local cpu=$(ps -p $pid -o %cpu= 2>/dev/null | tr -d ' ')
            local mem=$(ps -p $pid -o %mem= 2>/dev/null | tr -d ' ')
            local rss=$(ps -p $pid -o rss= 2>/dev/null | awk '{print $1/1024}')
            echo "PID: $pid | CPU: ${cpu}% | MEM: ${mem}% | RSS: ${rss}MB"
        else
            echo "进程未运行"
        fi
    else
        echo "PID 文件不存在"
    fi
}

# 主监控循环
monitor() {
    log "开始监控 NestJS 服务..."
    
    while true; do
        if check_service; then
            log "✓ 服务运行正常 - $(get_process_info)"
        else
            error "✗ 服务无响应或已停止"
            warn "尝试获取进程状态..."
            get_process_info
        fi
        
        # 每 30 秒检查一次
        sleep 30
    done
}

# 启动监控
case "${1:-monitor}" in
    monitor)
        monitor
        ;;
    check)
        if check_service; then
            log "服务运行正常"
            get_process_info
            exit 0
        else
            error "服务无响应"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {monitor|check}"
        exit 1
        ;;
esac
