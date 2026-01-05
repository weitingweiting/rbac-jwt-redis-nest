-- ====================================
-- 组件管理模块权限配置
-- 创建时间: 2026-01-04
-- 说明: 为组件管理模块添加必要的权限，并分配给管理员角色
-- ====================================

USE rbac_demo;

-- 设置字符集，确保中文不乱码
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ====================================
-- 0. 清理旧数据（如果存在）
-- ====================================

-- 先删除角色权限关联
DELETE FROM role_permissions 
WHERE permissionsId IN (
  SELECT id FROM permissions 
  WHERE code IN ('component.read', 'component.create', 'component.update', 'component.delete', 'component.publish')
);

-- 再删除权限记录
DELETE FROM permissions 
WHERE code IN ('component.read', 'component.create', 'component.update', 'component.delete', 'component.publish');

-- ====================================
-- 1. 插入组件管理权限
-- ====================================

INSERT INTO `permissions` (`code`, `name`, `description`, `created_at`, `updated_at`)
VALUES
  ('component.read', '查看组件', '允许查看组件列表和详情', NOW(), NOW()),
  ('component.create', '创建组件', '允许上传和创建新组件', NOW(), NOW()),
  ('component.update', '更新组件', '允许更新组件信息', NOW(), NOW()),
  ('component.delete', '删除组件', '允许删除组件', NOW(), NOW()),
  ('component.publish', '发布组件版本', '允许发布组件的新版本', NOW(), NOW());

-- ====================================
-- 2. 查询新增的权限ID（用于后续关联）
-- ====================================

SELECT 
  id, code, name, description
FROM 
  permissions
WHERE 
  code IN ('component.read', 'component.create', 'component.update', 'component.delete', 'component.publish')
ORDER BY 
  code;

-- ====================================
-- 3. 将组件权限分配给管理员角色
-- ====================================

-- 先查找管理员角色ID（角色名为 'admin'）
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);

-- 如果找到管理员角色，则分配权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @admin_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code IN ('component.read', 'component.create', 'component.update', 'component.delete', 'component.publish')
  AND @admin_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.rolesId = @admin_role_id 
    AND rp.permissionsId = p.id
  );

-- ====================================
-- 4. 验证权限分配结果
-- ====================================

SELECT 
  r.id AS role_id,
  r.name AS role_name,
  p.code AS permission_code,
  p.name AS permission_name,
  p.description AS permission_description
FROM 
  roles r
  INNER JOIN role_permissions rp ON r.id = rp.rolesId
  INNER JOIN permissions p ON rp.permissionsId = p.id
WHERE 
  p.code LIKE 'component.%'
ORDER BY 
  r.name, p.code;

-- ====================================
-- 执行完成提示
-- ====================================

SELECT '✅ 组件管理权限配置完成！' AS status;
