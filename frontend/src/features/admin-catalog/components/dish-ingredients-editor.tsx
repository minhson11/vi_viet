"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Leaf, Plus, Search, X } from "lucide-react";
import {
  DishIngredientInput,
  Ingredient,
  IngredientDataStatus,
} from "../types";

interface DishIngredientsEditorProps {
  availableIngredients: Ingredient[];
  selectedIngredients: DishIngredientInput[];
  status: IngredientDataStatus;
  onChange: (ingredients: DishIngredientInput[]) => void;
  onChangeStatus: (status: IngredientDataStatus) => void;
  onCreateIngredient: (data: {
    name: string;
    is_allergen: boolean;
  }) => Promise<Ingredient>;
}

export function DishIngredientsEditor({
  availableIngredients,
  selectedIngredients,
  status,
  onChange,
  onChangeStatus,
  onCreateIngredient,
}: DishIngredientsEditorProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsAllergen, setNewIsAllergen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedIngredients.map((item) => item.ingredient_id)),
    [selectedIngredients],
  );
  const filtered = availableIngredients.filter((ingredient) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      ingredient.name.toLowerCase().includes(query) ||
      ingredient.code.toLowerCase().includes(query)
    );
  });

  const toggle = (ingredientId: string) => {
    if (selectedIds.has(ingredientId)) {
      onChange(
        selectedIngredients.filter(
          (item) => item.ingredient_id !== ingredientId,
        ),
      );
      return;
    }
    onChange([...selectedIngredients, { ingredient_id: ingredientId }]);
    if (status === "UNKNOWN") onChangeStatus("PARTIAL");
  };

  const updateNote = (ingredientId: string, note: string) => {
    onChange(
      selectedIngredients.map((item) =>
        item.ingredient_id === ingredientId ? { ...item, note } : item,
      ),
    );
  };

  const createIngredient = async () => {
    const name = newName.trim();
    if (!name || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await onCreateIngredient({
        name,
        is_allergen: newIsAllergen,
      });
      onChange([...selectedIngredients, { ingredient_id: created.id }]);
      if (status === "UNKNOWN") onChangeStatus("PARTIAL");
      setNewName("");
      setNewIsAllergen(false);
      setShowCreate(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Không thể tạo nguyên liệu.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
            <Leaf className="h-4 w-4 text-emerald-600" />
            Nguyên liệu món ăn
          </h3>
          <p className="mt-1 text-xs text-ink-muted">
            Chọn nguyên liệu, ghi chú cách sử dụng và đánh dấu dữ liệu đã được xác minh.
          </p>
        </div>
        <label className="text-xs font-semibold text-ink">
          Trạng thái dữ liệu
          <select
            value={status}
            onChange={(event) =>
              onChangeStatus(event.target.value as IngredientDataStatus)
            }
            className="mt-1 block h-9 rounded-lg border border-border bg-white px-3 text-xs"
          >
            <option value="UNKNOWN">Chưa có dữ liệu</option>
            <option value="PARTIAL">Chưa đầy đủ</option>
            <option value="VERIFIED">Đã xác minh</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã nguyên liệu"
            className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary px-3 text-xs font-bold text-primary hover:bg-primary/5"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreate ? "Đóng" : "Thêm nguyên liệu"}
        </button>
      </div>

      {showCreate && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-semibold text-ink">
            Tên nguyên liệu
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={120}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
            />
          </label>
          <label className="flex h-10 items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={newIsAllergen}
              onChange={(event) => setNewIsAllergen(event.target.checked)}
            />
            Có thể gây dị ứng
          </label>
          <button
            type="button"
            disabled={!newName.trim() || isCreating}
            onClick={createIngredient}
            className="h-10 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-50"
          >
            {isCreating ? "Đang tạo..." : "Tạo và chọn"}
          </button>
        </div>
      )}

      {createError && (
        <p className="text-xs font-medium text-red-600">{createError}</p>
      )}

      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border p-3">
        {filtered.length === 0 ? (
          <p className="text-xs italic text-ink-muted">Không tìm thấy nguyên liệu phù hợp.</p>
        ) : (
          filtered.map((ingredient) => {
            const selected = selectedIds.has(ingredient.id);
            return (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => toggle(ingredient.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-border bg-surface-hover text-ink hover:border-emerald-400"
                }`}
              >
                {ingredient.is_allergen && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                )}
                {ingredient.name}
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })
        )}
      </div>

      {selectedIngredients.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Ghi chú theo nguyên liệu
          </h4>
          {selectedIngredients.map((selected) => {
            const ingredient = availableIngredients.find(
              (item) => item.id === selected.ingredient_id,
            );
            if (!ingredient) return null;
            return (
              <label
                key={selected.ingredient_id}
                className="grid gap-2 text-xs font-semibold text-ink sm:grid-cols-[180px_1fr] sm:items-center"
              >
                <span className="flex items-center gap-1.5">
                  {ingredient.is_allergen && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {ingredient.name}
                </span>
                <input
                  value={selected.note || ""}
                  onChange={(event) =>
                    updateNote(selected.ingredient_id, event.target.value)
                  }
                  maxLength={500}
                  placeholder="Ví dụ: thái mỏng, dùng loại hữu cơ..."
                  className="h-9 rounded-lg border border-border bg-white px-3 text-xs font-normal"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
