import { httpClient } from "@/lib/http/client";
import {
  AiConversation,
  AIReply,
  AiMessage,
  RecommendationCard,
  TrackInteractionPayload,
} from "../types";

const GUEST_AI_TOKEN_KEY = "viviet_ai_guest_token";

function getGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_AI_TOKEN_KEY);
}

function setGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_AI_TOKEN_KEY, token);
}

export const aiApi = {
  /**
   * Tạo cuộc trò chuyện mới với AI Bếp Trưởng Vị Việt (API-86)
   */
  async createConversation(title?: string): Promise<AiConversation> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};
    if (guestToken) {
      headers["x-guest-token"] = guestToken;
    }

    const res = await httpClient.post<any>("/ai/conversations", { title }, { headers });
    const data = res?.data || res;

    if (data?.guestToken) {
      setGuestToken(data.guestToken);
    }

    return {
      id: data.id ? data.id.toString() : "",
      title: data.title,
      guestToken: data.guestToken,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  },

  /**
   * Lấy tin nhắn và dữ liệu cuộc trò chuyện (API-87)
   */
  async getConversation(
    id: string,
    params?: { beforeId?: string; limit?: number },
  ): Promise<{ conversation: AiConversation; messages: AiMessage[] }> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};
    if (guestToken) {
      headers["x-guest-token"] = guestToken;
    }

    const res = await httpClient.get<any>(`/ai/conversations/${id}`, {
      params,
      headers,
    });
    const data = res?.data || res;

    return {
      conversation: {
        id: data.conversation?.id || id,
        title: data.conversation?.title,
        createdAt: data.conversation?.createdAt,
        expiresAt: data.conversation?.expiresAt,
      },
      messages: (data.messages || []).map((m: any) => ({
        id: m.id?.toString() || "",
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || "",
        createdAt: m.createdAt || new Date().toISOString(),
        recommendations: m.recommendations || [],
      })),
    };
  },

  /**
   * Gửi tin nhắn tới AI và nhận tư vấn ẩm thực kèm món ăn gợi ý (API-88)
   */
  async sendMessage(
    conversationId: string,
    content: string,
    requestKey?: string,
  ): Promise<AIReply> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};
    if (guestToken) {
      headers["x-guest-token"] = guestToken;
    }

    const res = await httpClient.post<any>(
      `/ai/conversations/${conversationId}/messages`,
      { content, requestKey },
      { headers },
    );
    const data = res?.data || res;

    return {
      conversationId: data.conversationId?.toString() || conversationId,
      userMessageId: data.userMessageId?.toString() || "",
      assistantMessageId: data.assistantMessageId?.toString() || "",
      content: data.content || "",
      recommendations: data.recommendations || [],
      warnings: data.warnings || [],
    };
  },

  /**
   * Xóa mềm cuộc hội thoại (API-89)
   */
  async deleteConversation(id: string): Promise<void> {
    const guestToken = getGuestToken();
    const headers: Record<string, string> = {};
    if (guestToken) {
      headers["x-guest-token"] = guestToken;
    }
    await httpClient.delete(`/ai/conversations/${id}`, { headers });
  },

  /**
   * Lấy danh sách món gợi ý cá nhân hóa hoặc phổ biến (API-90)
   */
  async getRecommendations(limit: number = 6): Promise<{
    mode: "PERSONALIZED" | "POPULAR";
    items: RecommendationCard[];
  }> {
    const res = await httpClient.get<any>("/recommendations", {
      params: { limit },
    });
    const data = res?.data || res;
    return {
      mode: data?.mode || "POPULAR",
      items: data?.items || [],
    };
  },

  /**
   * Ghi nhận tương tác của khách hàng (API-91)
   */
  async trackInteraction(payload: TrackInteractionPayload): Promise<void> {
    try {
      await httpClient.post("/me/interactions", payload);
    } catch {
      // Bỏ qua lỗi theo dõi để không làm gián đoạn trải nghiệm người dùng
    }
  },
};
