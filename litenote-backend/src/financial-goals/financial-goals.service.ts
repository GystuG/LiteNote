import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFinancialGoalDto,
  UpdateFinancialGoalDto,
} from './dto/financial-goal.dto';

@Injectable()
export class FinancialGoalsService {
  private readonly logger = new Logger(FinancialGoalsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFinancialGoalDto) {
    this.logger.log(`create() userId=${userId} dto=${JSON.stringify(dto)}`);
    try {
      const result = await this.prisma.financialGoal.create({
        data: {
          ...dto,
          deadline: dto.deadline ? new Date(dto.deadline) : undefined,
          userId,
        },
      });
      this.logger.log(`create() success id=${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`create() failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.financialGoal.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number, userId: string) {
    return this.prisma.financialGoal.findFirst({
      where: { id, userId },
    });
  }

  async update(id: number, userId: string, dto: UpdateFinancialGoalDto) {
    const data: any = { ...dto };
    if (dto.deadline !== undefined) {
      data.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }

    return this.prisma.financialGoal.updateMany({
      where: { id, userId },
      data,
    });
  }

  async remove(id: number, userId: string) {
    return this.prisma.financialGoal.deleteMany({
      where: { id, userId },
    });
  }

  async getProgress(userId: string) {
    const goals = await this.prisma.financialGoal.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });

    return goals.map((goal) => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

      return {
        ...goal,
        targetAmount: target,
        currentAmount: current,
        progress: Math.round(progress * 100) / 100,
      };
    });
  }
}
