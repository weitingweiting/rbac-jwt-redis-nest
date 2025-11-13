import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { createHash } from 'crypto';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) { }

  /**
   * 使用 SHA-256 哈希密码
   */
  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  async seed() {
    console.log('🌱 Starting seed...');

    // 检查是否已经初始化过
    const existingUser = await this.userRepository.findOne({ where: { username: 'admin' } });
    if (existingUser) {
      console.log('⚠️  Seed data already exists, skipping...');
      return;
    }

    // 1. 创建权限
    console.log('📝 Creating permissions...');
    const readUsers = await this.permissionRepository.save({
      name: 'users:read',
      description: 'Read users',
    });
    const writeUsers = await this.permissionRepository.save({
      name: 'users:write',
      description: 'Write users',
    });
    const deleteUsers = await this.permissionRepository.save({
      name: 'users:delete',
      description: 'Delete users',
    });
    const readProfile = await this.permissionRepository.save({
      name: 'profile:read',
      description: 'Read profile',
    });
    const writeProfile = await this.permissionRepository.save({
      name: 'profile:write',
      description: 'Write profile',
    });
    console.log('✅ Permissions created');

    // 2. 创建角色
    console.log('📝 Creating roles...');
    const adminRole = await this.roleRepository.save({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: [readUsers, writeUsers, deleteUsers, readProfile, writeProfile],
    });
    const editorRole = await this.roleRepository.save({
      name: 'editor',
      description: 'Editor with limited access',
      permissions: [readUsers, writeUsers, readProfile, writeProfile],
    });
    const userRole = await this.roleRepository.save({
      name: 'user',
      description: 'Regular user with basic access',
      permissions: [readProfile],
    });
    console.log('✅ Roles created');

    // 3. 创建用户
    console.log('📝 Creating users...');
    const adminPassword = this.hashPassword('root123456');
    await this.userRepository.save({
      username: 'admin',
      password: adminPassword,
      email: 'admin@example.com',
      roles: [adminRole],
    });

    const editorPassword = this.hashPassword('root123456');
    await this.userRepository.save({
      username: 'editor',
      password: editorPassword,
      email: 'editor@example.com',
      roles: [editorRole],
    });

    const userPassword = this.hashPassword('root123456');
    await this.userRepository.save({
      username: 'john_doe',
      password: userPassword,
      email: 'john@example.com',
      roles: [userRole],
    });
    console.log('✅ Users created');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Default users (all passwords are: root123456):');
    console.log('  👤 Admin:  username: admin    | password: root123456');
    console.log('  👤 Editor: username: editor   | password: root123456');
    console.log('  👤 User:   username: john_doe | password: root123456');
    console.log('\n');
  }
}
