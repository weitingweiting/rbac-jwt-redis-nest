import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * 自定义管道：将字符串转换为整数
 * 使用示例：
 * @Get(':id')
 * findOne(@Param('id', ParseIntPipe) id: number) {
 *   return this.service.findOne(id);
 * }
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(`${metadata.data} 必须是一个有效的整数`);
    }
    return val;
  }
}

/**
 * 自定义管道：去除字符串前后空格
 * 使用示例：
 * @Post()
 * create(@Body(TrimPipe) dto: CreateDto) {
 *   return this.service.create(dto);
 * }
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      return this.trimObject(value);
    }
    return value;
  }

  private trimObject(obj: any): any {
    const trimmed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          trimmed[key] = value.trim();
        } else if (typeof value === 'object' && value !== null) {
          trimmed[key] = this.trimObject(value);
        } else {
          trimmed[key] = value;
        }
      }
    }
    return trimmed;
  }
}
