"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { TableItem } from "../types";

interface TableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: TableItem[];
  totalAmount: number;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export const TableDrawer: React.FC<TableDrawerProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute right-0 top-0 bottom-0 max-w-md w-full bg-[#fff8f6] shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#e2beba]/50 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h3 className="font-headline text-xl font-bold text-[#1c1917]">
                Giỏ Món Giao Nóng
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[#5a413d] hover:text-[#1c1917] p-1 rounded-lg transition-colors"
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex flex-col gap-3 text-sm max-h-[60vh] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="py-12 text-center text-[#5a413d] text-xs">
                Giỏ hàng của bạn đang trống. <br />
                Mời bạn chọn món từ Thực đơn để được giao nóng tận nơi!
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-[#e2beba]/40 flex justify-between items-center shadow-xs"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <strong className="block text-[#1c1917] truncate font-semibold">
                      {item.name}
                    </strong>
                    <span className="text-xs text-[#5a413d]">
                      {item.note || "Tiêu chuẩn nóng"}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="cursor-pointer w-6 h-6 rounded-full border border-[#e2beba] flex items-center justify-center text-xs hover:bg-[#fff1eb]"
                        aria-label="Giảm"
                      >
                        <Minus className="w-3 h-3 text-[#5a413d]" />
                      </button>
                      <span className="text-xs font-bold text-[#1c1917] min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="cursor-pointer w-6 h-6 rounded-full border border-[#e2beba] flex items-center justify-center text-xs hover:bg-[#fff1eb]"
                        aria-label="Tăng"
                      >
                        <Plus className="w-3 h-3 text-[#5a413d]" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-bold text-primary font-headline text-base">
                      {formatVND(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="cursor-pointer text-xs text-[#8e706c] hover:text-primary transition-colors p-1"
                      title="Xóa món"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#e2beba]/50 space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#5a413d] font-medium">
              Tạm tính giỏ hàng:
            </span>
            <span className="font-headline text-2xl font-bold text-primary">
              {formatVND(totalAmount)}
            </span>
          </div>

          <div className="space-y-2">
            <Link
              href="/thanh-toan"
              onClick={onClose}
              className={`w-full py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                items.length === 0 ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/gio-hang"
              onClick={onClose}
              className="block text-center text-xs text-[#5a413d] hover:text-primary underline pt-1"
            >
              Xem chi tiết giỏ hàng &amp; áp mã giảm giá
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

