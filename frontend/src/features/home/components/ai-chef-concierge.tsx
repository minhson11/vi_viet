"use client";

import React, { useEffect, useState } from "react";
import { Utensils, ArrowRight, Send } from "lucide-react";
import { ChatMessage } from "../types";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { CatalogDish } from "@/features/catalog/types";
import { formatVND } from "@/lib/utils/currency";

export const AiChefConcierge: React.FC = () => {
  const [inputVal, setInputVal] = useState("");
  const [dishes, setDishes] = useState<CatalogDish[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Kính chào Quý khách! Quý khách đang tìm kiếm phong vị nhẹ nhàng cho bữa tối sum họp, hay một lộ trình Tasting Menu tiếp đãi đối tác?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const list = await catalogApi.getDishes({ limit: 50 });
        setDishes(list);
      } catch (err) {
        console.error("Failed to load dishes for AI Concierge:", err);
      }
    }
    loadCatalog();
  }, []);

  const handleSend = (text?: string) => {
    const query = (text || inputVal).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      // Lựa chọn món ăn từ database thực tế
      const matched = dishes.filter((d) => {
        const dName = d.name.toLowerCase();
        const dDesc = (d.description || "").toLowerCase();
        return dName.includes(lower) || dDesc.includes(lower);
      });

      const featuredDishes = matched.length >= 2 ? matched : dishes.slice(0, 3);
      const dish1 = featuredDishes[0]?.name || "Phở bò tái lăn gia truyền";
      const dish1Price = featuredDishes[0]?.base_price ? formatVND(featuredDishes[0].base_price) : "";
      const dish2 = featuredDishes[1]?.name || "Bún chả Hà Nội nướng than hoa";
      const dish2Price = featuredDishes[1]?.base_price ? formatVND(featuredDishes[1].base_price) : "";

      let botResponse = `Bếp trưởng Vị Việt đề xuất: Đối với yêu cầu "${query}", thực đơn nên khởi đầu bằng ${dish2} (${dish2Price}) ngát hương, tiếp nối bởi ${dish1} (${dish1Price}) thố nóng chuẩn vị.`;

      if (query.toLowerCase().includes("vip") || query.toLowerCase().includes("quốc tế")) {
        botResponse = `Bếp trưởng Vị Việt đề xuất cho tiệc VIP: Khởi vị với ${dish2} (${dish2Price}), món chính ${dish1} (${dish1Price}) thanh ngọt chuẩn phong vị di sản.`;
      } else if (query.toLowerCase().includes("gia đình") || query.toLowerCase().includes("ấm cúng")) {
        botResponse = `Bếp trưởng Vị Việt đề xuất cho tiệc gia đình: Kết hợp ${dish1} (${dish1Price}) và ${dish2} (${dish2Price}) quây quần ấm cúng, phù hợp cho cả người lớn tuổi lẫn trẻ nhỏ.`;
      }

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: botResponse,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <section id="ai-chef" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Cột Trái: Giới thiệu & Gợi ý nhanh */}
        <div className="lg:col-span-5 text-left">
          <span className="text-xs uppercase tracking-widest font-bold text-secondary block mb-2">
            Gastronomic AI Concierge
          </span>
          <h2 className="font-headline text-3xl sm:text-5xl font-bold text-[#1c1917] mb-4">
            Tìm Vị Theo Cảm Xúc <br />
            <span className="text-primary italic font-normal">
              &amp; Khẩu Vị Của Bạn
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#5a413d] leading-relaxed mb-6 font-normal">
            Được huấn luyện dựa trên triết lý cân bằng Âm Dương Ngũ Hành và kho
            tàng ẩm thực ba miền. Bếp trưởng AI sẵn sàng thiết kế riêng hành
            trình thưởng vị hoàn hảo cho buổi tiệc của bạn từ các món trong thực đơn thực tế.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() =>
                handleSend("Tiệc gia đình 4 người ấm cúng, hài hòa thế hệ")
              }
              className="cursor-pointer text-left p-3.5 rounded-xl bg-[#fff8f6] hover:bg-[#fff1eb] text-xs font-semibold border border-[#e2beba]/50 flex justify-between items-center transition-all group"
            >
              <span className="text-[#1c1917] group-hover:text-primary transition-colors">
                “Tiệc gia đình 4 người ấm cúng, hài hòa thế hệ”
              </span>
              <ArrowRight className="w-4 h-4 text-primary shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() =>
                handleSend("Set menu tiếp khách VIP quốc tế đậm đà bản sắc")
              }
              className="cursor-pointer text-left p-3.5 rounded-xl bg-[#fff8f6] hover:bg-[#fff1eb] text-xs font-semibold border border-[#e2beba]/50 flex justify-between items-center transition-all group"
            >
              <span className="text-[#1c1917] group-hover:text-primary transition-colors">
                “Set menu tiếp khách VIP quốc tế đậm đà bản sắc”
              </span>
              <ArrowRight className="w-4 h-4 text-primary shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Cột Phải: Chat Widget */}
        <div className="lg:col-span-7 bg-[#fff8f6] p-6 sm:p-8 rounded-3xl border border-[#e2beba]/60 shadow-lg">
          <div className="flex items-center gap-3 pb-4 border-b border-[#e2beba]/40 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="font-headline font-bold text-sm text-[#1c1917] block">
                Bếp Trưởng Ảo Vị Việt
              </span>
              <span className="text-[11px] text-secondary font-medium">
                Kết nối thực đơn trực tiếp từ Bếp Mẹ
              </span>
            </div>
          </div>

          <div
            id="ai-chat-thread"
            className="min-h-[220px] max-h-[340px] overflow-y-auto flex flex-col gap-3 mb-4 text-xs pr-1"
          >
            {messages.map((m) =>
              m.sender === "user" ? (
                <div
                  key={m.id}
                  className="p-3 bg-primary text-white rounded-2xl self-end max-w-xs ml-auto shadow-xs"
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={m.id}
                  className="p-3.5 bg-white rounded-2xl border border-[#e2beba]/40 max-w-md shadow-xs text-[#1c1917] leading-relaxed"
                >
                  {m.text}
                </div>
              )
            )}
            {isTyping && (
              <div className="p-3 bg-white/70 rounded-2xl border border-[#e2beba]/30 max-w-[120px] text-[11px] text-[#5a413d] italic animate-pulse">
                Bếp trưởng đang suy nghĩ...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập khẩu vị hoặc yêu cầu tiệc..."
              className="w-full text-xs px-4 py-3 rounded-full border border-[#e2beba] focus:outline-none focus:border-primary bg-white text-[#1c1917]"
            />
            <button
              type="submit"
              className="cursor-pointer px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
