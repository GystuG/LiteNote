import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAccountDto: CreateAccountDto) {
    // 如果设置为默认账户，先将其他账户设为非默认
    if (createAccountDto.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: number, userId: string) {
    return this.prisma.account.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });
  }

  async update(id: number, userId: string, updateAccountDto: UpdateAccountDto) {
    // 如果设置为默认账户，先将其他账户设为非默认
    if (updateAccountDto.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.account.updateMany({
      where: { id, userId },
      data: updateAccountDto,
    });
  }

  async remove(id: number, userId: string) {
    return this.prisma.account.deleteMany({
      where: { id, userId },
    });
  }

  async getTotalBalance(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { balance: true, type: true },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach((account) => {
      const balance = Number(account.balance);
      if (account.type === 'credit_card') {
        totalLiabilities += Math.abs(balance);
      } else {
        totalAssets += balance;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  }
}
