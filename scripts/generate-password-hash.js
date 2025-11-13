/**
 * 密码哈希生成工具
 * 用于生成 SHA-256 密码哈希，可用于 init.sql
 *
 * 使用方法:
 * node scripts/generate-password-hash.js admin123
 */

const { createHash } = require("crypto");

function generateHash(password) {
  if (!password) {
    console.log("❌ 请提供密码参数");
    console.log("用法: node scripts/generate-password-hash.js <password>");
    console.log("示例: node scripts/generate-password-hash.js admin123");
    process.exit(1);
  }

  try {
    const hash = createHash("sha256").update(password).digest("hex");
    console.log("\n✅ 密码哈希生成成功！\n");
    console.log("原始密码:", password);
    console.log("哈希值:", hash);
    console.log("\n📋 可直接复制到 init.sql 中使用\n");
  } catch (error) {
    console.error("❌ 生成哈希失败:", error.message);
    process.exit(1);
  }
}

// 从命令行参数获取密码
const password = process.argv[2];
generateHash(password);
