#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// 确保 logs 目录存在
const logsDir = path.join(__dirname, "..", "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log("✅ Created logs directory");
} else {
  console.log("✅ Logs directory already exists");
}
