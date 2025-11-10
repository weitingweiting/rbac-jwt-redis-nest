-- ============================================
-- RBAC + JWT + Redis Demo - 数据库初始化脚本
-- ============================================
-- 创建日期: 2025-11-07
-- 说明: 此文件用于手动初始化数据库表结构和种子数据
-- 注意: 如果使用 TypeORM 的 synchronize: true，此文件是可选的
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `rbac_demo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `rbac_demo`;

-- ============================================
-- 1. 删除现有表（重新初始化时使用）
-- ============================================
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;

-- ============================================
-- 2. 创建表结构
-- ============================================

-- 2.1 用户表
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_username` (`username`),
  UNIQUE KEY `IDX_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 角色表
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 权限表
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_name` (`name`)
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

-- ============================================
-- 3. 插入种子数据
-- ============================================

-- 3.1 插入权限
INSERT INTO `permissions` (`name`, `description`) VALUES
('users:read', 'Read users'),
('users:write', 'Write users'),
('users:delete', 'Delete users'),
('profile:read', 'Read profile'),
('profile:write', 'Write profile');

-- 3.2 插入角色
INSERT INTO `roles` (`name`, `description`) VALUES
('admin', 'Administrator with full access'),
('editor', 'Editor with limited access'),
('user', 'Regular user with basic access');

-- 3.3 关联角色和权限
-- admin 角色拥有所有权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'admin';

-- editor 角色拥有部分权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'editor' 
  AND p.name IN ('users:read', 'users:write', 'profile:read', 'profile:write');

-- user 角色只有基础权限
INSERT INTO `role_permissions` (`rolesId`, `permissionsId`) 
SELECT r.id, p.id 
FROM `roles` r, `permissions` p 
WHERE r.name = 'user' 
  AND p.name = 'profile:read';

-- 3.4 插入用户（密码统一为：root123456）
-- 所有用户的密码都是 root123456，方便学习测试
-- 密码已经过 bcrypt 加密（hash 轮数为 10）

-- admin 用户 (username: admin, password: root123456)
INSERT INTO `users` (`username`, `password`, `email`) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@example.com');

-- editor 用户 (username: editor, password: root123456)
INSERT INTO `users` (`username`, `password`, `email`) VALUES
('editor', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'editor@example.com');

-- john_doe 用户 (username: john_doe, password: root123456)
INSERT INTO `users` (`username`, `password`, `email`) VALUES
('john_doe', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'john@example.com');

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

-- john_doe 用户 -> user 角色
INSERT INTO `user_roles` (`usersId`, `rolesId`) 
SELECT u.id, r.id 
FROM `users` u, `roles` r 
WHERE u.username = 'john_doe' AND r.name = 'user';

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
SELECT 'Default users (all passwords are: root123456):' AS info;
SELECT '  👤 Admin:  username: admin    | password: root123456' AS info;
SELECT '  👤 Editor: username: editor   | password: root123456' AS info;
SELECT '  👤 User:   username: john_doe | password: root123456' AS info;
