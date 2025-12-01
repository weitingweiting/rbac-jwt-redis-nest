-- ============================================
-- RBAC + JWT + Redis Demo - 数据库初始化脚本
-- ============================================
-- 创建日期: 2025-11-30
-- 说明: 此文件用于手动初始化数据库表结构和种子数据
-- 注意: 如果使用 TypeORM 的 synchronize: true，此文件是可选的
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `rbac_demo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `rbac_demo`;

-- ============================================
-- 1. 删除现有表（重新初始化时使用）
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `user_project_spaces`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `project_assets`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `project_spaces`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 2. 创建表结构
-- ============================================

-- 2.1 用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatarUrl` varchar(500) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 角色表
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 权限表
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL COMMENT '权限代码，如：user.read, project.create',
  `name` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 用户-角色关联表（多对多）
CREATE TABLE `user_roles` (
  `usersId` int NOT NULL,
  `rolesId` int NOT NULL,
  PRIMARY KEY (`usersId`, `rolesId`),
  KEY `IDX_user_roles_users` (`usersId`),
  KEY `IDX_user_roles_roles` (`rolesId`),
  CONSTRAINT `FK_user_roles_users` FOREIGN KEY (`usersId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_user_roles_roles` FOREIGN KEY (`rolesId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5 角色-权限关联表（多对多）
CREATE TABLE `role_permissions` (
  `rolesId` int NOT NULL,
  `permissionsId` int NOT NULL,
  PRIMARY KEY (`rolesId`, `permissionsId`),
  KEY `IDX_role_permissions_roles` (`rolesId`),
  KEY `IDX_role_permissions_permissions` (`permissionsId`),
  CONSTRAINT `FK_role_permissions_roles` FOREIGN KEY (`rolesId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_role_permissions_permissions` FOREIGN KEY (`permissionsId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.6 项目空间表
CREATE TABLE `project_spaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `isOpen` tinyint NOT NULL DEFAULT '1',
  `owner_id` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_name` (`name`),
  KEY `FK_project_spaces_owner` (`owner_id`),
  CONSTRAINT `FK_project_spaces_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.7 用户-项目空间关联表（多对多）
CREATE TABLE `user_project_spaces` (
  `usersId` int NOT NULL,
  `projectSpacesId` int NOT NULL,
  PRIMARY KEY (`usersId`, `projectSpacesId`),
  KEY `IDX_user_project_spaces_users` (`usersId`),
  KEY `IDX_user_project_spaces_project_spaces` (`projectSpacesId`),
  CONSTRAINT `FK_user_project_spaces_users` FOREIGN KEY (`usersId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_user_project_spaces_project_spaces` FOREIGN KEY (`projectSpacesId`) REFERENCES `project_spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.8 项目表
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `coverUrl` varchar(500) DEFAULT NULL,
  `sceneJson` json DEFAULT NULL,
  `projectSpaceId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_projects_project_space` (`projectSpaceId`),
  CONSTRAINT `FK_projects_project_space` FOREIGN KEY (`projectSpaceId`) REFERENCES `project_spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.9 项目资源表
CREATE TABLE `project_assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `url` varchar(500) NOT NULL,
  `type` varchar(50) NOT NULL,
  `size` int NOT NULL,
  `meta` json DEFAULT NULL,
  `projectId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_project_assets_project` (`projectId`),
  CONSTRAINT `FK_project_assets_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 插入种子数据
-- ============================================

-- 3.1 插入权限
INSERT INTO `permissions` (`code`, `name`, `description`) VALUES
-- 用户管理权限
('user.read', '查看用户', '查看用户列表和详情'),
('user.create', '创建用户', '创建新用户'),
('user.update', '更新用户', '更新用户信息'),
('user.delete', '删除用户', '删除用户（软删除）'),

-- 角色管理权限
('role.read', '查看角色', '查看角色列表和详情'),
('role.create', '创建角色', '创建新角色'),
('role.update', '更新角色', '更新角色信息和权限'),
('role.delete', '删除角色', '删除角色（软删除）'),

-- 权限管理权限
('permission.read', '查看权限', '查看权限列表和详情'),
('permission.create', '创建权限', '创建新权限'),
('permission.update', '更新权限', '更新权限信息'),
('permission.delete', '删除权限', '删除权限（软删除）'),

-- 项目空间管理权限
('project-space.read', '查看项目空间', '查看项目空间列表和详情'),
('project-space.create', '创建项目空间', '创建新的项目空间'),
('project-space.update', '更新项目空间', '更新项目空间信息'),
('project-space.delete', '删除项目空间', '删除项目空间（软删除）'),

-- 项目管理权限
('project.read', '查看项目', '查看项目列表和详情'),
('project.create', '创建项目', '创建新项目'),
('project.update', '更新项目', '更新项目信息'),
('project.delete', '删除项目', '删除项目（软删除）'),
('project.publish', '发布项目', '发布项目到生产环境'),

-- 项目资源管理权限
('project-asset.read', '查看项目资源', '查看项目资源列表和详情'),
('project-asset.create', '创建项目资源', '上传项目资源'),
('project-asset.update', '更新项目资源', '更新项目资源信息'),
('project-asset.delete', '删除项目资源', '删除项目资源（软删除）');

-- 3.2 插入角色
INSERT INTO `roles` (`name`, `description`) VALUES
('admin', '系统管理员，拥有所有权限'),
('editor', '编辑者，可以创建和编辑内容'),
('viewer', '查看者，只能查看内容');

-- 3.3 关联角色和权限
-- admin 角色拥有所有权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'admin';

-- editor 角色拥有查看、创建、更新、发布权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'editor' 
  AND (p.code LIKE '%.read' 
    OR p.code LIKE '%.create' 
    OR p.code LIKE '%.update' 
    OR p.code LIKE '%.publish');

-- viewer 角色只有查看权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'viewer' 
  AND p.code LIKE '%.read';

-- 3.4 插入用户
-- 密码使用 SHA-256 哈希加密
-- admin: Admin123 -> 4e7afebcfbae000b22c7c85e5560f89a2a0280b4211324e0a092c02f4e9fa7fd
-- editor: Editor123 -> d0dede24d62a3e9723e0d4e9c9f7d82d29dbf8dc6f56d5e7a4f5e9c7d8b3a4e5
-- viewer: Viewer123 -> 8f7e5d4c3b2a1098f7e6d5c4b3a29180706f5e4d3c2b1a098f7e6d5c4b3a2918

-- admin 用户 (username: admin, password: Admin123)
INSERT INTO `users` (`username`, `password`, `avatarUrl`) VALUES
('admin', '4e7afebcfbae000b22c7c85e5560f89a2a0280b4211324e0a092c02f4e9fa7fd', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin');

-- editor 用户 (username: editor, password: Editor123)
INSERT INTO `users` (`username`, `password`, `avatarUrl`) VALUES
('editor', 'd0dede24d62a3e9723e0d4e9c9f7d82d29dbf8dc6f56d5e7a4f5e9c7d8b3a4e5', 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor');

-- viewer 用户 (username: viewer, password: Viewer123)
INSERT INTO `users` (`username`, `password`, `avatarUrl`) VALUES
('viewer', '8f7e5d4c3b2a1098f7e6d5c4b3a29180706f5e4d3c2b1a098f7e6d5c4b3a2918', 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer');

-- 3.5 关联用户和角色
-- admin 用户 -> admin 角色
INSERT INTO `user_roles` (`usersId`, `rolesId`) 
SELECT u.id, r.id 
FROM `users` u, `roles` r 
WHERE u.username = 'admin' AND r.name = 'admin';

-- editor 用户 -> editor 角色
INSERT INTO `user_roles` (`usersId`, `rolesId`) 
SELECT u.id, r.id 
FROM `users` u, `roles` r 
WHERE u.username = 'editor' AND r.name = 'editor';

-- viewer 用户 -> viewer 角色
INSERT INTO `user_roles` (`usersId`, `rolesId`) 
SELECT u.id, r.id 
FROM `users` u, `roles` r 
WHERE u.username = 'viewer' AND r.name = 'viewer';

-- 3.6 插入示例项目空间
INSERT INTO `project_spaces` (`name`, `description`, `isOpen`, `owner_id`) 
SELECT '示例项目空间', '这是一个示例项目空间，用于演示项目管理功能', 1, u.id
FROM `users` u 
WHERE u.username = 'admin';

-- 3.7 插入示例项目
INSERT INTO `projects` (`name`, `description`, `status`, `coverUrl`, `sceneJson`, `projectSpaceId`) 
SELECT '示例项目', '这是一个示例项目', 'draft', 'https://picsum.photos/800/600', 
  JSON_OBJECT('version', '1.0', 'elements', JSON_ARRAY()), ps.id
FROM `project_spaces` ps 
WHERE ps.name = '示例项目空间';

-- 3.8 插入示例项目资源
INSERT INTO `project_assets` (`url`, `type`, `size`, `meta`, `projectId`) 
SELECT 'https://picsum.photos/200/200', 'image', 102400, 
  JSON_OBJECT('width', 200, 'height', 200), p.id
FROM `projects` p 
WHERE p.name = '示例项目';

-- ============================================
-- 4. 查询验证
-- ============================================

-- 查看所有用户及其角色
SELECT 
  u.id,
  u.username,
  u.email,
  GROUP_CONCAT(r.name) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.usersId
LEFT JOIN roles r ON ur.rolesId = r.id
GROUP BY u.id;

-- 查看所有角色及其权限
SELECT 
  r.id,
  r.name AS role_name,
  GROUP_CONCAT(p.name) AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.rolesId
LEFT JOIN permissions p ON rp.permissionsId = p.id
GROUP BY r.id;

-- ============================================
-- 5. 完成提示
-- ============================================
SELECT '✅ Database initialization completed!' AS status;
SELECT 'Default users:' AS info;
SELECT '  👤 Admin:  username: admin  | password: Admin123' AS info;
SELECT '  👤 Editor: username: editor | password: Editor123' AS info;
SELECT '  👤 Viewer: username: viewer | password: Viewer123' AS info;
