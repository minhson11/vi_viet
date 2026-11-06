"use client";

import React from "react";
import { Tag } from "../types";
import { Tag as TagIcon, Check } from "lucide-react";

interface DishTagsEditorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChangeTagIds: (tagIds: string[]) => void;
}

export const DishTagsEditor: React.FC<DishTagsEditorProps> = ({
  availableTags = [],
  selectedTagIds,
  onChangeTagIds,
}) => {
  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChangeTagIds(selectedTagIds.filter((t) => t !== id));
    } else {
      onChangeTagIds([...selectedTagIds, id]);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-brand-red" />
          <span>Gắn nhãn & Thẻ phân loại</span>
        </h3>
        <p className="text-xs text-ink-muted">
          Giúp thuật toán gợi ý của AI Bếp Mẹ và bộ lọc tìm kiếm của khách hàng chính xác hơn.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-2">
        {availableTags.length === 0 ? (
          <p className="text-xs text-ink-muted italic">Chưa có thẻ phân loại trong cơ sở dữ liệu.</p>
        ) : (
          availableTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border ${
                  isSelected
                    ? "bg-brand-red text-cream border-brand-red shadow-xs"
                    : "bg-surface-hover text-ink border-border hover:bg-border/60"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || "#666" }}
                />
                <span>{tag.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cream" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

