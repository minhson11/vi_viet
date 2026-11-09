"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send,
  User,
  ArrowRight,
  Plus,
  RotateCcw,
  Check,
  Utensils,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "../api/ai.api";
import { AiMessage, RecommendationCard } from "../types";
import { cartApi } from "@/features/cart/api/cart.api";
import { formatVND } from "@/lib/utils/currency";

const SESSION_CONV_KEY = "viviet_floating_ai_conv_id";

const SUGGESTED_PROMPTS = [
  "Bữa trưa thanh đạm, ít dầu mỡ",
  "Gợi ý mâm cơm tối gia đình 4 người",
  "Món nước ấm bụng, không ăn cay",
  "Món chay truyền thống bổ dưỡng",
];

function InlineDishCard({
  dish,
  isAdded,
  onAddToCart,
  onViewDish,
}: {
  dish: RecommendationCard;
  isAdded: boolean;
  onAddToCart: () => void;
  onViewDish: () => void;
}) {
  return (
    <div className="p-2.5 bg-surface border border-turmeric/40 rounded-xl shadow-xs hover:border-brand-red/60 transition-all flex flex-col justify-between gap-2 group my-2">
      <div className="flex items-start gap-2.5">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-hover shrink-0 border border-border">
          {dish.coverUrl ? (
            <img
              src={dish.coverUrl}
              alt={dish.dishName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-muted">
              Vị Việt
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <h4 className="font-bold text-xs text-ink truncate group-hover:text-brand-red transition-colors">
              {dish.dishName}
            </h4>
            <span className="font-mono text-brand-red text-[11px] font-semibold shrink-0">
              {formatVND(dish.startingPrice)}
            </span>
          </div>
          <p className="text-[10.5px] text-ink-muted line-clamp-2 mt-0.5 leading-snug">
            {dish.reason}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-[11px]">
        <Link
          href={`/mon/${dish.slug}`}
          onClick={onViewDish}
          className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 text-[11px]"
        >
          <span>Chi tiết</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        <Button
          size="sm"
          variant={isAdded ? "outline" : "primary"}
          onClick={onAddToCart}
          className="h-6 px-2 text-[10.5px] gap-1"
        >
          {isAdded ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Đã chọn</span>
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Thêm giỏ</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function renderMessageContent(
  content: string,
  recommendations: RecommendationCard[] = [],
  addedDishIds: Set<string>,
  onAddToCart: (dish: RecommendationCard) => void,
  onViewDish: (dish: RecommendationCard) => void,
) {
  const parts = content.split(/(\[DISH:\d+\])/g);
  const recMap = new Map(recommendations.map((r) => [r.dishId, r]));
  const renderedDishIds = new Set<string>();

  const elements = parts.map((part, index) => {
    const match = part.match(/^\[DISH:(\d+)\]$/);
    if (match) {
      const dishId = match[1];
      const dish = recMap.get(dishId);
      if (dish) {
        renderedDishIds.add(dishId);
        return (
          <div key={`inline-rec-${dishId}-${index}`} className="my-2">
            <InlineDishCard
              dish={dish}
              isAdded={addedDishIds.has(dish.dishId)}
              onAddToCart={() => onAddToCart(dish)}
              onViewDish={() => onViewDish(dish)}
            />
          </div>
        );
      }
      return null;
    }

    const trimmed = part.trim();
    if (!trimmed) return null;

    return (
      <div key={`text-part-${index}`} className="whitespace-pre-wrap leading-relaxed text-ink text-xs">
        {trimmed}
      </div>
    );
  });

  const remainingRecs = recommendations.filter(
    (r) => !renderedDishIds.has(r.dishId),
  );

  return (
    <div className="space-y-1.5">
      {elements}
      {remainingRecs.length > 0 && (
        <div className="space-y-2 pt-1.5">
          {remainingRecs.map((dish) => (
            <InlineDishCard
              key={`remain-rec-${dish.dishId}`}
              dish={dish}
              isAdded={addedDishIds.has(dish.dishId)}
              onAddToCart={() => onAddToCart(dish)}
              onViewDish={() => onViewDish(dish)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FloatingAiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Dạ Bếp Trưởng Vị Việt xin kính chào quý khách! Bếp luôn sẵn sàng tư vấn khẩu vị, độ cay và gợi ý món ăn chuẩn vị truyền thống cho bạn hôm nay nhé.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addedDishIds, setAddedDishIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTeaser(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isThinking]);

  // Lắng nghe sự kiện mở chat từ Header / Hero / Footer hoặc tham số URL
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setShowTeaser(false);
    };

    window.addEventListener("open-ai-chat", handleOpenChat);

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("open_chat") === "true" || window.location.hash === "#chat") {
        handleOpenChat();
      }
    }

    return () => {
      window.removeEventListener("open-ai-chat", handleOpenChat);
    };
  }, []);

  // Khôi phục hội thoại từ sessionStorage nếu có
  useEffect(() => {
    async function restoreConversation() {
      const savedConvId = sessionStorage.getItem(SESSION_CONV_KEY);
      if (!savedConvId) return;

      try {
        const res = await aiApi.getConversation(savedConvId);
        if (res.messages && res.messages.length > 0) {
          setConversationId(savedConvId);
          setMessages(res.messages);
        }
      } catch {
        sessionStorage.removeItem(SESSION_CONV_KEY);
      }
    }

    restoreConversation();
  }, []);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartNewConversation = async () => {
    setConversationId(null);
    sessionStorage.removeItem(SESSION_CONV_KEY);
    setErrorMessage(null);
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Dạ Bếp Trưởng Vị Việt xin chào quý khách! Bếp đã sẵn sàng cho một cuộc tư vấn ẩm thực mới. Bạn muốn tìm món gì hôm nay ạ?",
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSendPrompt = async (promptText: string) => {
    const textToSend = promptText.trim();
    if (!textToSend || isThinking) return;

    setInputVal("");
    setErrorMessage(null);

    const tempUserMsgId = "user-" + Date.now();
    const newUserMsg: AiMessage = {
      id: tempUserMsgId,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsThinking(true);

    try {
      let activeConvId = conversationId;

      if (!activeConvId) {
        const newConv = await aiApi.createConversation(
          textToSend.slice(0, 40) + "...",
        );
        activeConvId = newConv.id;
        setConversationId(activeConvId);
        sessionStorage.setItem(SESSION_CONV_KEY, activeConvId);
      }

      const reply = await aiApi.sendMessage(activeConvId, textToSend);

      const assistantMsg: AiMessage = {
        id: reply.assistantMessageId || "ai-" + Date.now(),
        role: "assistant",
        content: reply.content,
        createdAt: new Date().toISOString(),
        recommendations: reply.recommendations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg =
        err?.message ||
        "Bếp Trưởng Vị Việt hiện đang tiếp nhận nhiều yêu cầu. Xin bạn vui lòng thử lại sau giây lát!";
      setErrorMessage(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: `Dạ Bếp xin lỗi, ${errMsg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAddToCart = async (dish: RecommendationCard) => {
    try {
      await cartApi.addToCart({
        dish_id: dish.dishId,
        dish_name: dish.dishName,
        dish_slug: dish.slug,
        dish_image: dish.coverUrl,
        unit_price: dish.startingPrice,
        quantity: 1,
      });

      setAddedDishIds((prev) => new Set(prev).add(dish.dishId));
      showToast(`Đã thêm "${dish.dishName}" vào giỏ!`);

      aiApi.trackInteraction({
        dishId: dish.dishId,
        recommendationId: dish.id,
        eventType: "ADD_TO_CART",
        eventKey: `add_cart_${dish.dishId}_${Date.now()}`,
      });
    } catch (err: any) {
      showToast(err?.message || "Không thể thêm món vào giỏ hàng.");
    }
  };

  const handleViewDish = (dish: RecommendationCard) => {
    aiApi.trackInteraction({
      dishId: dish.dishId,
      recommendationId: dish.id,
      eventType: "CLICK_RECOMMENDATION",
      eventKey: `click_rec_${dish.dishId}_${Date.now()}`,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-[60] bg-turmeric text-ink px-3.5 py-2 rounded-xl shadow-xl border border-turmeric/40 font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-brand-red" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] max-w-[calc(100vw-32px)] bg-surface border border-turmeric/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-cream via-surface to-cream border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-cream border border-turmeric/50 flex items-center justify-center p-1 shadow-xs overflow-hidden">
                  <img
                    src="/logo-emblem.svg"
                    alt="Bếp Trưởng Vị Việt"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-ink leading-tight">
                    Bếp Trưởng Vị Việt
                  </h3>
                </div>
                <p className="text-[10px] text-ink-muted">
                  Tư vấn ẩm thực chuẩn vị truyền thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleStartNewConversation}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
                title="Bắt đầu hội thoại mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-brand-red hover:bg-surface-hover transition-colors"
                title="Thu nhỏ đoạn chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Row */}
          <div className="px-3 py-2 bg-surface-hover/50 border-b border-border overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-ink-muted font-medium shrink-0 flex items-center gap-1">
              <Utensils className="w-2.5 h-2.5" /> Gợi ý:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendPrompt(prompt)}
                disabled={isThinking}
                className="text-[10px] text-ink-muted hover:text-brand-red hover:border-brand-red/40 bg-surface border border-border px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3.5 bg-surface">
            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                className={`flex items-start gap-2.5 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 overflow-hidden ${
                    m.role === "user"
                      ? "bg-brand-red text-cream"
                      : "bg-cream border border-turmeric/40 p-0.5"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <img
                      src="/logo-emblem.svg"
                      alt="Bếp Trưởng Vị Việt"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="space-y-1.5 max-w-[85%]">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      m.role === "user"
                        ? "bg-brand-red text-cream rounded-tr-xs font-medium whitespace-pre-wrap"
                        : "bg-surface-hover text-ink rounded-tl-xs border border-border"
                    }`}
                  >
                    {m.role === "user"
                      ? m.content
                      : renderMessageContent(
                          m.content,
                          m.recommendations,
                          addedDishIds,
                          handleAddToCart,
                          handleViewDish,
                        )}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-[11px] text-ink-muted italic pl-9 py-1.5">
                <span className="w-2 h-2 rounded-full bg-turmeric animate-pulse" />
                <span>Bếp Trưởng Vị Việt đang chọn món cho bạn...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-surface border-t border-border flex items-center gap-1.5 shrink-0">
            <input
              ref={inputRef}
              type="text"
              placeholder="Hỏi Bếp Trưởng (VD: Món gì thanh đạm cho trưa nay?)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPrompt(inputVal)}
              disabled={isThinking}
              className="flex-1 h-9 px-3 text-xs bg-surface-hover border border-border rounded-xl focus:outline-none focus:ring-1.5 focus:ring-brand-red disabled:opacity-60"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSendPrompt(inputVal)}
              className="h-9 px-3 shrink-0"
              disabled={isThinking || !inputVal.trim()}
              title="Gửi tin nhắn"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button (Icon góc dưới bên phải) */}
      {!isOpen && (
        <div className="flex items-center gap-2.5 group">
          {/* Teaser Bubble */}
          {showTeaser && (
            <div className="bg-surface border border-turmeric/40 shadow-xl px-3 py-1.5 rounded-full text-xs font-semibold text-ink flex items-center gap-1.5 animate-in fade-in slide-in-from-right-3 duration-300">
              <span className="text-brand-red">🍲</span>
              <span
                onClick={() => setIsOpen(true)}
                className="cursor-pointer hover:text-brand-red transition-colors"
              >
                Hỏi Bếp Trưởng tư vấn món!
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeaser(false);
                }}
                className="text-ink-muted hover:text-ink ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Main Floating Circle Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-full bg-cream border-2 border-turmeric/80 p-2 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-red/30 cursor-pointer flex items-center justify-center group"
            title="Mở đoạn chat tư vấn ẩm thực với Bếp Trưởng Vị Việt"
          >
            <img
              src="/logo-emblem.svg"
              alt="Bếp Trưởng Vị Việt"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200"
            />

            {/* Online Pulse Dot */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
