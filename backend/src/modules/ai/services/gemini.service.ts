import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiToolsService } from './ai-tools.service.js';
import { MenuItemSummary, RecommendationCard } from '../types/ai.interfaces.js';

interface GeminiMessagePart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
    id?: string;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiMessagePart[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(
    private readonly config: ConfigService,
    private readonly aiToolsService: AiToolsService,
  ) {
    this.apiKey =
      this.config.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      '';
    this.modelName =
      this.config.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-3.5-flash-lite';
  }

  /**
   * Gọi Gemini với Function Calling để tư vấn món ăn và trả lời khách hàng
   */
  async consult({
    pastMessages,
    newUserMessage,
  }: {
    pastMessages: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>;
    newUserMessage: string;
  }): Promise<{
    replyText: string;
    recommendations: RecommendationCard[];
    warnings: string[];
    modelName: string;
  }> {
    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY chưa được cấu hình trong hệ thống (Environment Variables).',
      );
    }

    const systemInstruction = {
      parts: [
        {
          text: `Bạn là "Bếp Trưởng Vị Việt" - Cố vấn ẩm thực tận tâm và giàu kinh nghiệm của chuỗi nhà hàng Vị Việt (ẩm thực truyền thống Việt Nam).
Nhiệm vụ: Tư vấn món ăn, giải đáp thắc mắc về khẩu vị, giới thiệu món phù hợp với mong muốn của khách.

QUY TẮC BẮT BUỘC:
1. ĐỘ DÀI & GIỌNG ĐIỆU:
   - Trả lời ấm áp, nhã nhặn, mang đậm phong vị ẩm thực truyền thống Việt Nam.
   - KHÔNG trả lời cộc lốc quá ngắn (không trả lời 1 câu cụt lủn), cũng KHÔNG viết bài văn dài dòng lan man. Với mỗi món ăn, hãy viết trọn vẹn 2 - 3 câu mô tả đầy đủ hương vị, nước dùng, nguyên liệu đặc trưng và lý do món ăn phù hợp với thực khách.
2. TRA CỨU THỰC ĐƠN:
   - Bạn PHẢI sử dụng công cụ 'searchMenu' hoặc 'getDishDetails' để tra cứu các món ăn thực tế có trong hệ thống trước khi gợi ý. Tuyệt đối không bịa món ăn.
3. VỊ TRÍ GẮN THẺ MÓN ĂN ([DISH:id]):
   - TUYỆT ĐỐI KHÔNG chèn thẻ [DISH:id] vào giữa chừng một câu văn đang nói dở.
   - Bạn PHẢI viết xong HOÀN CHỈNH toàn bộ câu/đoạn văn mô tả món ăn, sau đó XUỐNG DÒNG và đặt mã [DISH:id] trên một dòng riêng biệt ở ngay phía dưới đoạn giới thiệu món đó.
   - Cấu trúc mẫu chuẩn:
     Dạ Bếp Trưởng Vị Việt xin gợi ý bạn món Bún Bò Huế Cố Đô Chân Giò Chả Cua. Món này có nước dùng cay nồng thơm lừng hương sả và ruốc Huế đặc trưng, sợi bún to ăn cùng bắp bò giòn sần sật và chân giò ninh mềm nhừ rất đậm đà.
     [DISH:1504472]

     Ngoài ra, nếu bạn muốn đổi vị với món khô thì Bún Chả Hà Nội nướng than hoa là lựa chọn tuyệt vời. Từng miếng chả ba chỉ và chả viên nướng than thơm nức mũi, chấm ngập trong nước mắm chua ngọt ấm nóng rất vừa miệng.
     [DISH:1504473]
4. SỐ LƯỢNG MÓN: Chỉ gợi ý từ 1 đến tối đa 3 món phù hợp nhất.`,
        },
      ],
    };

    const tools = [
      {
        function_declarations: [
          {
            name: 'searchMenu',
            description:
              'Tìm kiếm các món ăn có trong thực đơn Vị Việt theo khẩu vị, từ khóa, độ cay, ngân sách hoặc kiêng cữ',
            parameters: {
              type: 'OBJECT',
              properties: {
                keyword: {
                  type: 'STRING',
                  description:
                    'Từ khóa tìm kiếm (ví dụ: phở, bún, thanh đạm, chè, canh, cuốn, cá, bò...)',
                },
                categorySlug: {
                  type: 'STRING',
                  description: 'Slug danh mục món ăn (ví dụ: mon-chinh, mon-nuoc, trang-mieng)',
                },
                maxSpicyLevel: {
                  type: 'NUMBER',
                  description:
                    'Mức độ cay tối đa (0: không cay, 1: cay nhẹ, 2: cay vừa, 3: cay nồng)',
                },
                minPrice: {
                  type: 'NUMBER',
                  description: 'Mức giá tối thiểu VND',
                },
                maxPrice: {
                  type: 'NUMBER',
                  description: 'Mức giá tối đa VND',
                },
                avoidIngredients: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  description:
                    'Danh sách nguyên liệu cần tránh (ví dụ: ["hải sản", "đậu phộng", "ớt"])',
                },
                tagCodes: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  description: 'Danh sách mã tag (ví dụ: ["chay", "thanh-dam", "an-vat"])',
                },
              },
            },
          },
          {
            name: 'getDishDetails',
            description:
              'Xem chi tiết thành phần, các biến thể giá và thông tin sâu hơn của các món ăn theo danh sách dishId',
            parameters: {
              type: 'OBJECT',
              properties: {
                dishIds: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                  description: 'Danh sách ID của các món ăn cần xem chi tiết',
                },
              },
              required: ['dishIds'],
            },
          },
        ],
      },
    ];

    // Xây dựng lịch sử hội thoại chuẩn Gemini
    const contents: GeminiContent[] = [];

    for (const msg of pastMessages) {
      contents.push({
        role: msg.role === 'ASSISTANT' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Thêm tin nhắn mới nhất của người dùng
    contents.push({
      role: 'user',
      parts: [{ text: newUserMessage }],
    });

    const gatheredDishes: Map<string, MenuItemSummary> = new Map();
    let replyText = '';
    const warnings: string[] = [];

    // Vòng lặp Function Calling (tối đa 3 lượt gọi công cụ)
    for (let turn = 0; turn < 4; turn++) {
      const response = await this.callGeminiApi({
        system_instruction: systemInstruction,
        contents,
        tools,
      });

      const candidate = response?.candidates?.[0];
      if (!candidate || !candidate.content) {
        throw new Error('Gemini API không phản hồi kết quả hợp lệ.');
      }

      const modelParts = candidate.content.parts || [];
      const functionCalls = modelParts.filter(
        (p: GeminiMessagePart) => p.functionCall,
      );

      if (functionCalls.length === 0) {
        // Model đã hoàn thành việc sinh câu trả lời bằng văn bản
        replyText = modelParts
          .map((p: GeminiMessagePart) => p.text)
          .filter(Boolean)
          .join('\n\n');
        break;
      }

      // Thêm phản hồi của Model chứa function call vào chuỗi hội thoại
      contents.push({
        role: 'model',
        parts: modelParts,
      });

      // Thực thi các Function Calls và đóng gói phản hồi
      const toolResponseParts: GeminiMessagePart[] = [];

      for (const fcPart of functionCalls) {
        const { name, args } = fcPart.functionCall!;
        this.logger.log(`Gemini gọi tool: ${name} với tham số: ${JSON.stringify(args)}`);

        let toolResult: any;
        if (name === 'searchMenu') {
          const dishes = await this.aiToolsService.searchMenu(args);
          for (const d of dishes) {
            gatheredDishes.set(d.id, d);
          }
          toolResult = {
            total: dishes.length,
            dishes: dishes.map((d) => ({
              id: d.id,
              name: d.name,
              price: d.startingPrice,
              spicy_level: d.spicy_level,
              description: d.description,
              ingredients: d.ingredients.slice(0, 5),
            })),
          };
        } else if (name === 'getDishDetails') {
          const details = await this.aiToolsService.getDishDetails(args.dishIds || []);
          toolResult = { dishes: details };
        } else {
          toolResult = { error: `Không tìm thấy tool ${name}` };
        }

        toolResponseParts.push({
          functionResponse: {
            name,
            response:
              typeof toolResult === 'object' && !Array.isArray(toolResult)
                ? toolResult
                : { output: toolResult },
          },
        });
      }

      // Bổ sung kết quả các tool vào nội dung hội thoại
      contents.push({
        role: 'user',
        parts: toolResponseParts,
      });
    }

    // Nếu sau vòng lặp vẫn chưa có replyText (fallback)
    if (!replyText.trim()) {
      replyText =
        'Dạ, Bếp Trưởng Vị Việt rất vui được đón tiếp bạn! Bếp đã tìm được một số món ăn truyền thống đặc sắc gửi đến bạn bên dưới nhé.';
    }

    // Chuẩn hóa định dạng [DISH:id] luôn nằm trên dòng riêng biệt, không chèn giữa câu văn
    replyText = replyText.replace(/([^\n])\s*\[DISH:(\d+)\]/g, '$1\n\n[DISH:$2]\n\n');
    replyText = replyText.replace(/\[DISH:(\d+)\]\s*([^\n])/g, '[DISH:$1]\n\n$2');
    replyText = replyText.replace(/\n{3,}/g, '\n\n').trim();

    // Trích xuất các dish ID xuất hiện trong replyText dạng [DISH:id]
    const extractedDishIds: string[] = [];
    const dishRegex = /\[DISH:(\d+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = dishRegex.exec(replyText)) !== null) {
      if (!extractedDishIds.includes(match[1])) {
        extractedDishIds.push(match[1]);
      }
    }

    // Nếu Gemini không chèn [DISH:id], tự động đối chiếu tên món trong gatheredDishes
    if (extractedDishIds.length === 0) {
      for (const [id, dish] of gatheredDishes.entries()) {
        if (replyText.toLowerCase().includes(dish.name.toLowerCase())) {
          extractedDishIds.push(id);
          replyText += `\n[DISH:${id}]`;
        }
      }
    }

    // Nếu vẫn chưa có món nào khớp nhưng có gatheredDishes, chọn tối đa 2 món phù hợp
    if (extractedDishIds.length === 0 && gatheredDishes.size > 0) {
      for (const id of Array.from(gatheredDishes.keys()).slice(0, 2)) {
        extractedDishIds.push(id);
        replyText += `\n[DISH:${id}]`;
      }
    }

    // Bổ sung thông tin nếu có món chưa nằm trong gatheredDishes
    const missingIds = extractedDishIds.filter((id) => !gatheredDishes.has(id));
    if (missingIds.length > 0) {
      const details = await this.aiToolsService.getDishDetails(missingIds);
      for (const d of details) {
        gatheredDishes.set(d.id, {
          id: d.id,
          name: d.name,
          slug: d.slug,
          description: d.description,
          spicy_level: d.spicy_level,
          startingPrice: d.variants?.[0]?.price ?? 0,
          coverUrl: d.images?.[0] ?? null,
          categoryName: d.category,
          tags: [],
          ingredients: d.ingredients,
        });
      }
    }

    // Tạo danh sách RecommendationCard theo đúng thứ tự xuất hiện trong text
    const recommendations: RecommendationCard[] = [];
    let rank = 1;

    for (const id of extractedDishIds) {
      const dish = gatheredDishes.get(id);
      if (dish) {
        recommendations.push({
          dishId: dish.id,
          dishName: dish.name,
          slug: dish.slug,
          coverUrl: dish.coverUrl,
          startingPrice: dish.startingPrice,
          availability: 'AVAILABLE',
          reason:
            dish.description ||
            `Món ngon đặc sản Vị Việt ${dish.categoryName ? 'thuộc nhóm ' + dish.categoryName : ''}`,
          rankPosition: rank++,
        });
      }
    }

    return {
      replyText,
      recommendations,
      warnings,
      modelName: this.modelName,
    };
  }

  private async callGeminiApi(payload: any): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        this.logger.error(`Gemini API Error (${res.status}): ${JSON.stringify(errJson)}`);
        throw new Error(
          errJson?.error?.message || `Lỗi gọi Gemini API (HTTP ${res.status})`,
        );
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Yêu cầu AI tư vấn ẩm thực đã quá thời gian chờ (Timeout).');
      }
      throw err;
    }
  }
}
