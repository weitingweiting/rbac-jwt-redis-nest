#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 确保 logs 目录存在（项目外部）
const logsDir = path.join(__dirname, '../..', 'logs')

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
  console.log('✅ Created logs directory:', logsDir)
} else {
  console.log('✅ Logs directory already exists:', logsDir)
}
