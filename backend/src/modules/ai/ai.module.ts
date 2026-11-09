import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module.js';
import { AiToolsService } from './services/ai-tools.service.js';
import { GeminiService } from './services/gemini.service.js';
import { AiConversationsService } from './services/ai-conversations.service.js';
import { RecommendationsService } from './services/recommendations.service.js';
import { AiConversationsController } from './controllers/ai-conversations.controller.js';
import { RecommendationsController } from './controllers/recommendations.controller.js';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
  ],
  controllers: [
    AiConversationsController,
    RecommendationsController,
  ],
  providers: [
    AiToolsService,
    GeminiService,
    AiConversationsService,
    RecommendationsService,
  ],
  exports: [
    AiConversationsService,
    RecommendationsService,
  ],
})
export class AiModule {}
