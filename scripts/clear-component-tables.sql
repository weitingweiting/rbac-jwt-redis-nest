-- ================================================
-- 清空组件相关表脚本
-- ================================================
-- 根据 docker-compose.yml 配置：
--   数据库: rbac_demo
--   用户: rbac_user
--   密码: rbac_password
--   主机: localhost:3306
-- ================================================

USE rbac_demo;

-- 禁用外键约束（避免级联删除冲突）
SET FOREIGN_KEY_CHECKS = 0;

-- 清空表（按依赖关系反序）
-- 1. 清空研发申请表（依赖 component_versions）
TRUNCATE TABLE development_applications;

-- 2. 清空组件版本表（依赖 components）
TRUNCATE TABLE component_versions;

-- 3. 清空组件表
TRUNCATE TABLE components;

-- 重新启用外键约束
SET FOREIGN_KEY_CHECKS = 1;

-- 验证清空结果
SELECT 
  'components' AS table_name, COUNT(*) AS row_count 
FROM components
UNION ALL
SELECT 
  'component_versions' AS table_name, COUNT(*) AS row_count 
FROM component_versions
UNION ALL
SELECT 
  'development_applications' AS table_name, COUNT(*) AS row_count 
FROM development_applications;
