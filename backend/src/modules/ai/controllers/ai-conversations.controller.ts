import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator.js';
import { AiConversationsService } from '../services/ai-conversations.service.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { SendMessageDto } from '../dto/send-message.dto.js';
import { GetConversationQueryDto } from '../dto/get-conversation-query.dto.js';

function extractCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@ApiTags('AI - Trợ lý ẩm thực Vị Việt')
@Controller('ai/conversations')
export class AiConversationsController {
  private readonly logger = new Logger(AiConversationsController.name);

  constructor(
    private readonly aiConversationsService: AiConversationsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Tạo cuộc trò chuyện mới với AI Bếp Trưởng Vị Việt (API-86)
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Khởi tạo cuộc hội thoại AI tư vấn ẩm thực (API-86)' })
  @ApiResponse({ status: 201, description: 'Tạo hội thoại thành công' })
  async createConversation(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = this.extractUserId(req);
    let guestToken: string | undefined;
    let guestTokenHash: string | undefined;

    if (!userId) {
      guestToken =
        req.header('x-guest-token') ||
        extractCookie(req.headers.cookie, 'vv_ai_guest');

      if (!guestToken) {
        guestToken = randomBytes(32).toString('hex');
      }

      guestTokenHash = hashToken(guestToken);

      // Ghi cookie vv_ai_guest
      const isProd = this.config.get<string>('NODE_ENV') === 'production';
      res.cookie('vv_ai_guest', guestToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/api/v1/ai',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });
      res.setHeader('x-guest-token', guestToken);
    }

    const conversation = await this.aiConversationsService.createConversation(
      userId,
      guestTokenHash,
      dto,
    );

    return {
      ...conversation,
      guestToken: !userId ? guestToken : undefined,
    };
  }

  /**
   * Lấy lịch sử tin nhắn của một cuộc hội thoại (API-87)
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy tin nhắn cuộc hội thoại AI (API-87)' })
  async getConversation(
    @Param('id') id: string,
    @Req() req: Request,
    @Query() query: GetConversationQueryDto,
  ) {
    const userId = this.extractUserId(req);
    const guestToken =
      req.header('x-guest-token') ||
      extractCookie(req.headers.cookie, 'vv_ai_guest');
    const guestTokenHash = guestToken ? hashToken(guestToken) : undefined;

    return this.aiConversationsService.getConversation(
      id,
      userId,
      guestTokenHash,
      query,
    );
  }

  /**
   * Gửi tin nhắn tới AI Bếp Trưởng Vị Việt và nhận tư vấn (API-88)
   */
  @Public()
  @Post(':id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi tin nhắn tư vấn khẩu vị & nhận gợi ý món (API-88)' })
  async sendMessage(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: SendMessageDto,
  ) {
    const userId = this.extractUserId(req);
    const guestToken =
      req.header('x-guest-token') ||
      extractCookie(req.headers.cookie, 'vv_ai_guest');
    const guestTokenHash = guestToken ? hashToken(guestToken) : undefined;

    return this.aiConversationsService.sendMessage(
      id,
      userId,
      guestTokenHash,
      dto,
    );
  }

  /**
   * Xóa mềm cuộc hội thoại (API-89)
   */
  @Public()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa cuộc hội thoại AI (API-89)' })
  async deleteConversation(@Param('id') id: string, @Req() req: Request) {
    const userId = this.extractUserId(req);
    const guestToken =
      req.header('x-guest-token') ||
      extractCookie(req.headers.cookie, 'vv_ai_guest');
    const guestTokenHash = guestToken ? hashToken(guestToken) : undefined;

    await this.aiConversationsService.deleteConversation(
      id,
      userId,
      guestTokenHash,
    );
  }

  /**
   * Trích xuất User ID từ Authorization Bearer Token hoặc req.user nếu đã xác thực
   */
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
