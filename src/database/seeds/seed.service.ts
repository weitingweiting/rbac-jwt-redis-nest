import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../shared/entities/user.entity'
import { Role } from '../../shared/entities/role.entity'
import { Permission } from '../../shared/entities/permission.entity'
import { ProjectSpace } from '../../shared/entities/project-space.entity'
import { Project } from '../../shared/entities/project.entity'
import { ProjectAsset } from '../../shared/entities/project-asset.entity'
import { PasswordUtil } from '../../common/utils/password.util'

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(ProjectSpace)
    private projectSpaceRepository: Repository<ProjectSpace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectAsset)
    private projectAssetRepository: Repository<ProjectAsset>
  ) {}

  async seed() {
    console.log('🌱 Starting seed...')

    // 清理所有现有数据 - 按照依赖关系顺序删除
    console.log('🧹 Cleaning existing data...')

    // 先删除子表
    const assetCount = await this.projectAssetRepository.count()
    if (assetCount > 0) {
      await this.projectAssetRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    const projectCount = await this.projectRepository.count()
    if (projectCount > 0) {
      await this.projectRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    const spaceCount = await this.projectSpaceRepository.count()
    if (spaceCount > 0) {
      await this.projectSpaceRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    // 删除用户和角色关联
    const userCount = await this.userRepository.count()
    if (userCount > 0) {
      await this.userRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    const roleCount = await this.roleRepository.count()
    if (roleCount > 0) {
      await this.roleRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    const permissionCount = await this.permissionRepository.count()
    if (permissionCount > 0) {
      await this.permissionRepository.createQueryBuilder().delete().where('1=1').execute()
    }

    console.log('✅ Cleaned all existing data')

    // 1. 创建权限
    console.log('📝 Creating permissions...')
    const permissions = await this.createPermissions()
    console.log(`✅ Created ${permissions.length} permissions`)

    // 2. 创建角色
    console.log('📝 Creating roles...')
    const { adminRole, editorRole, viewerRole } = await this.createRoles(permissions)
    console.log('✅ Created admin, editor, viewer roles')

    // 3. 创建用户
    console.log('📝 Creating users...')
    const { admin } = await this.createUsers(adminRole, editorRole, viewerRole)
    console.log('✅ Created admin, editor, viewer users')

    // 4. 创建项目空间和项目（示例数据）
    console.log('📝 Creating sample project data...')
    await this.createProjectsData(admin)
    console.log('✅ Created sample project spaces and projects')

    console.log('\n🎉 Seed completed successfully!\n')
    console.log('Default users:')
    console.log('  👤 Admin:  username: admin  | password: Admin123')
    console.log('  👤 Editor: username: editor | password: Editor123')
    console.log('  👤 Viewer: username: viewer | password: Viewer123')
    console.log('\n')
  }

  /**
   * 创建权限
   */
  private async createPermissions(): Promise<Permission[]> {
    const permissionsData = [
      // 用户管理权限
      { code: 'user.read', name: '查看用户', description: '查看用户列表和详情' },
      { code: 'user.create', name: '创建用户', description: '创建新用户' },
      { code: 'user.update', name: '更新用户', description: '更新用户信息' },
      { code: 'user.delete', name: '删除用户', description: '删除用户（软删除）' },

      // 角色管理权限
      { code: 'role.read', name: '查看角色', description: '查看角色列表和详情' },
      { code: 'role.create', name: '创建角色', description: '创建新角色' },
      { code: 'role.update', name: '更新角色', description: '更新角色信息和权限' },
      { code: 'role.delete', name: '删除角色', description: '删除角色（软删除）' },

      // 权限管理权限
      { code: 'permission.read', name: '查看权限', description: '查看权限列表和详情' },
      { code: 'permission.create', name: '创建权限', description: '创建新权限' },
      { code: 'permission.update', name: '更新权限', description: '更新权限信息' },
      { code: 'permission.delete', name: '删除权限', description: '删除权限（软删除）' },

      // 项目空间管理权限
      {
        code: 'project-space.read',
        name: '查看项目空间',
        description: '查看项目空间列表和详情'
      },
      { code: 'project-space.create', name: '创建项目空间', description: '创建新的项目空间' },
      { code: 'project-space.update', name: '更新项目空间', description: '更新项目空间信息' },
      {
        code: 'project-space.delete',
        name: '删除项目空间',
        description: '删除项目空间（软删除）'
      },

      // 项目管理权限
      { code: 'project.read', name: '查看项目', description: '查看项目列表和详情' },
      { code: 'project.create', name: '创建项目', description: '创建新项目' },
      { code: 'project.update', name: '更新项目', description: '更新项目信息' },
      { code: 'project.delete', name: '删除项目', description: '删除项目（软删除）' },
      { code: 'project.publish', name: '发布项目', description: '发布项目到生产环境' },

      // 项目资源管理权限
      { code: 'project-asset.read', name: '查看项目资源', description: '查看项目资源列表和详情' },
      { code: 'project-asset.create', name: '创建项目资源', description: '上传项目资源' },
      { code: 'project-asset.update', name: '更新项目资源', description: '更新项目资源信息' },
      {
        code: 'project-asset.delete',
        name: '删除项目资源',
        description: '删除项目资源（软删除）'
      }
    ]

    const permissions: Permission[] = []
    for (const data of permissionsData) {
      const permission = this.permissionRepository.create(data)
      await this.permissionRepository.save(permission)
      permissions.push(permission)
    }

    return permissions
  }

  /**
   * 创建角色
   */
  private async createRoles(
    permissions: Permission[]
  ): Promise<{ adminRole: Role; editorRole: Role; viewerRole: Role }> {
    // 管理员角色 - 拥有所有权限
    const adminRole = this.roleRepository.create({
      name: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions
    })
    await this.roleRepository.save(adminRole)

    // 编辑者角色 - 拥有查看、创建、更新权限（不能删除用户、角色、权限）
    const editorPermissions = permissions.filter(
      (p) =>
        p.code.includes('.read') ||
        p.code.includes('.create') ||
        p.code.includes('.update') ||
        p.code.includes('.publish')
    )
    const editorRole = this.roleRepository.create({
      name: 'editor',
      description: '编辑者，可以创建和编辑内容',
      permissions: editorPermissions
    })
    await this.roleRepository.save(editorRole)

    // 查看者角色 - 只有查看权限
    const viewerPermissions = permissions.filter((p) => p.code.includes('.read'))
    const viewerRole = this.roleRepository.create({
      name: 'viewer',
      description: '查看者，只能查看内容',
      permissions: viewerPermissions
    })
    await this.roleRepository.save(viewerRole)

    return { adminRole, editorRole, viewerRole }
  }

  /**
   * 创建用户
   */
  private async createUsers(
    adminRole: Role,
    editorRole: Role,
    viewerRole: Role
  ): Promise<{ admin: User; editor: User; viewer: User }> {
    const admin = this.userRepository.create({
      username: 'admin',
      password: PasswordUtil.hashPassword('Admin123'),
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      roles: [adminRole]
    })
    await this.userRepository.save(admin)

    const editor = this.userRepository.create({
      username: 'editor',
      password: PasswordUtil.hashPassword('Editor123'),
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
      roles: [editorRole]
    })
    await this.userRepository.save(editor)

    const viewer = this.userRepository.create({
      username: 'viewer',
      password: PasswordUtil.hashPassword('Viewer123'),
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
      roles: [viewerRole]
    })
    await this.userRepository.save(viewer)

    return { admin, editor, viewer }
  }

  /**
   * 创建项目空间和项目示例数据
   */
  private async createProjectsData(owner: User): Promise<void> {
    const space = this.projectSpaceRepository.create({
      name: '示例项目空间',
      description: '这是一个示例项目空间，用于演示项目管理功能',
      isOpen: true,
      owner
    })
    await this.projectSpaceRepository.save(space)

    const project = this.projectRepository.create({
      name: '示例项目',
      description: '这是一个示例项目',
      status: 'draft',
      coverUrl: 'https://picsum.photos/800/600',
      sceneJson: {
        version: '1.0',
        elements: []
      },
      projectSpace: space
    })
    await this.projectRepository.save(project)

    const asset = this.projectAssetRepository.create({
      url: 'https://picsum.photos/200/200',
      type: 'image',
      size: 102400,
      meta: {
        width: 200,
        height: 200
      },
      project
    })
    await this.projectAssetRepository.save(asset)
  }
}
