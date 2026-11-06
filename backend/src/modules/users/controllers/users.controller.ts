import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { ChangePasswordDto } from '../../auth/dto/change-password.dto.js';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get('preferences')
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.usersService.getPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(userId, dto);
  }

  // BE-08.01: Món ăn yêu thích (API-18, API-19, API-20)
  @Get('favorites')
  async getFavorites(@CurrentUser('id') userId: string) {
    return this.usersService.getFavorites(userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('favorites/:dishId')
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Param('dishId') dishId: string,
  ) {
    await this.usersService.addFavorite(userId, dishId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('favorites/:dishId')
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('dishId') dishId: string,
  ) {
    await this.usersService.removeFavorite(userId, dishId);
  }
}
