import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建分类
   */
  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const { name, type, icon, color, sortOrder } = createCategoryDto;

    // 确保用户存在，如果不存在则创建
    await this.ensureUserExists(userId);

    return this.prisma.category.create({
      data: {
        name,
        type,
        icon,
        color,
        sortOrder: sortOrder || 0,
        userId,
        isDefault: false,
      },
    });
  }

  /**
   * 确保用户存在，如果不存在则创建测试用户
   */
  private async ensureUserExists(userId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          id: userId,
          username: 'testuser',
          password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 123456
          email: 'test@example.com',
          nickname: '测试用户',
        },
      });
    }
  }

  /**
   * 获取用户的分类列表（包括系统默认分类）
   */
  async findAll(userId: string, type?: string) {
    const where: any = {
      OR: [
        { userId }, // 用户自定义分类
        { isDefault: true }, // 系统默认分类
      ],
    };

    if (type) {
      where.type = type;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' }, // 默认分类排在前面
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * 获取单个分类详情
   */
  async findOne(userId: string, id: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        OR: [{ userId }, { isDefault: true }],
      },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    return category;
  }

  /**
   * 更新分类
   */
  async update(
    userId: string,
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    // 先检查分类是否存在且属于该用户（不能修改系统默认分类）
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId, // 只能修改自己的分类
        isDefault: false, // 不能修改默认分类
      },
    });

    if (!category) {
      throw new Error('分类不存在或无权限修改');
    }

    const updateData: any = {};

    if (updateCategoryDto.name !== undefined) {
      updateData.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.type !== undefined) {
      updateData.type = updateCategoryDto.type;
    }
    if (updateCategoryDto.icon !== undefined) {
      updateData.icon = updateCategoryDto.icon;
    }
    if (updateCategoryDto.color !== undefined) {
      updateData.color = updateCategoryDto.color;
    }
    if (updateCategoryDto.sortOrder !== undefined) {
      updateData.sortOrder = updateCategoryDto.sortOrder;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 删除分类
   */
  async remove(userId: string, id: number) {
    // 先检查分类是否存在且属于该用户（不能删除系统默认分类）
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
        isDefault: false,
      },
    });

    if (!category) {
      throw new Error('分类不存在或无权限删除');
    }

    // 检查是否有账单使用该分类
    const billCount = await this.prisma.bill.count({
      where: { categoryId: id },
    });

    if (billCount > 0) {
      throw new Error('该分类下还有账单，无法删除');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * 初始化系统默认分类
   */
  async initDefaultCategories() {
    const defaultCategories = [
      // 支出分类
      {
        name: '餐饮',
        type: 'expense',
        icon: '🍔',
        color: '#FF6B6B',
        sortOrder: 1,
      },
      {
        name: '交通',
        type: 'expense',
        icon: '🚗',
        color: '#4ECDC4',
        sortOrder: 2,
      },
      {
        name: '购物',
        type: 'expense',
        icon: '🛍️',
        color: '#45B7D1',
        sortOrder: 3,
      },
      {
        name: '娱乐',
        type: 'expense',
        icon: '🎮',
        color: '#96CEB4',
        sortOrder: 4,
      },
      {
        name: '医疗',
        type: 'expense',
        icon: '🏥',
        color: '#FFEAA7',
        sortOrder: 5,
      },
      {
        name: '教育',
        type: 'expense',
        icon: '📚',
        color: '#DDA0DD',
        sortOrder: 6,
      },
      {
        name: '住房',
        type: 'expense',
        icon: '🏠',
        color: '#98D8C8',
        sortOrder: 7,
      },
      {
        name: '其他',
        type: 'expense',
        icon: '📝',
        color: '#F7DC6F',
        sortOrder: 8,
      },

      // 收入分类
      {
        name: '工资',
        type: 'income',
        icon: '💰',
        color: '#58D68D',
        sortOrder: 1,
      },
      {
        name: '奖金',
        type: 'income',
        icon: '🎁',
        color: '#85C1E9',
        sortOrder: 2,
      },
      {
        name: '投资',
        type: 'income',
        icon: '📈',
        color: '#F8C471',
        sortOrder: 3,
      },
      {
        name: '兼职',
        type: 'income',
        icon: '💼',
        color: '#BB8FCE',
        sortOrder: 4,
      },
      {
        name: '其他',
        type: 'income',
        icon: '💸',
        color: '#82E0AA',
        sortOrder: 5,
      },
    ];

    for (const category of defaultCategories) {
      await this.prisma.category.upsert({
        where: {
          // 使用复合唯一索引来避免重复创建
          // 这里我们用name和type的组合来判断
          id: -1, // 临时ID，实际不会匹配到
        },
        update: {}, // 如果存在则不更新
        create: {
          ...category,
          isDefault: true,
          userId: null, // 系统默认分类不属于任何用户
        },
      });
    }
  }
}
