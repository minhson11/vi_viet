"use client";

import React, { useState, useRef } from "react";
import { DishImage } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminCatalogApi } from "../api/admin-catalog.api";
import {
  UploadCloud,
  Plus,
  Trash2,
  Star,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

interface DishImageUploaderProps {
  images: DishImage[];
  primaryImageUrl?: string | null;
  onChangeImages: (images: DishImage[]) => void;
  onSetPrimaryUrl: (url: string) => void;
}

export const DishImageUploader: React.FC<DishImageUploaderProps> = ({
  images,
  primaryImageUrl,
  onChangeImages,
  onSetPrimaryUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // URL fallback tab
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Xử lý upload danh sách file từ máy tính lên Cloudinary
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)
    );

    if (fileArray.length === 0) {
      setUploadError("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP tối đa 5MB)");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const newImages: DishImage[] = [];
    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress(`Đang tải ảnh ${i + 1}/${fileArray.length}: ${file.name}...`);

      try {
        const uploadRes = await adminCatalogApi.uploadImage(file, "dishes");
        if (uploadRes && (uploadRes.secure_url || uploadRes.url)) {
          const imgUrl = uploadRes.secure_url || uploadRes.url;
          const isFirstEver = images.length === 0 && newImages.length === 0;

          newImages.push({
            image_url: imgUrl,
            alt_text: file.name.replace(/\.[^/.]+$/, ""),
            is_primary: isFirstEver,
            sort_order: images.length + newImages.length + 1,
          });
          successCount++;
        }
      } catch (err: any) {
        console.error("Upload error for file:", file.name, err);
        setUploadError(`Lỗi khi tải ảnh ${file.name}: ${err.message || "Không thể upload"}`);
      }
    }

    if (newImages.length > 0) {
      const merged = [...images, ...newImages];
      // Đảm bảo luôn có duy nhất 1 ảnh chính trong toàn bộ danh sách
      const hasPrimary = merged.some((img) => img.is_primary);
      if (!hasPrimary && merged.length > 0) {
        merged[0].is_primary = true;
        onSetPrimaryUrl(merged[0].image_url);
      }
      onChangeImages(merged);
    }

    setIsUploading(false);
    setUploadProgress(
      successCount > 0 ? `Đã tải lên thành công ${successCount} hình ảnh!` : null
    );
    setTimeout(() => setUploadProgress(null), 4000);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleAddViaUrl = () => {
    if (!newUrl.trim()) return;

    const isFirst = images.length === 0;
    const newImage: DishImage = {
      image_url: newUrl.trim(),
      alt_text: newAlt.trim() || undefined,
      is_primary: isFirst,
      sort_order: images.length + 1,
    };

    const updated = [...images, newImage];
    onChangeImages(updated);
    if (isFirst || !primaryImageUrl) {
      onSetPrimaryUrl(newImage.image_url);
    }

    setNewUrl("");
    setNewAlt("");
    setShowUrlInput(false);
  };

  const handleSetPrimary = (index: number) => {
    const targetUrl = images[index]?.image_url;
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChangeImages(updated);
    if (targetUrl) {
      onSetPrimaryUrl(targetUrl);
    }
  };

  const handleDelete = (index: number) => {
    const deletedImg = images[index];
    const isDeletedPrimary = Boolean(deletedImg?.is_primary || deletedImg?.image_url === primaryImageUrl);
    const updated = images.filter((_, i) => i !== index);

    if (isDeletedPrimary) {
      if (updated.length > 0) {
        updated[0].is_primary = true;
        onSetPrimaryUrl(updated[0].image_url);
      } else {
        onSetPrimaryUrl("");
      }
    } else {
      // Đảm bảo vẫn luôn có 1 ảnh chính nếu danh sách còn ảnh
      const hasPrimary = updated.some((img) => img.is_primary);
      if (!hasPrimary && updated.length > 0) {
        updated[0].is_primary = true;
        onSetPrimaryUrl(updated[0].image_url);
      }
    }

    onChangeImages(updated);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Bộ sưu tập hình ảnh món ăn ({images.length})
          </h3>
          <p className="text-xs text-ink-muted">
            Tải lên nhiều hình ảnh từ máy tính hoặc dán URL. Ảnh đầu tiên hoặc ảnh được gắn sao sẽ làm ảnh đại diện.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs font-semibold text-brand-red hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{showUrlInput ? "Ẩn nhập link URL" : "Thêm qua đường dẫn URL"}</span>
        </button>
      </div>

      {/* Upload Messages */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadProgress && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Drag & Drop File Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? "border-brand-red bg-brand-red/5 scale-[1.01]"
            : "border-border hover:border-brand-red/60 hover:bg-surface-hover/50"
        } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="w-14 h-14 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center shadow-xs">
          {isUploading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-ink">
            Kéo thả nhiều ảnh vào đây, hoặc <span className="text-brand-red underline">chọn từ máy tính</span>
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Hỗ trợ chọn cùng lúc nhiều file JPG, PNG, WebP (Tối đa 5MB mỗi ảnh • Lưu trữ đám mây Cloudinary)
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          isLoading={isUploading}
        >
          <UploadCloud className="w-4 h-4 mr-1.5" />
          <span>Tải file ảnh lên</span>
        </Button>
      </div>

      {/* URL Input Form (collapsible) */}
      {showUrlInput && (
        <div className="p-4 bg-surface-hover/50 border border-border rounded-xl space-y-3 animate-in fade-in duration-150">
          <span className="text-xs font-bold text-ink uppercase tracking-wider block">
            Thêm ảnh nhanh qua đường dẫn URL
          </span>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-7">
              <Input
                label="Đường dẫn ảnh (URL)"
                placeholder="https://images.unsplash.com/photo-xxx"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Input
                label="Mô tả alt (SEO)"
                placeholder="Tô phở bò tái lăn"
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleAddViaUrl}
                disabled={!newUrl.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Thêm</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-ink-muted border border-dashed border-border rounded-xl">
          <ImageIcon className="w-10 h-10 text-ink-light mb-1 stroke-1" />
          <p className="text-xs font-medium">Chưa có ảnh nào được thêm vào món ăn này</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span>Danh sách {images.length} ảnh của món (Click biểu tượng ngôi sao để đổi ảnh chính)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => {
              const isPrimary = Boolean(img.is_primary);

              return (
                <div
                  key={idx}
                  className={`relative group rounded-xl border overflow-hidden bg-surface transition-all ${
                    isPrimary
                      ? "border-brand-red ring-2 ring-brand-red/30 shadow-sm"
                      : "border-border hover:border-ink-light"
                  }`}
                >
                  <div className="aspect-square relative w-full bg-surface-hover flex items-center justify-center">
                    {img.image_url ? (
                      <img
                        src={img.image_url}
                        alt={img.alt_text || "Ảnh món ăn"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-ink-muted">Chưa có ảnh</span>
                    )}

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute top-2 left-2 bg-brand-red text-cream text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 z-10">
                        <Star className="w-3 h-3 fill-cream" />
                        <span>Ảnh chính</span>
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface text-ink text-xs font-semibold hover:bg-cream transition-colors flex items-center gap-1 shadow-md"
                          title="Đặt làm ảnh chính"
                        >
                          <Star className="w-3.5 h-3.5 text-turmeric fill-turmeric" />
                          <span>Đặt làm ảnh chính</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 text-[11px] text-ink-muted truncate border-t border-border bg-surface flex items-center justify-between">
                    <span className="truncate">{img.alt_text || `Ảnh #${idx + 1}`}</span>
                    <span className="text-[10px] text-ink-light ml-1 font-mono">#{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
