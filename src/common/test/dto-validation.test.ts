import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { LoginDto } from '../../modules/auth/dto/login.dto';
import { ChangePasswordDto } from '../../modules/auth/dto/change-password.dto';
import { CreateUserDto } from '../../modules/users/dto/user.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';

/**
 * DTO 验证测试示例
 * 运行：ts-node src/common/test/dto-validation.test.ts
 */

async function testRegisterDto() {
  console.log('\n🧪 测试 RegisterDto 验证...\n');

  // 测试用例1：有效数据
  const validData = {
    username: 'testUser123',
    password: 'Test@123456',
    email: 'test@example.com',
  };

  const dto1 = plainToClass(RegisterDto, validData);
  const errors1 = await validate(dto1 as object);
  console.log('✅ 有效数据测试:', errors1.length === 0 ? '通过' : '失败');

  // 测试用例2：用户名太短
  const invalidUsername = {
    username: 'ab',
    password: 'Test@123456',
    email: 'test@example.com',
  };

  const dto2 = plainToClass(RegisterDto, invalidUsername);
  const errors2 = await validate(dto2 as object);
  console.log('❌ 用户名太短测试:', errors2.length > 0 ? '通过' : '失败');
  if (errors2.length > 0 && errors2[0]) {
    console.log('　　 错误信息:', Object.values(errors2[0].constraints || {}));
  }

  // 测试用例3：密码不符合要求
  const invalidPassword = {
    username: 'testUser123',
    password: 'weak',
    email: 'test@example.com',
  };

  const dto3 = plainToClass(RegisterDto, invalidPassword);
  const errors3 = await validate(dto3 as object);
  console.log('❌ 弱密码测试:', errors3.length > 0 ? '通过' : '失败');
  if (errors3.length > 0) {
    errors3.forEach(error => {
      console.log('   错误信息:', Object.values(error.constraints || {}));
    });
  }

  // 测试用例4：邮箱格式错误
  const invalidEmail = {
    username: 'testUser123',
    password: 'Test@123456',
    email: 'invalid-email',
  };

  const dto4 = plainToClass(RegisterDto, invalidEmail);
  const errors4 = await validate(dto4 as object);
  console.log('❌ 邮箱格式错误测试:', errors4.length > 0 ? '通过' : '失败');
  if (errors4.length > 0 && errors4[0]) {
    console.log('　　 错误信息:', Object.values(errors4[0].constraints || {}));
  }
}

async function testChangePasswordDto() {
  console.log('\n🧪 测试 ChangePasswordDto 验证...\n');

  // 测试用例1：密码匹配
  const validData = {
    oldPassword: 'OldPass@123',
    newPassword: 'NewPass@123',
    confirmPassword: 'NewPass@123',
  };

  const dto1 = plainToClass(ChangePasswordDto, validData);
  const errors1 = await validate(dto1 as object);
  console.log('✅ 密码匹配测试:', errors1.length === 0 ? '通过' : '失败');

  // 测试用例2：密码不匹配
  const mismatchPassword = {
    oldPassword: 'OldPass@123',
    newPassword: 'NewPass@123',
    confirmPassword: 'Different@123',
  };

  const dto2 = plainToClass(ChangePasswordDto, mismatchPassword);
  const errors2 = await validate(dto2 as object);
  console.log('❌ 密码不匹配测试:', errors2.length > 0 ? '通过' : '失败');
  if (errors2.length > 0) {
    errors2.forEach(error => {
      console.log('   错误信息:', Object.values(error.constraints || {}));
    });
  }

  // 测试用例3：新密码强度不足
  const weakPassword = {
    oldPassword: 'OldPass@123',
    newPassword: 'weak123',
    confirmPassword: 'weak123',
  };

  const dto3 = plainToClass(ChangePasswordDto, weakPassword);
  const errors3 = await validate(dto3 as object);
  console.log('❌ 弱密码测试:', errors3.length > 0 ? '通过' : '失败');
  if (errors3.length > 0) {
    errors3.forEach(error => {
      console.log('   错误信息:', Object.values(error.constraints || {}));
    });
  }
}

async function testPaginationDto() {
  console.log('\n🧪 测试 PaginationDto 验证...\n');

  // 测试用例1：有效分页参数
  const validData = {
    page: '1',
    limit: '10',
  };

  const dto1 = plainToClass(PaginationDto, validData) as PaginationDto;
  const errors1 = await validate(dto1 as object);
  console.log('✅ 有效分页参数测试:', errors1.length === 0 ? '通过' : '失败');
  console.log('   自动转换类型:', typeof dto1.page === 'number' ? '成功' : '失败');
  console.log('   计算 skip:', dto1.skip === 0 ? '正确' : '错误');
  console.log('   计算 take:', dto1.take === 10 ? '正确' : '错误');

  // 测试用例2：limit 超出范围
  const invalidLimit = {
    page: '1',
    limit: '200',
  };

  const dto2 = plainToClass(PaginationDto, invalidLimit);
  const errors2 = await validate(dto2 as object);
  console.log('❌ limit 超出范围测试:', errors2.length > 0 ? '通过' : '失败');
  if (errors2.length > 0 && errors2[0]) {
    console.log('   错误信息:', Object.values(errors2[0].constraints || {}));
  }
}

async function runAllTests() {
  console.log('🚀 开始运行 DTO 验证测试...\n');
  console.log('='.repeat(60));

  await testRegisterDto();
  await testChangePasswordDto();
  await testPaginationDto();

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ 所有测试完成！');
}

// 运行测试
runAllTests().catch(console.error);
