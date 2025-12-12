/**
 * PM2 生产环境配置
 * 用于生产环境部署和进程管理
 */
module.exports = {
  apps: [
    {
      name: 'rbac-nest-prod',
      script: './dist/main.js',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      // 自动重启配置
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // 内存限制
      max_memory_restart: '500M',

      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,

      // 生产环境配置
      exec_mode: 'cluster', // 集群模式
      instances: 'max', // 使用所有 CPU 核心
      kill_timeout: 5000,
      listen_timeout: 10000,

      // 优雅退出
      wait_ready: true,
      shutdown_with_message: true
    }
  ]
}
