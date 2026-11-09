"use client";

import React, { useState } from "react";
import { Sparkles, Utensils, MessageSquare, Star, Compass, Leaf } from "lucide-react";
import { Dish } from "@/features/admin-catalog/types";
import { ReviewItem } from "@/features/reviews/api/reviews.api";

const GENERAL_TASTING_NOTES = [
  "Thưởng thức ngay sau khi nhận món để cảm nhận trọn vẹn hương vị và độ tươi ngon nhất.",
  "Dùng kèm các phần nước chấm, đồ chua và rau thơm được Bếp Vị Việt chuẩn bị đồng bộ theo từng món.",
  "Bạn có thể ghi chú khẩu vị riêng (độ cay, gia vị, dị ứng) cho đầu bếp ngay tại phần dặn dò trước khi đặt món.",
];

interface DishStoryTabsProps {
  dish: Dish;
  reviews: ReviewItem[];
}

export function DishStoryTabs({ dish, reviews }: DishStoryTabsProps) {
  const [activeTab, setActiveTab] = useState<"story" | "ingredients" | "reviews">("story");

  return (
    <div id="dish-tabs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
      <div className="border-t border-border/70 pt-10">
        {/* Navigation Thanh Tab */}
        <div className="flex items-center gap-3 sm:gap-6 border-b border-border/80 pb-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("story")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider pb-2 relative transition-colors shrink-0 cursor-pointer ${
              activeTab === "story" ? "text-primary font-black" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Câu Chuyện Mỹ Vị</span>
            {activeTab === "story" && (
              <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ingredients")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider pb-2 relative transition-colors shrink-0 cursor-pointer ${
              activeTab === "ingredients" ? "text-primary font-black" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Nguyên Liệu Tinh Tuyển</span>
            {activeTab === "ingredients" && (
              <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider pb-2 relative transition-colors shrink-0 cursor-pointer ${
              activeTab === "reviews" ? "text-primary font-black" : "text-ink-muted hover:text-ink"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Đánh Giá Thực Khách ({reviews.length})</span>
            {activeTab === "reviews" && (
              <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* ================= NỘI DUNG TỪNG TAB ================= */}
        <div className="pt-6">
          {/* Tab 1: Câu chuyện di sản */}
          {activeTab === "story" && (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
              <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Ký ức ẩm thực di sản ba miền</span>
                </div>
                <h3 className="font-headline text-2xl sm:text-3xl font-black text-ink">
                  {dish.name} · Tinh Hoa Ẩm Thực Truyền Thống
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed whitespace-pre-line">
                  {dish.story ||
                    dish.description ||
                    "Mỗi món ăn tại Vị Việt là một chuyến hành trình tìm về cội nguồn hương vị. Từng thớ thịt, muỗng nước dùng hay nhánh rau thơm đều được Bếp Vị Việt chắt lọc từ những sản vật tinh túy nhất của đất trời quê hương."}
                </p>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-ink-muted">
                  <span className="font-bold text-ink">Công thức chuẩn vị: Nghệ Nhân Bếp Vị Việt</span>
                  <span className="italic">Gìn giữ phong vị Việt xưa</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Nguyên liệu tinh tuyển */}
          {activeTab === "ingredients" && (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
              <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border/80 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Nguồn gốc tự nhiên & an toàn</span>
                </div>
                <h3 className="font-headline text-2xl font-black text-ink">
                  Thành Phần & Quy Chuẩn Tuyển Chọn
                </h3>

                {dish.ingredients && dish.ingredients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {dish.ingredients.map((ing, iIdx) => (
                      <div
                        key={ing.id || iIdx}
                        className="p-3.5 rounded-2xl bg-surface-warm/60 border border-border flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-bold text-ink">{ing.name}</span>
                        {ing.note && (
                          <span className="text-[11px] text-ink-muted bg-white px-2 py-0.5 rounded-md border border-border/60">
                            {ing.note}
                          </span>
                        )}
                        {ing.is_allergen && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Lưu ý dị ứng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    Nguyên liệu được cung ứng tươi mới mỗi sáng từ các nông hộ và vùng đặc sản uy tín khắp Việt Nam, cam kết không chất bảo quản công nghiệp.
                  </p>
                )}

                {/* Dặn dò thưởng thức */}
                <div className="p-4 rounded-2xl bg-surface border border-border/60 space-y-2">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Gợi ý thưởng thức trọn vị:
                  </h4>
                  <ul className="text-xs text-ink-muted space-y-1.5 list-disc list-inside">
                    {GENERAL_TASTING_NOTES.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Đánh giá từ thực khách */}
          {activeTab === "reviews" && (
            <div className="pt-2 max-w-4xl space-y-4 animate-in fade-in duration-200">
              {reviews.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-surface border border-border/60 text-ink-muted space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-ink-light" />
                  <p className="text-sm font-semibold">Chưa có đánh giá nào cho món ăn này.</p>
                  <p className="text-xs">
                    Hãy là thực khách đầu tiên thưởng thức và chia sẻ cảm nhận vị giác!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-surface border border-border/70 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {(rev.author_display_name || rev.user_name || "K").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-ink block">
                              {rev.author_display_name || rev.user_name || "Thực khách sành ăn"}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        {/* Số sao */}
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.comment || rev.content ? (
                        <p className="text-xs text-ink leading-relaxed">
                          {rev.comment || rev.content}
                        </p>
                      ) : (
                        <p className="text-xs text-ink-muted italic">
                          (Thực khách đã chấm {rev.rating} sao và không để lại bình luận văn bản)
                        </p>
                      )}

                      {/* Ảnh thực tế của món ăn do khách hàng chụp */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {rev.images.map((imgUrl, imgIdx) => (
                            <a
                              key={imgIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="relative w-16 h-16 rounded-xl overflow-hidden border border-border hover:opacity-85 transition-opacity shadow-2xs group"
                              title="Bấm để xem ảnh thực tế phóng to"
                            >
                              <img
                                src={imgUrl}
                                alt={`Ảnh thực tế món ăn ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Phản hồi từ Bếp Vị Việt nếu có */}
                      {rev.reply && (
                        <div className="mt-2.5 p-3 rounded-xl bg-surface-warm/60 border border-primary/20 text-xs space-y-1">
                          <span className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                            <Sparkles className="w-3 h-3 text-gold" />
                            Phản hồi từ Bếp Vị Việt:
                          </span>
                          <p className="text-ink-muted text-[11px] leading-relaxed">
                            {rev.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
