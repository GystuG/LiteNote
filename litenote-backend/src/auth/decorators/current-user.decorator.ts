import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从请求中获取当前用户信息的装饰器
 *
 * @example
 * // 获取完整用户对象
 * @CurrentUser() user: User
 *
 * @example
 * // 获取用户ID
 * @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // 如果指定了属性名，返回该属性；否则返回完整用户对象
    return data ? user[data] : user;
  },
);
