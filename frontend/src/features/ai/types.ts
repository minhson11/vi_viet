export interface RecommendationItem {
  dish_id: string;
  name: string;
  score: number;
  reason: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

