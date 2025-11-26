import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const PERMISSIONS_LOGIC_KEY = 'permissions_logic';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);


// 新增：支持 OR 逻辑的装饰器
export const RequirePermissionsOr = (...permissions: string[]) => {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey !== undefined && descriptor !== undefined) {
      SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey, descriptor);
      SetMetadata(PERMISSIONS_LOGIC_KEY, 'OR')(target, propertyKey, descriptor);
    }
  };
};