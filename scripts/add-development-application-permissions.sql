-- ====================================
-- 组件研发申请模块权限配置
-- 创建时间: 2026-01-07
-- 说明: 为组件研发申请模块添加必要的权限，并分配给相应角色
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
  WHERE code IN (
    'development:application:create',
    'development:application:read',
    'development:application:update',
    'development:application:review',
    'development:application:self-approve'
  )
);

-- 再删除权限记录
DELETE FROM permissions 
WHERE code IN (
  'development:application:create',
  'development:application:read',
  'development:application:update',
  'development:application:review',
  'development:application:self-approve'
);

-- ====================================
-- 1. 插入组件研发申请权限
-- ====================================

INSERT INTO `permissions` (`code`, `name`, `description`, `created_at`, `updated_at`)
VALUES
  ('development:application:create', '创建研发申请', '允许创建组件研发申请（新组件/版本迭代/替换版本）', NOW(), NOW()),
  ('development:application:read', '查看研发申请', '允许查看研发申请列表和详情', NOW(), NOW()),
  ('development:application:update', '管理研发申请', '允许编辑、提交、取消研发申请，管理上传文件', NOW(), NOW()),
  ('development:application:review', '审核研发申请', '允许审核他人的研发申请（通过/驳回）', NOW(), NOW()),
  ('development:application:self-approve', '管理员自助审批', '允许管理员审批自己提交的研发申请', NOW(), NOW());

-- ====================================
-- 2. 查询新增的权限ID（用于后续关联）
-- ====================================

SELECT 
  id, code, name, description
FROM 
  permissions
WHERE 
  code LIKE 'development:application:%'
ORDER BY 
  code;

-- ====================================
-- 3. 将权限分配给不同角色
-- ====================================

-- 查找角色ID
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);
SET @developer_role_id = (SELECT id FROM roles WHERE name = 'developer' LIMIT 1);
SET @reviewer_role_id = (SELECT id FROM roles WHERE name = 'reviewer' LIMIT 1);

-- 3.1 为管理员分配所有权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @admin_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code LIKE 'development:application:%'
  AND @admin_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.rolesId = @admin_role_id 
    AND rp.permissionsId = p.id
  );

-- 3.2 为开发者分配基础权限（创建、查看、管理自己的申请）
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @developer_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code IN (
    'development:application:create',
    'development:application:read',
    'development:application:update'
  )
  AND @developer_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.rolesId = @developer_role_id 
    AND rp.permissionsId = p.id
  );

-- 3.3 为审核员分配审核权限（查看、审核）
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @reviewer_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code IN (
    'development:application:read',
    'development:application:review'
  )
  AND @reviewer_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp.rolesId = @reviewer_role_id 
    AND rp.permissionsId = p.id
  );

-- ====================================
-- 4. 创建角色（如果不存在）
-- ====================================

-- 如果角色不存在，创建它们
INSERT IGNORE INTO `roles` (`name`, `description`, `created_at`, `updated_at`)
VALUES
  ('developer', '开发者', '组件开发人员，可以创建和管理研发申请', NOW(), NOW()),
  ('reviewer', '审核员', '研发申请审核人员，可以审核他人提交的申请', NOW(), NOW());

-- 重新获取角色ID（处理新创建的角色）
SET @developer_role_id = (SELECT id FROM roles WHERE name = 'developer' LIMIT 1);
SET @reviewer_role_id = (SELECT id FROM roles WHERE name = 'reviewer' LIMIT 1);

-- 为新创建的角色分配权限
INSERT IGNORE INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @developer_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code IN (
    'development:application:create',
    'development:application:read',
    'development:application:update'
  )
  AND @developer_role_id IS NOT NULL;

INSERT IGNORE INTO `role_permissions` (`rolesId`, `permissionsId`)
SELECT 
  @reviewer_role_id,
  p.id
FROM 
  permissions p
WHERE 
  p.code IN (
    'development:application:read',
    'development:application:review'
  )
  AND @reviewer_role_id IS NOT NULL;

-- ====================================
-- 5. 验证权限分配结果
-- ====================================

SELECT 
  '=== 组件研发申请权限分配结果 ===' AS section;

SELECT 
  r.id AS role_id,
  r.name AS role_name,
  r.description AS role_description,
  COUNT(p.id) AS permission_count
FROM 
  roles r
  LEFT JOIN role_permissions rp ON r.id = rp.rolesId
  LEFT JOIN permissions p ON rp.permissionsId = p.id AND p.code LIKE 'development:application:%'
WHERE 
  r.name IN ('admin', 'developer', 'reviewer')
GROUP BY 
  r.id, r.name, r.description
ORDER BY 
  r.name;

SELECT 
  '=== 详细权限映射 ===' AS section;

SELECT 
  r.name AS role_name,
  p.code AS permission_code,
  p.name AS permission_name,
  p.description AS permission_description
FROM 
  roles r
  INNER JOIN role_permissions rp ON r.id = rp.rolesId
  INNER JOIN permissions p ON rp.permissionsId = p.id
WHERE 
  p.code LIKE 'development:application:%'
ORDER BY 
  r.name, p.code;

-- ====================================
-- 6. 权限使用说明
-- ====================================

SELECT 
  '=== 权限使用说明 ===' AS section;

SELECT 
  'development:application:create' AS permission_code,
  '创建申请页面、创建申请接口' AS usage,
  'developer, admin' AS roles;

SELECT 
  'development:application:read' AS permission_code,
  '申请列表、申请详情、导出元数据接口' AS usage,
  'developer, reviewer, admin' AS roles;

SELECT 
  'development:application:update' AS permission_code,
  '编辑申请、上传管理、提交审核、取消申请接口' AS usage,
  'developer, admin' AS roles;

SELECT 
  'development:application:review' AS permission_code,
  '审核管理页面、审核他人申请接口' AS usage,
  'reviewer, admin' AS roles;

SELECT 
  'development:application:self-approve' AS permission_code,
  '管理员自助审批自己的申请接口' AS usage,
  'admin' AS roles;

-- ====================================
-- 执行完成提示
-- ====================================

SELECT '✅ 组件研发申请权限配置完成！' AS status;
SELECT '📝 建议：为现有用户分配合适的角色以获得相应权限' AS tip;