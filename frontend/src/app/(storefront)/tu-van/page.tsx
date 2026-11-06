"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Bot, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { CatalogDish } from "@/features/catalog/types";
import { formatVND } from "@/lib/utils/currency";

interface Message {
  sender: "ai" | "user";
  text: string;
  recommendedDishes?: CatalogDish[];
}

export default function AiAdvisorPage() {
  const [dishes, setDishes] = useState<CatalogDish[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Dạ Bếp Mẹ Vị Việt xin chào con! Hôm nay tiết trời thế nào, con muốn ăn món thanh đạm, ấm bụng hay đang cần bồi bổ sức khoẻ để mẹ gợi ý cho con một bữa thật ngon miệng nhé?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    async function loadDishes() {
      try {
        const list = await catalogApi.getDishes({ limit: 50 });
        setDishes(list);
      } catch (err) {
        console.error("Failed to load catalog for AI advisor:", err);
      }
    }
    loadDishes();
  }, []);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal;
    setInputVal("");

    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsThinking(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      // Tìm các món ăn phù hợp với khẩu vị người dùng yêu cầu
      const matched = dishes.filter((d) => {
        const dName = d.name.toLowerCase();
        const dDesc = (d.description || "").toLowerCase();
        return (
          dName.includes(lower) ||
          dDesc.includes(lower) ||
          (lower.includes("phở") && dName.includes("phở")) ||
          (lower.includes("bún") && dName.includes("bún")) ||
          (lower.includes("cơm") && dName.includes("cơm")) ||
          (lower.includes("thanh đạm") && (dName.includes("sen") || dDesc.includes("thanh"))) ||
          (lower.includes("nước") && (dName.includes("phở") || dName.includes("bún"))) ||
          (lower.includes("uống") && dName.includes("trà"))
        );
      });

      const selected = matched.length > 0 ? matched.slice(0, 2) : dishes.slice(0, 2);

      let replyText = `Mẹ nghe con dặn rồi! `;
      if (selected.length > 0) {
        replyText += `Với mong muốn của con hôm nay, Bếp Mẹ gợi ý ngay món "${selected[0].name}" nấu từ nguyên liệu tươi mới trong ngày, ăn vừa ấm lòng vừa bổ dưỡng. Con xem thử nhé:`;
      } else {
        replyText += `Mẹ mời con ghé qua xem thực đơn hôm nay, có rất nhiều món canh nóng và cơm dẻo chuẩn vị quê nhà đang chờ con!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: replyText,
          recommendedDishes: selected,
        },
      ]);
      setIsThinking(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-3 border-b border-border pb-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-cream border border-turmeric/40 flex items-center justify-center text-turmeric shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-ink">AI Bếp Mẹ - Tư Vấn Khẩu Vị Ẩm Thực</h1>
          <p className="text-xs text-ink-muted">Gợi ý món ăn truyền thống kết nối cơ sở dữ liệu thực đơn thực tế</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-surface border border-border rounded-2xl">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.sender === "user" ? "bg-brand-red text-cream" : "bg-cream text-turmeric border border-turmeric/30"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-3 max-w-[80%]">
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.sender === "user"
                    ? "bg-brand-red text-cream rounded-tr-xs"
                    : "bg-surface-hover text-ink rounded-tl-xs border border-border"
                }`}
              >
                {m.text}
              </div>

              {/* Recommended Dish Cards */}
              {m.recommendedDishes && m.recommendedDishes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {m.recommendedDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="p-3 bg-surface border border-border rounded-xl shadow-xs hover:border-brand-red transition-colors flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-hover shrink-0">
                        {dish.image_url ? (
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-muted">
                            Món
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-ink truncate">{dish.name}</h4>
                        <span className="font-mono text-brand-red text-xs font-semibold block">
                          {formatVND(dish.base_price)}
                        </span>
                        <Link
                          href={`/mon/${dish.slug}`}
                          className="text-[11px] text-primary font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <span>Xem món</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-ink-muted italic pl-11">
            <span className="w-2 h-2 rounded-full bg-turmeric animate-bounce" />
            <span>Bếp Mẹ đang suy nghĩ và chọn món phù hợp nhất cho con...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Hỏi Bếp Mẹ (VD: Hôm nay hơi mệt muốn ăn món gì nhẹ bụng, ít dầu mỡ?)..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-11 px-4 text-xs sm:text-sm bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
        <Button variant="primary" size="md" onClick={handleSend} className="h-11 px-5" disabled={isThinking}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
