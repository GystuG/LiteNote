import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBudgetDto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        userId,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId, isActive: true },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: string) {
    return this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });
  }

  async update(id: number, userId: string, updateBudgetDto: UpdateBudgetDto) {
    return this.prisma.budget.updateMany({
      where: { id, userId },
      data: updateBudgetDto,
    });
  }

  async remove(id: number, userId: string) {
    return this.prisma.budget.deleteMany({
      where: { id, userId },
    });
  }

  async getBudgetProgress(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, isActive: true },
      include: {
        category: true,
      },
    });

    const now = new Date();
    const results = [];

    for (const budget of budgets) {
      let startDate: Date;
      let endDate: Date;

      if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }

      // 查询该周期内的支出
      const whereClause: any = {
        userId,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (budget.categoryId) {
        whereClause.categoryId = budget.categoryId;
      }

      const spent = await this.prisma.bill.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
        },
      });

      const spentAmount = Number(spent._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const progress =
        budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const remaining = budgetAmount - spentAmount;

      results.push({
        ...budget,
        spent: spentAmount,
        remaining,
        progress: Math.min(progress, 100),
        isOverBudget: spentAmount > budgetAmount,
        needsAlert: progress >= budget.alertAt,
      });
    }

    return results;
  }
}
