#!/bin/bash
# 峡谷寻城记 - Demo一键启动脚本（本地开发模式）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    print_info "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    print_success "Docker环境检查通过"
}

# 检查Go是否安装
check_go() {
    print_info "检查Go环境..."
    if ! command -v go &> /dev/null; then
        print_error "Go未安装，请先安装Go 1.23+"
        exit 1
    fi
    local go_version=$(go version | awk '{print $3}' | sed 's/go//')
    print_success "Go版本: $go_version"
}

# 检查Node是否安装
check_node() {
    print_info "检查Node.js环境..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装，请先安装Node.js 20+"
        exit 1
    fi
    local node_version=$(node --version)
    print_success "Node.js版本: $node_version"
}

# 显示菜单
show_menu() {
    echo ""
    echo "=========================================="
    echo "     🎮 峡谷寻城记 - Demo 启动菜单"
    echo "=========================================="
    echo ""
    echo "  1) 🚀 启动数据库（MongoDB + Redis）"
    echo "  2) 🔧 启动TTS语音服务（可选）"
    echo "  3) ⏹️  停止所有Docker服务"
    echo "  4) 🔄 重启数据库"
    echo "  5) 📊 查看服务状态"
    echo "  6) 🧹 清理数据（重置数据库）"
    echo "  7) 📋 查看日志"
    echo "  8) ❌ 退出"
    echo ""
    echo "=========================================="
    echo ""
    echo "💡 使用流程："
    echo "   1. 选择 1 启动数据库"
    echo "   2. 新开终端: cd xiagu-server && go run cmd/server/main.go"
    echo "   3. 新开终端: cd xiagu-admin && npm run dev"
    echo ""
    echo "=========================================="
}

# 启动数据库
start_databases() {
    print_info "启动MongoDB和Redis..."
    docker-compose -f docker-compose.demo.yml up -d
    
    print_info "等待数据库就绪..."
    sleep 5
    
    # 检查MongoDB
    until docker exec xiagu-mongodb mongosh --eval "db.adminCommand('ping')" 2>/dev/null; do
        print_info "等待MongoDB..."
        sleep 2
    done
    print_success "MongoDB已就绪"
    
    # 检查Redis
    until docker exec xiagu-redis redis-cli ping 2>/dev/null | grep -q PONG; do
        print_info "等待Redis..."
        sleep 2
    done
    print_success "Redis已就绪"
    
    print_success "数据库启动完成！"
    echo ""
    echo "接下来请："
    echo "  1. 新开终端运行: cd xiagu-server && go run cmd/server/main.go"
    echo "  2. 新开终端运行: cd xiagu-admin && npm run dev"
    echo ""
}

# 启动TTS
start_tts() {
    print_info "启动TTS语音合成服务..."
    docker-compose -f docker-compose.demo.yml --profile with-tts up -d xiagu-tts
    print_success "TTS服务已启动: http://localhost:9880"
}

# 停止服务
stop_services() {
    print_info "停止所有Docker服务..."
    docker-compose -f docker-compose.demo.yml --profile with-tts down
    print_success "服务已停止"
}

# 重启数据库
restart_databases() {
    stop_services
    start_databases
}

# 查看状态
show_status() {
    echo ""
    echo "=========================================="
    echo "     📊 Docker服务状态"
    echo "=========================================="
    echo ""
    docker-compose -f docker-compose.demo.yml ps
    echo ""
}

# 清理数据
cleanup_data() {
    print_warning "这将删除所有数据库数据！"
    read -p "确定要继续吗？(y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        docker-compose -f docker-compose.demo.yml down -v
        print_success "数据已清理"
    else
        print_info "操作已取消"
    fi
}

# 查看日志
show_logs() {
    echo ""
    echo "选择要查看日志的服务："
    echo "  1) MongoDB"
    echo "  2) Redis"
    echo "  3) TTS服务"
    echo "  4) 所有服务"
    echo ""
    read -p "请输入选项 (1-4): " log_choice
    
    case $log_choice in
        1) docker logs -f xiagu-mongodb ;;
        2) docker logs -f xiagu-redis ;;
        3) docker logs -f xiagu-tts ;;
        4) docker-compose -f docker-compose.demo.yml logs -f ;;
        *) print_error "无效选项" ;;
    esac
}

# 主程序
main() {
    check_docker
    check_go
    check_node
    
    while true; do
        show_menu
        read -p "请选择操作 (1-8): " choice
        
        case $choice in
            1) start_databases ;;
            2) start_tts ;;
            3) stop_services ;;
            4) restart_databases ;;
            5) show_status ;;
            6) cleanup_data ;;
            7) show_logs ;;
            8) print_info "再见！"; exit 0 ;;
            *) print_error "无效选项，请重新选择" ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
    done
}

# 如果是直接运行，执行主程序
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi
