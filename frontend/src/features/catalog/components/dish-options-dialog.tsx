"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CatalogDish } from "../types";
import { formatVND } from "@/lib/utils/currency";
import { Plus, Minus, ShoppingBag } from "lucide-react";

interface DishOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dish: CatalogDish | null;
  onAddToCart: (dish: CatalogDish, quantity: number) => void;
}

export const DishOptionsDialog: React.FC<DishOptionsDialogProps> = ({
  isOpen,
  onClose,
  dish,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!dish) return null;

  const handleAdd = () => {
    onAddToCart(dish, quantity);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dish.name}
      description={dish.category?.name || "Món ăn truyền thống"}
    >
      <div className="space-y-4">
        {dish.image_url && (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-hover">
            <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-xs text-ink-muted">
          {dish.description || "Hương vị nguyên bản, nêm nếm vừa vặn theo công thức gia truyền."}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-hover"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-sm w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-hover"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-base font-bold text-brand-red font-mono">
              {formatVND(dish.base_price * quantity)}
            </div>
          </div>
        </div>

        <Button variant="primary" size="md" className="w-full" onClick={handleAdd}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          <span>Thêm vào giỏ hàng</span>
        </Button>
      </div>
    </Modal>
  );
};

