"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Star, RefreshCw, MessageSquare, EyeOff, Eye, CheckCircle2, AlertCircle, X, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reviewsApi, ReviewItem } from "@/features/reviews/api/reviews.api";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "VISIBLE" | "HIDDEN">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewsApi.getAdminReviews({ limit: 100 });
      setReviews(res.items);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      showToast("error", "Không thể tải danh sách đánh giá từ cơ sở dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleHide = async (r: ReviewItem) => {
    const isCurrentlyVisible = r.visibility === "VISIBLE" || r.status === "PUBLISHED";
    const nextVisibility = isCurrentlyVisible ? "HIDDEN" : "VISIBLE";
    const actionText = nextVisibility === "HIDDEN" ? "ẩn đánh giá" : "hiển thị lại đánh giá";

    try {
      await reviewsApi.moderateReview(r.id, { visibility: nextVisibility });
      setReviews((prev) =>
        prev.map((item) =>
          item.id === r.id ? { ...item, visibility: nextVisibility, status: nextVisibility } : item
        )
      );
      showToast("success", `Đã ${actionText} thành công!`);
    } catch (err: any) {
      console.error("Failed to moderate review:", err);
      showToast("error", err?.message || "Không thể cập nhật trạng thái đánh giá.");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;
    if (!replyText.trim()) {
      showToast("error", "Vui lòng nhập nội dung phản hồi.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      await reviewsApi.moderateReview(replyingReview.id, {
        reply: replyText.trim(),
      });
      setReviews((prev) =>
        prev.map((item) =>
          item.id === replyingReview.id
            ? { ...item, reply: replyText.trim(), replied_at: new Date().toISOString() }
            : item
        )
      );
      showToast("success", "Đã gửi phản hồi từ nhà hàng thành công!");
      setReplyingReview(null);
      setReplyText("");
    } catch (err: any) {
      console.error("Failed to send review reply:", err);
      showToast("error", err?.message || "Lỗi khi gửi phản hồi.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== "ALL" && r.rating !== ratingFilter) return false;
    const isVisible = r.visibility === "VISIBLE" || r.status === "PUBLISHED";
    if (visibilityFilter === "VISIBLE" && !isVisible) return false;
    if (visibilityFilter === "HIDDEN" && isVisible) return false;
    return true;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <>
      <AdminHeader
        title="Quản lý Đánh giá & Phản hồi Thực khách"
        subtitle="Theo dõi cảm nhận của thực khách, kiểm duyệt nội dung và gửi lời tri ân từ Bếp Mẹ Vị Việt"
        action={
          <Button variant="outline" size="sm" onClick={loadReviews} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {toastMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Overview Banner & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-7 h-7 fill-amber-500" />
            </div>
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Điểm hài lòng</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-ink">{averageRating}</span>
                <span className="text-xs text-ink-muted">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-ink-muted uppercase font-bold">Tổng đánh giá</span>
              <h3 className="text-2xl font-bold text-ink mt-0.5">{reviews.length}</h3>
            </div>
          </div>

          <div className="md:col-span-2 bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-center gap-2">
            <span className="text-xs text-ink-muted uppercase font-bold">Bộ lọc số sao</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setRatingFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  ratingFilter === "ALL"
                    ? "bg-brand-red text-white"
                    : "bg-surface border border-border text-ink-muted hover:text-ink"
                }`}
              >
                Tất cả ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingFilter(star)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    ratingFilter === star
                      ? "bg-amber-500 text-white"
                      : "bg-surface border border-border text-ink-muted hover:text-ink"
                  }`}
                >
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-[10px] opacity-80">
                    ({reviews.filter((r) => r.rating === star).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List Card */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-turmeric fill-turmeric" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Đánh giá từ khách hàng ({filteredReviews.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibilityFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  visibilityFilter === "ALL" ? "bg-brand-red text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setVisibilityFilter("VISIBLE")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  visibilityFilter === "VISIBLE" ? "bg-brand-red text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                Hiển thị
              </button>
              <button
                onClick={() => setVisibilityFilter("HIDDEN")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  visibilityFilter === "HIDDEN" ? "bg-brand-red text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                Đã ẩn
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              Đang tải danh sách đánh giá từ cơ sở dữ liệu...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              Không có đánh giá nào phù hợp với bộ lọc hiện tại
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((r) => {
                const isVisible = r.visibility === "VISIBLE" || r.status === "PUBLISHED";
                return (
                  <div
                    key={r.id}
                    className={`border border-border rounded-xl p-5 transition-all space-y-3 ${
                      isVisible ? "bg-surface-hover/20" : "bg-zinc-100/60 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-turmeric/10 text-turmeric font-bold text-sm flex items-center justify-center shrink-0">
                          {r.user_name?.charAt(0) || r.author_display_name?.charAt(0) || "K"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-ink">
                              {r.user_name || r.author_display_name || "Thực khách Vị Việt"}
                            </span>
                            <Badge variant={isVisible ? "success" : "neutral"} size="sm">
                              {isVisible ? "Đang hiển thị" : "Đã ẩn"}
                            </Badge>
                          </div>
                          {r.dish_name && (
                            <div className="flex items-center gap-1 text-xs text-brand-red font-medium mt-0.5">
                              <Utensils className="w-3.5 h-3.5" />
                              <span>{r.dish_name}</span>
                              {r.variant_name && <span className="text-ink-muted">({r.variant_name})</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < r.rating ? "fill-amber-500 text-amber-500" : "text-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-ink leading-relaxed">
                      {r.content || r.comment || "Khách hàng không để lại nhận xét bằng chữ."}
                    </p>

                    {/* Phản hồi từ Quán nếu có */}
                    {r.reply && (
                      <div className="p-3 bg-cream/70 border border-turmeric/30 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-red">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Phản hồi từ Bếp Mẹ Vị Việt:</span>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed pl-5">{r.reply}</p>
                        {r.replied_at && (
                          <div className="text-[10px] text-ink-muted pl-5 pt-0.5">
                            {new Date(r.replied_at).toLocaleString("vi-VN")}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 text-[11px] text-ink-muted border-t border-border">
                      <span>{new Date(r.created_at).toLocaleString("vi-VN")}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReview(r);
                            setReplyText(r.reply || "");
                          }}
                          className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{r.reply ? "Sửa phản hồi" : "Phản hồi"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHide(r)}
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            isVisible ? "text-ink-muted hover:text-red-600" : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Ẩn đi
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Hiển thị
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Phản Hồi Đánh Giá */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-base text-ink">Phản Hồi Đánh Giá Của Khách Hàng</h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-surface-hover/50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-ink">
                {replyingReview.user_name || replyingReview.author_display_name || "Thực khách"}:
              </span>
              <p className="text-ink-muted italic">
                &ldquo;{replyingReview.content || replyingReview.comment}&rdquo;
              </p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Nội dung phản hồi từ Nhà hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Cảm ơn bạn đã thưởng thức và góp ý cho món ăn của Vị Việt..."
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-brand-red resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingReview(null)}
                  disabled={isSubmittingReply}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmittingReply}>
                  {isSubmittingReply ? "Đang gửi..." : "Gửi phản hồi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
