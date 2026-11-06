import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { StoryService } from '../services/story.service.js';
import { CreateStorySectionDto } from '../dto/create-story-section.dto.js';
import {
  UpdateStorySectionDto,
  ReorderStorySectionsDto,
} from '../dto/update-story-section.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Roles(Role.ADMIN)
@Controller('admin/story')
export class StoryAdminController {
  constructor(private readonly storyService: StoryService) {}

  @Get('sections')
  async getAllSections() {
    return this.storyService.findAllAdmin();
  }

  @Get('sections/:id')
  async getSectionById(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }

  @Post('sections')
  async createSection(@Body() dto: CreateStorySectionDto) {
    return this.storyService.create(dto);
  }

  @Put('sections/:id')
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateStorySectionDto,
  ) {
    return this.storyService.update(id, dto);
  }

  @Patch('sections/:id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.storyService.toggleActive(id);
  }

  @Post('sections/reorder')
  async reorderSections(@Body() dto: ReorderStorySectionsDto) {
    return this.storyService.reorder(dto.items);
  }

  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    return this.storyService.remove(id);
  }

  @Post('sections/seed-defaults')
  async resetToDefaults() {
    return this.storyService.resetToDefaults();
  }
}
