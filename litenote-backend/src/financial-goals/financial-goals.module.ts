import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialGoalsController } from './financial-goals.controller';
import { FinancialGoalsService } from './financial-goals.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialGoalsController],
  providers: [FinancialGoalsService],
  exports: [FinancialGoalsService],
})
export class FinancialGoalsModule {}
