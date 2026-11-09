import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service.js';
import { GeminiService } from './gemini.service.js';
import { CreateConversationDto } from '../dto/create-conversation.dto.js';
import { SendMessageDto } from '../dto/send-message.dto.js';
import { GetConversationQueryDto } from '../dto/get-conversation-query.dto.js';
import { AIReply, RecommendationCard } from '../types/ai.interfaces.js';
import {
  ai_messages_role,
  recommendation_items_source,
} from '@prisma/client';

@Injectable()
export class AiConversationsService {
  private readonly logger = new Logger(AiConversationsService.name);
  // Quản lý khóa cạnh tranh cho các conversation đang xử lý (In-memory lease)
  private readonly activeLeases = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Tạo cuộc trò chuyện mới (API-86)
   */
  async createConversation(
    userId: string | undefined,
    guestTokenHash: string | undefined,
    dto: CreateConversationDto,
  ) {
    if (!userId && !guestTokenHash) {
      throw new BadRequestException('Yêu cầu thông tin định danh người dùng hoặc khách.');
    }

    const uId = userId ? BigInt(userId) : null;

    // Giới hạn đề xuất tối đa 5 hội thoại còn hoạt động cho phiên khách
    if (!uId && guestTokenHash) {
      const activeCount = await this.prisma.ai_conversations.count({
        where: {
          guest_token_hash: guestTokenHash,
          deleted_at: null,
        },
      });
      if (activeCount >= 5) {
        // Tự động xóa mềm hội thoại cũ nhất của khách để giải phóng phiên
        const oldest = await this.prisma.ai_conversations.findFirst({
          where: { guest_token_hash: guestTokenHash, deleted_at: null },
          orderBy: { created_at: 'asc' },
        });
        if (oldest) {
          await this.prisma.ai_conversations.update({
            where: { id: oldest.id },
            data: { deleted_at: new Date() },
          });
        }
      }
    }

    const conversation = await this.prisma.ai_conversations.create({
      data: {
        user_id: uId,
        guest_token_hash: !uId ? guestTokenHash : null,
        title: dto.title?.trim() || 'Tư vấn ẩm thực Vị Việt',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      },
    });

    return {
      id: conversation.id.toString(),
      title: conversation.title,
      expiresAt: conversation.expires_at,
      createdAt: conversation.created_at,
    };
  }

  /**
   * Lấy lịch sử cuộc trò chuyện và danh sách tin nhắn (API-87)
   */
  async getConversation(
    conversationId: string,
    userId: string | undefined,
    guestTokenHash: string | undefined,
    query: GetConversationQueryDto,
  ) {
    const convId = BigInt(conversationId);
    const conversation = await this.prisma.ai_conversations.findUnique({
      where: { id: convId },
    });

    if (!conversation || conversation.deleted_at) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại hoặc đã bị xóa.');
    }

    this.checkOwnership(conversation, userId, guestTokenHash);

    const limit = query.limit ?? 20;
    const whereMsg: any = {
      conversation_id: convId,
    };

    if (query.beforeId) {
      whereMsg.id = { lt: BigInt(query.beforeId) };
    }

    const messages = await this.prisma.ai_messages.findMany({
      where: whereMsg,
      take: limit,
      orderBy: { created_at: 'asc' },
      include: {
        recommendation_items: {
          include: {
            dishes: {
              include: {
                dish_images: {
                  where: { kind: 'COVER' },
                  take: 1,
                  select: { asset_path: true },
                },
                dish_variants: {
                  where: { is_active: true },
                  orderBy: { price: 'asc' },
                  take: 1,
                  select: { price: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      conversation: {
        id: conversation.id.toString(),
        title: conversation.title,
        createdAt: conversation.created_at,
        expiresAt: conversation.expires_at,
      },
      messages: messages.map((m) => {
        const recommendations: RecommendationCard[] = m.recommendation_items.map(
          (item) => ({
            id: item.id.toString(),
            dishId: item.dish_id.toString(),
            dishName: item.dishes.name,
            slug: item.dishes.slug,
            coverUrl: item.dishes.dish_images[0]?.asset_path ?? null,
            startingPrice:
              item.dishes.dish_variants.length > 0
                ? Number(item.dishes.dish_variants[0].price)
                : 0,
            availability: item.dishes.availability,
            reason: item.reason || '',
            rankPosition: item.rank_position,
          }),
        );

        return {
          id: m.id.toString(),
          role: m.role.toLowerCase(),
          content: m.content,
          createdAt: m.created_at,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
        };
      }),
    };
  }

  /**
   * Gửi tin nhắn và nhận phản hồi từ AI tư vấn ẩm thực (API-88)
   */
  async sendMessage(
    conversationId: string,
    userId: string | undefined,
    guestTokenHash: string | undefined,
    dto: SendMessageDto,
  ): Promise<AIReply> {
    const convId = BigInt(conversationId);
    const conversation = await this.prisma.ai_conversations.findUnique({
      where: { id: convId },
    });

    if (!conversation || conversation.deleted_at) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại hoặc đã bị xóa.');
    }

    this.checkOwnership(conversation, userId, guestTokenHash);

    // 1. Kiểm tra giới hạn 50 tin người dùng / hội thoại
    const userMsgCount = await this.prisma.ai_messages.count({
      where: {
        conversation_id: convId,
        role: ai_messages_role.USER,
      },
    });
    if (userMsgCount >= 50) {
      throw new BadRequestException(
        'Cuộc trò chuyện đã đạt giới hạn 50 tin nhắn. Vui lòng mở cuộc tư vấn mới để tiếp tục!',
      );
    }

    // 2. Idempotency Check theo requestKey
    const requestKey = dto.requestKey?.trim() || randomUUID();
    const existingAssistantReply = await this.findReplayByRequestKey(convId, requestKey);
    if (existingAssistantReply) {
      return existingAssistantReply;
    }

    // 3. Khóa chống tranh chấp (Active Lease check - 1 request/conversation tại 1 thời điểm)
    const lockKey = convId.toString();
    const currentLease = this.activeLeases.get(lockKey);
    const now = Date.now();
    if (currentLease && currentLease > now) {
      throw new ConflictException(
        'Bếp Trưởng Vị Việt đang suy nghĩ cho câu hỏi trước, xin bạn vui lòng đợi trong giây lát!',
      );
    }
    // Thiết lập lease 25 giây
    this.activeLeases.set(lockKey, now + 25000);

    let userMessageRecord: any;
    try {
      // 4. Lưu tin nhắn của người dùng
      userMessageRecord = await this.prisma.ai_messages.create({
        data: {
          conversation_id: convId,
          role: ai_messages_role.USER,
          content: dto.content.trim(),
          structured_data: { requestKey },
        },
      });

      // 5. Lấy lịch sử 10 tin nhắn gần nhất làm ngữ cảnh
      const recentMessages = await this.prisma.ai_messages.findMany({
        where: {
          conversation_id: convId,
          id: { not: userMessageRecord.id },
        },
        take: 10,
        orderBy: { created_at: 'desc' },
      });

      const formattedHistory = recentMessages
        .reverse()
        .map((m) => ({
          role: m.role as 'USER' | 'ASSISTANT',
          content: m.content,
        }));

      // 6. Gọi Gemini tư vấn với Function Calling
      const result = await this.geminiService.consult({
        pastMessages: formattedHistory,
        newUserMessage: dto.content.trim(),
      });

      // 7. Lưu tin nhắn trả lời của Trợ lý AI
      const batchKey = randomUUID().replace(/-/g, '').substring(0, 32);
      const assistantMessageRecord = await this.prisma.ai_messages.create({
        data: {
          conversation_id: convId,
          role: ai_messages_role.ASSISTANT,
          content: result.replyText,
          model_name: result.modelName,
          structured_data: {
            requestKey,
            batchKey,
            replyToUserMessageId: userMessageRecord.id.toString(),
            recommendedDishIds: result.recommendations.map((r) => r.dishId),
          },
        },
      });

      // 8. Lưu các đề xuất món vào recommendation_items
      const savedRecommendations: RecommendationCard[] = [];
      const uId = conversation.user_id;

      for (let i = 0; i < result.recommendations.length; i++) {
        const item = result.recommendations[i];
        try {
          const dishId = BigInt(item.dishId);
          const savedRec = await this.prisma.recommendation_items.create({
            data: {
              user_id: uId,
              message_id: assistantMessageRecord.id,
              dish_id: dishId,
              batch_key: batchKey,
              source: recommendation_items_source.AI_CHAT,
              rank_position: i + 1,
              reason: item.reason.substring(0, 500),
            },
          });

          savedRecommendations.push({
            ...item,
            id: savedRec.id.toString(),
            rankPosition: i + 1,
          });
        } catch (saveErr) {
          this.logger.warn(`Không thể lưu recommendation_item cho món ${item.dishId}:`, saveErr);
          savedRecommendations.push(item);
        }
      }

      // Cập nhật updated_at cho conversation
      await this.prisma.ai_conversations.update({
        where: { id: convId },
        data: { updated_at: new Date() },
      });

      return {
        conversationId: convId.toString(),
        userMessageId: userMessageRecord.id.toString(),
        assistantMessageId: assistantMessageRecord.id.toString(),
        content: result.replyText,
        recommendations: savedRecommendations,
        warnings: result.warnings,
      };
    } finally {
      // Giải phóng khóa
      this.activeLeases.delete(lockKey);
    }
  }

  /**
   * Xóa mềm cuộc trò chuyện (API-89)
   */
  async deleteConversation(
    conversationId: string,
    userId: string | undefined,
    guestTokenHash: string | undefined,
  ): Promise<void> {
    const convId = BigInt(conversationId);
    const conversation = await this.prisma.ai_conversations.findUnique({
      where: { id: convId },
    });

    if (!conversation || conversation.deleted_at) {
      throw new NotFoundException('Cuộc trò chuyện không tồn tại hoặc đã bị xóa.');
    }

    this.checkOwnership(conversation, userId, guestTokenHash);

    await this.prisma.ai_conversations.update({
      where: { id: convId },
      data: { deleted_at: new Date() },
    });
  }

  private checkOwnership(
    conv: { user_id: bigint | null; guest_token_hash: string | null },
    userId: string | undefined,
    guestTokenHash: string | undefined,
  ) {
    if (conv.user_id) {
      if (!userId || conv.user_id.toString() !== userId) {
        throw new ForbiddenException('Bạn không có quyền truy cập cuộc trò chuyện này.');
      }
    } else if (conv.guest_token_hash) {
      if (!guestTokenHash || conv.guest_token_hash !== guestTokenHash) {
        throw new ForbiddenException('Mã phiên khách không hợp lệ cho cuộc trò chuyện này.');
      }
    }
  }

  private async findReplayByRequestKey(
    convId: bigint,
    requestKey: string,
  ): Promise<AIReply | null> {
    try {
      const existingAssistant = await this.prisma.ai_messages.findFirst({
        where: {
          conversation_id: convId,
          role: ai_messages_role.ASSISTANT,
          structured_data: {
            path: '$.requestKey',
            equals: requestKey,
          },
        },
        include: {
          recommendation_items: {
            include: {
              dishes: {
                include: {
                  dish_images: {
                    where: { kind: 'COVER' },
                    take: 1,
                    select: { asset_path: true },
                  },
                  dish_variants: {
                    where: { is_active: true },
                    orderBy: { price: 'asc' },
                    take: 1,
                    select: { price: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingAssistant) return null;

      const recommendations: RecommendationCard[] =
        existingAssistant.recommendation_items.map((item) => ({
          id: item.id.toString(),
          dishId: item.dish_id.toString(),
          dishName: item.dishes.name,
          slug: item.dishes.slug,
          coverUrl: item.dishes.dish_images[0]?.asset_path ?? null,
          startingPrice:
            item.dishes.dish_variants.length > 0
              ? Number(item.dishes.dish_variants[0].price)
              : 0,
          availability: item.dishes.availability,
          reason: item.reason || '',
          rankPosition: item.rank_position,
        }));

      return {
        conversationId: convId.toString(),
        userMessageId:
          (existingAssistant.structured_data as any)?.replyToUserMessageId || '',
        assistantMessageId: existingAssistant.id.toString(),
        content: existingAssistant.content,
        recommendations,
        warnings: [],
      };
    } catch {
      return null;
    }
  }
}
