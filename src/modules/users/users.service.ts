import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/entities/user.entity';
import { BusinessException } from '../../shared/exceptions/business.exception';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new BusinessException(
        `用户 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id); // 这里会抛出 BusinessException 如果用户不存在

    // 检查邮箱是否被其他用户使用
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new BusinessException(
          '邮箱已被其他用户使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.EMAIL_IN_USE
        );
      }
    }

    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findOne(id); // 这里会抛出 BusinessException 如果用户不存在

    // 检查是否是最后一个管理员
    const userRoles = user.roles || [];
    const isAdmin = userRoles.some(role => role.name === 'admin');

    if (isAdmin) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :roleName', { roleName: 'admin' })
        .getCount();

      if (adminCount <= 1) {
        throw new BusinessException(
          '无法删除最后一个管理员账户',
          HttpStatus.FORBIDDEN,
          ERROR_CODES.CANNOT_DELETE_LAST_ADMIN
        );
      }
    }

    await this.userRepository.delete(id);
  }
}