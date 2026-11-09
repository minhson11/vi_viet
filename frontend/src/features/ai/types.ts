export interface RecommendationCard {
  id?: string;
  dishId: string;
  dishName: string;
  slug: string;
  coverUrl: string | null;
  startingPrice: number;
  availability: string;
  reason: string;
  rankPosition: number;
  expiresAt?: string | null;
  proposedSelection?: {
    variantId?: string;
    quantity?: number;
    optionValueIds?: string[];
  };
}

export interface AIReply {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  content: string;
  recommendations: RecommendationCard[];
  warnings: string[];
}

export interface AiConversation {
  id: string;
  title?: string;
  guestToken?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  recommendations?: RecommendationCard[];
}

export interface TrackInteractionPayload {
  dishId: string;
  recommendationId?: string;
  eventType: "VIEW" | "CLICK_RECOMMENDATION" | "ADD_TO_CART";
  eventKey: string;
  occurredAt?: string;
}
