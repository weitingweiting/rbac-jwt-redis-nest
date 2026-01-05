-- ============================================
-- 组件分类初始化脚本
-- ============================================
-- 说明：初始化自定义的组件分类数据
-- 执行方式：
--   1. 在 MySQL 客户端执行：source scripts/init-component-categories.sql
--   2. 或复制到 Bruno/API 工具执行
-- ============================================

USE `rbac_demo`;

-- 设置字符集，解决中文乱码
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 清理现有分类数据
TRUNCATE TABLE `component_categories`;

-- ============================================
-- 一级分类（Level 1）
-- ============================================

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
('chart', '图表', 1, NULL, '各类数据可视化图表组件', '📊', 1, 1, NULL, NOW(), NOW()),
('map', '地图', 1, NULL, '地图类可视化组件', '🗺️', 2, 1, NULL, NOW(), NOW()),
('form', '表单', 1, NULL, '表单输入和数据采集组件', '📝', 3, 1, NULL, NOW(), NOW()),
('data', '数据', 1, NULL, '数据展示和处理组件', '💾', 4, 1, NULL, NOW(), NOW()),
('decoration', '装饰', 1, NULL, '装饰和美化组件', '✨', 5, 1, NULL, NOW(), NOW());

-- ============================================
-- 二级分类（Level 2）- 图表
-- ============================================

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'bar', '柱图', 2, id, '柱状图组件', '📊', 1, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'line', '线图', 2, id, '折线图组件', '📈', 2, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'pie', '饼图', 2, id, '饼图组件', '🥧', 3, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'bubble', '气泡图', 2, id, '气泡图组件', '🫧', 4, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'radar', '雷达图', 2, id, '雷达图组件', '🎯', 5, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'battery', '电池图', 2, id, '电池图组件', '🔋', 6, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'gantt', '甘特图', 2, id, '甘特图组件', '📅', 7, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'waterfall', '瀑布图', 2, id, '瀑布图组件', '💧', 8, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'scatter', '散点图', 2, id, '散点图组件', '⚪', 9, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'chart' AND level = 1;

-- ============================================
-- 二级分类（Level 2）- 地图
-- ============================================

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'general', '通用地图', 2, id, '通用地图组件', '🌍', 1, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'map' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'electric', '电力地图', 2, id, '电力专用地图组件', '⚡', 2, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'map' AND level = 1;

-- ============================================
-- 二级分类（Level 2）- 表单
-- ============================================

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'input', '输入框', 2, id, '文本输入框组件', '✏️', 1, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'textarea', '文本框', 2, id, '多行文本框组件', '📄', 2, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'select', '选择器', 2, id, '下拉选择器组件', '🔽', 3, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'datetime', '时间日期', 2, id, '时间日期选择组件', '📅', 4, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'switch', '切换器', 2, id, '开关切换组件', '🔘', 5, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'checkradio', '单选多选', 2, id, '单选框和多选框组件', '☑️', 6, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'form' AND level = 1;

-- ============================================
-- 二级分类（Level 2）- 数据
-- ============================================

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'list', '列表', 2, id, '列表展示组件', '📋', 1, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'data' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'table', '表格', 2, id, '表格展示组件', '📊', 2, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'data' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'timeformat', '时间格式', 2, id, '时间格式化组件', '🕐', 3, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'data' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'tree', '树结构', 2, id, '树形结构组件', '🌲', 4, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'data' AND level = 1;

INSERT INTO `component_categories` (`code`, `name`, `level`, `parent_id`, `description`, `icon`, `sort_order`, `is_active`, `created_by`, `created_at`, `updated_at`)
SELECT 'numberanimate', '数值动画', 2, id, '数值动画组件', '🔢', 5, 1, NULL, NOW(), NOW()
FROM `component_categories` WHERE code = 'data' AND level = 1;

-- ============================================
-- 查询验证
-- ============================================

SELECT '=== 分类统计 ===' AS info;
SELECT 
    level AS 层级,
    COUNT(*) AS 数量
FROM component_categories 
WHERE deleted_at IS NULL
GROUP BY level;

SELECT '=== 一级分类列表 ===' AS info;
SELECT id, code, name, sort_order 
FROM component_categories 
WHERE level = 1 AND deleted_at IS NULL
ORDER BY sort_order;

SELECT '=== 二级分类列表（前10条） ===' AS info;
SELECT c2.id, c2.code, c2.name, c1.name AS parent_name, c2.sort_order
FROM component_categories c2
LEFT JOIN component_categories c1 ON c2.parent_id = c1.id
WHERE c2.level = 2 AND c2.deleted_at IS NULL
ORDER BY c1.sort_order, c2.sort_order
LIMIT 10;
