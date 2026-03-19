import { Module } from '@nestjs/common';
import { HotUpdateController } from './hot-update.controller';
import { HotUpdateService } from './hot-update.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HotUpdateController],
  providers: [HotUpdateService],
  exports: [HotUpdateService],
})
export class HotUpdateModule {}
