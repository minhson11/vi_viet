import { Controller, Get, Param } from '@nestjs/common';
import { StoryService } from '../services/story.service.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('story')
export class StoryPublicController {
  constructor(private readonly storyService: StoryService) {}

  @Public()
  @Get('sections')
  async getPublicSections() {
    return this.storyService.findAllPublic();
  }

  @Public()
  @Get('sections/:id')
  async getPublicSectionById(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }
}
