import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

/**
 * 自定义验证器：验证两个字段是否匹配（如：密码确认）
 * 使用示例：
 * export class ChangePasswordDto {
 *   @IsString()
 *   newPassword: string;
 *
 *   @IsMatch('newPassword', { message: '两次输入的密码不一致' })
 *   confirmPassword: string;
 * }
 */
export function IsMatch(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMatch',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          const relatedValue = (args.object as any)[relatedPropertyName]
          return value === relatedValue
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          return `${propertyName} 必须与 ${relatedPropertyName} 匹配`
        }
      }
    })
  }
}

/**
 * 自定义验证器：验证中国手机号
 * 使用示例：
 * export class UserDto {
 *   @IsPhoneNumber({ message: '请输入有效的中国手机号' })
 *   phone: string;
 * }
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false
          const phoneRegex = /^1[3-9]\d{9}$/
          return phoneRegex.test(value)
        },
        defaultMessage() {
          return '请输入有效的中国手机号'
        }
      }
    })
  }
}

/**
 * 自定义验证器：验证中国身份证号
 * 使用示例：
 * export class UserDto {
 *   @IsIdCard({ message: '请输入有效的身份证号' })
 *   idCard: string;
 * }
 */
export function IsIdCard(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIdCard',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false
          const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
          return idCardRegex.test(value)
        },
        defaultMessage() {
          return '请输入有效的身份证号'
        }
      }
    })
  }
}

/**
 * 自定义验证器：验证强密码（至少8位，包含大小写字母、数字和特殊字符）
 * 使用示例：
 * export class ChangePasswordDto {
 *   @IsStrongPassword({ message: '密码强度不足' })
 *   newPassword: string;
 * }
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false
          const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
          return strongPasswordRegex.test(value)
        },
        defaultMessage() {
          return '密码必须至少8位，包含大小写字母、数字和特殊字符'
        }
      }
    })
  }
}
