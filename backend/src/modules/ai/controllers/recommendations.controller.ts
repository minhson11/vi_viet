import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { RecommendationsService } from '../services/recommendations.service.js';
import { QueryRecommendationsDto } from '../dto/query-recommendations.dto.js';
import { TrackInteractionDto } from '../dto/track-interaction.dto.js';

@ApiTags('Gợi ý món ăn & Cá nhân hóa')
@Controller()
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Lấy danh sách món ăn gợi ý cá nhân hóa hoặc phổ biến (API-90)
   */
  @Public()
  @Get('recommendations')
  @ApiOperation({ summary: 'Lấy danh sách món ăn gợi ý cá nhân hóa / phổ biến (API-90)' })
  async getRecommendations(
    @Req() req: Request,
    @Query() query: QueryRecommendationsDto,
  ) {
    const userId = this.extractUserId(req);
    return this.recommendationsService.getRecommendations(userId, query);
  }

  /**
   * Ghi nhận tương tác của khách hàng với món ăn / đề xuất (API-91)
   */
  @Post('me/interactions')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ghi nhận sự kiện tương tác của khách hàng (API-91)' })
  @ApiResponse({ status: 202, description: 'Đã tiếp nhận sự kiện tương tác' })
  async trackInteraction(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackInteractionDto,
  ) {
    return this.recommendationsService.trackInteraction(userId, dto);
  }

  private extractUserId(req: Request): string | undefined {
    if ((req as any).user?.id) {
      return (req as any).user.id.toString();
    }

    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return undefined;

    try {
      const secret = this.config.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      return payload?.sub ? payload.sub.toString() : undefined;
    } catch {
      return undefined;
    }
  }
}
