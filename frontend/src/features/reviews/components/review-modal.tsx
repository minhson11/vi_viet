"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Star, Upload, X, Loader2, ImagePlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { reviewsApi } from "../api/reviews.api";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: {
    id: string;
    dish_name: string;
    variant_name?: string;
    review?: {
      id?: string;
      rating: number;
      content: string | null;
      images?: string[];
    } | null;
  } | null;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Chưa ưng ý",
  3: "Bình thường / Tạm ổn",
  4: "Hài lòng / Ngon miệng",
  5: "Tuyệt vời! Rất ngon miệng",
};

export function ReviewModal({ isOpen, onClose, orderItem, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderItem) {
      if (orderItem.review) {
        setRating(orderItem.review.rating || 5);
        setContent(orderItem.review.content || "");
        setImages(Array.isArray(orderItem.review.images) ? orderItem.review.images : []);
      } else {
        setRating(5);
        setContent("");
        setImages([]);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [orderItem]);

  if (!orderItem) return null;

  const isEditing = Boolean(orderItem.review?.id);

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg("Bạn chỉ được tải lên tối đa 5 ảnh cho mỗi đánh giá.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    setErrorMsg(null);

    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
      // Validate client-side
      if (!file.type.match(/\/(jpg|jpeg|png|webp)$/)) {
        setErrorMsg("Định dạng file không hỗ trợ. Vui lòng chỉ tải ảnh JPG, PNG hoặc WebP.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`Ảnh ${file.name} vượt quá kích thước cho phép (tối đa 5MB).`);
        continue;
      }

      try {
        const res = await reviewsApi.uploadReviewImage(file);
        if (res && res.url) {
          uploadedUrls.push(res.url);
        }
      } catch (err: any) {
        console.error("Lỗi tải ảnh:", err);
        setErrorMsg(err.message || `Không thể tải ảnh ${file.name}.`);
      }
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
    setIsUploading(false);

    // Reset input để chọn lại file nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMsg("Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await reviewsApi.submitReview(orderItem.id, {
        rating,
        content: content.trim() || undefined,
        images,
      });

      setSuccessMsg(isEditing ? "Cập nhật đánh giá thành công!" : "Gửi đánh giá thành công! Cảm ơn bạn.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("Submit review error:", err);
      setErrorMsg(err.message || "Không thể lưu đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa đánh giá món ăn" : "Đánh giá chất lượng món ăn"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-ink">
        {/* Dish Info preview */}
        <div className="p-3.5 bg-surface-hover/70 rounded-xl border border-border flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-ink">{orderItem.dish_name}</h4>
            {orderItem.variant_name && (
              <p className="text-xs text-ink-muted mt-0.5">Khẩu phần: {orderItem.variant_name}</p>
            )}
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-full">
            Đã hoàn thành
          </span>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Star Rating Section */}
        <div className="space-y-2 text-center py-1">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
            Bạn cảm thấy món ăn như thế nào?
          </label>
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-115 focus:outline-hidden"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= currentDisplayRating
                      ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                      : "text-border hover:text-amber-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-brand-red h-4 transition-all">
            {RATING_LABELS[currentDisplayRating]}
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="review-content" className="font-semibold text-ink">
              Nhận xét chi tiết (tùy chọn)
            </label>
            <span className="text-[11px] text-ink-muted">{content.length}/2000</span>
          </div>
          <textarea
            id="review-content"
            rows={3}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ hương vị, độ nóng, cách nêm nếm hoặc cách đóng gói món ăn..."
            className="w-full text-xs p-3 rounded-xl border border-border bg-surface text-ink placeholder:text-ink-muted/60 focus:outline-hidden focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-ink flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-brand-red" />
              <span>Hình ảnh món ăn thực tế</span>
            </label>
            <span className="text-[11px] text-ink-muted">Tối đa 5 ảnh ({images.length}/5)</span>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-5 gap-2">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden border border-border bg-surface group"
              >
                <Image
                  src={url}
                  alt={`Ảnh món ăn ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-xs"
                  title="Gỡ ảnh"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add Image Button */}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-brand-red bg-surface-hover/50 hover:bg-brand-red/5 flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-brand-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-brand-red" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Tải ảnh</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleSelectFiles}
          />
          <p className="text-[10px] text-ink-muted italic">
            * Hỗ trợ định dạng JPG, PNG, WebP (dung lượng tối đa 5MB/ảnh).
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>{isEditing ? "Lưu thay đổi" : "Gửi đánh giá"}</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
