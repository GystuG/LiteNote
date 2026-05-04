import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIConfigController } from './ai-config.controller';
import { ChatController } from './chat.controller';
import { AsrController } from './asr.controller';
import { AIService } from './ai.service';
import { AIConfigService } from './ai-config.service';
import { ChatService } from './services/chat.service';
import { SessionService } from './services/session.service';
import { ToolExecutorService } from './services/tool-executor.service';
import { AsrService } from './services/asr.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { BillsModule } from '../bills/bills.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [BillsModule, CategoriesModule],
  controllers: [
    AIController,
    AIConfigController,
    ChatController,
    AsrController,
  ],
  providers: [
    AIService,
    AIConfigService,
    ChatService,
    SessionService,
    ToolExecutorService,
    AsrService,
    AIProviderFactory,
  ],
  exports: [AIService, AIConfigService],
})
export class AIModule {}
