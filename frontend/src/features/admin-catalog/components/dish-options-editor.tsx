"use client";

import React from "react";
import { OptionGroup, OptionItem } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ListPlus } from "lucide-react";

interface DishOptionsEditorProps {
  optionGroups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}

export const DishOptionsEditor: React.FC<DishOptionsEditorProps> = ({
  optionGroups,
  onChange,
}) => {
  const handleAddGroup = () => {
    const newGroup: OptionGroup = {
      name: `Nhóm tuỳ chọn ${optionGroups.length + 1}`,
      is_required: false,
      min_choices: 0,
      max_choices: 1,
      sort_order: optionGroups.length + 1,
      items: [
        {
          name: "Lựa chọn 1",
          price_adjustment: 0,
          is_available: true,
          is_default: false,
          sort_order: 1,
        },
      ],
    };
    onChange([...optionGroups, newGroup]);
  };

  const handleUpdateGroup = (groupIndex: number, field: keyof OptionGroup, value: any) => {
    const updated = [...optionGroups];
    updated[groupIndex] = { ...updated[groupIndex], [field]: value };
    onChange(updated);
  };

  const handleDeleteGroup = (groupIndex: number) => {
    onChange(optionGroups.filter((_, i) => i !== groupIndex));
  };

  const handleAddItem = (groupIndex: number) => {
    const updated = [...optionGroups];
    const group = updated[groupIndex];
    const newItem: OptionItem = {
      name: "",
      price_adjustment: 0,
      is_available: true,
      is_default: false,
      sort_order: (group.items?.length || 0) + 1,
    };
    group.items = [...(group.items || []), newItem];
    onChange(updated);
  };

  const handleUpdateItem = (
    groupIndex: number,
    itemIndex: number,
    field: keyof OptionItem,
    value: any
  ) => {
    const updated = [...optionGroups];
    const items = [...updated[groupIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    updated[groupIndex].items = items;
    onChange(updated);
  };

  const handleDeleteItem = (groupIndex: number, itemIndex: number) => {
    const updated = [...optionGroups];
    updated[groupIndex].items = updated[groupIndex].items.filter((_, i) => i !== itemIndex);
    onChange(updated);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Nhóm tuỳ chọn & Topping ({optionGroups.length})
          </h3>
          <p className="text-xs text-ink-muted">
            Ví dụ: Topping thêm (Trứng chần, Quẩy giòn), Yêu cầu nước dùng (Nước béo, Nước trong)
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAddGroup}>
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm nhóm tuỳ chọn</span>
        </Button>
      </div>

      {optionGroups.length === 0 ? (
        <div className="py-8 text-center text-ink-muted border border-dashed border-border rounded-lg">
          <p className="text-sm">Chưa thiết lập nhóm tuỳ chọn nào cho món ăn này.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleAddGroup}>
            Tạo nhóm tuỳ chọn đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {optionGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="p-5 bg-surface-hover/30 border border-border rounded-xl space-y-4"
            >
              {/* Group Header & Settings */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex-1 w-full sm:w-auto">
                  <Input
                    label={`Tên nhóm #${gIdx + 1}`}
                    placeholder="Ví dụ: Chọn Topping thêm"
                    value={group.name}
                    onChange={(e) => handleUpdateGroup(gIdx, "name", e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto pt-4 sm:pt-0">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={group.is_required}
                      onChange={(e) => handleUpdateGroup(gIdx, "is_required", e.target.checked)}
                      className="rounded text-brand-red"
                    />
                    <span className={group.is_required ? "text-brand-red" : "text-ink"}>
                      Bắt buộc chọn
                    </span>
                  </label>

                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <span>Chọn tối đa:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={group.max_choices}
                      onChange={(e) =>
                        handleUpdateGroup(gIdx, "max_choices", Number(e.target.value))
                      }
                      className="w-12 h-7 px-1 text-center bg-surface border border-border rounded text-xs font-bold"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 h-8 w-8"
                    onClick={() => handleDeleteGroup(gIdx)}
                    title="Xóa cả nhóm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pl-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Các lựa chọn con trong nhóm ({group.items?.length || 0})
                </span>

                {group.items?.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="flex flex-col sm:flex-row items-center gap-2 bg-surface p-2.5 rounded-lg border border-border"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Tên lựa chọn (VD: Quẩy nóng giòn)"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(gIdx, iIdx, "name", e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-brand-red"
                      />
                    </div>

                    <div className="w-full sm:w-36 flex items-center gap-1">
                      <span className="text-xs text-ink-muted">+</span>
                      <input
                        type="number"
                        placeholder="Giá cộng"
                        value={item.price_adjustment}
                        onChange={(e) =>
                          handleUpdateItem(gIdx, iIdx, "price_adjustment", Number(e.target.value))
                        }
                        className="w-full h-8 px-2 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                      />
                      <span className="text-[10px] text-ink-muted">đ</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-[11px] text-ink-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_default}
                          onChange={(e) =>
                            handleUpdateItem(gIdx, iIdx, "is_default", e.target.checked)
                          }
                          className="rounded text-brand-red text-xs"
                        />
                        <span>Mặc định</span>
                      </label>

                      <label className="flex items-center gap-1 text-[11px] text-ink-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_available}
                          onChange={(e) =>
                            handleUpdateItem(gIdx, iIdx, "is_available", e.target.checked)
                          }
                          className="rounded text-brand-red text-xs"
                        />
                        <span>Còn hàng</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(gIdx, iIdx)}
                        className="text-ink-light hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddItem(gIdx)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-red hover:underline pt-1"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Thêm lựa chọn con vào nhóm này</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

