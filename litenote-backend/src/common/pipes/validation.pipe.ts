/**
 * 全局数据验证管道
 * 提供统一的数据验证和转换，支持中文错误提示
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      throw new BadRequestException({
        message: '请求参数验证失败',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * 格式化验证错误信息为中文
   */
  private formatErrors(errors: any[]): string[] {
    const errorMessages: string[] = [];

    errors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((message: any) => {
          errorMessages.push(
            this.translateErrorMessage(message, error.property),
          );
        });
      }

      // 处理嵌套验证错误
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children);
        errorMessages.push(...childErrors);
      }
    });

    return errorMessages;
  }

  /**
   * 将英文验证错误信息翻译为中文
   */
  private translateErrorMessage(message: string, property: string): string {
    const translations: Record<string, string> = {
      'should not be empty': `${this.getFieldName(property)}不能为空`,
      'must be a string': `${this.getFieldName(property)}必须是字符串`,
      'must be a number': `${this.getFieldName(property)}必须是数字`,
      'must be a boolean': `${this.getFieldName(property)}必须是布尔值`,
      'must be an email': `${this.getFieldName(property)}必须是有效的邮箱地址`,
      'must be a date': `${this.getFieldName(property)}必须是有效的日期`,
      'must be positive': `${this.getFieldName(property)}必须是正数`,
      'must be greater than 0': `${this.getFieldName(property)}必须大于0`,
      'must be an integer': `${this.getFieldName(property)}必须是整数`,
    };

    // 查找匹配的翻译
    for (const [key, value] of Object.entries(translations)) {
      if (message.includes(key)) {
        return value;
      }
    }

    // 如果没有找到翻译，返回原始消息
    return `${this.getFieldName(property)}: ${message}`;
  }

  /**
   * 获取字段的中文名称
   */
  private getFieldName(property: string): string {
    const fieldNames: Record<string, string> = {
      amount: '金额',
      type: '类型',
      description: '描述',
      date: '日期',
      categoryId: '分类ID',
      name: '名称',
      icon: '图标',
      color: '颜色',
      email: '邮箱',
      username: '用户名',
      nickname: '昵称',
      page: '页码',
      limit: '每页数量',
    };

    return fieldNames[property] || property;
  }
}
