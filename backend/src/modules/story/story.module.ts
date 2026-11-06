import { Module } from '@nestjs/common';
import { StoryService } from './services/story.service.js';
import { StoryPublicController } from './controllers/story-public.controller.js';
import { StoryAdminController } from './controllers/story-admin.controller.js';

@Module({
  controllers: [StoryPublicController, StoryAdminController],
  providers: [StoryService],
})
export class StoryModule {}
