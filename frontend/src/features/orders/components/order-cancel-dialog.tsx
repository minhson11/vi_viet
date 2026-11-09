"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/currency";
import { Order } from "../api/orders.api";

const CANCEL_REASONS = [
  "Đổi ý không muốn đặt nữa",
  "Muốn thay đổi món ăn hoặc số lượng",
  "Chọn nhầm địa chỉ nhận hàng",
  "Thời gian chờ lâu",
  "Khác",
];

const POPULAR_BANKS = [
  "MB Bank (Quân Đội)",
  "Vietcombank (VCB)",
  "Techcombank (TCB)",
  "VPBank",
  "VietinBank (CTG)",
  "BIDV",
  "ACB (Á Châu)",
  "TPBank",
  "Sacombank",
  "VIB",
  "HDBank",
  "Timo by BVBank",
  "SHB",
  "SeABank",
  "MSB (Hàng Hải)",
  "OCB (Phương Đông)",
  "Khác",
];

interface OrderCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isCancelling: boolean;
  cancelReason: string;
  onChangeCancelReason: (r: string) => void;
  customReason: string;
  onChangeCustomReason: (c: string) => void;
  bankName: string;
  onChangeBankName: (b: string) => void;
  bankAccountNumber: string;
  onChangeBankAccountNumber: (n: string) => void;
  bankAccountName: string;
  onChangeBankAccountName: (name: string) => void;
  onConfirmCancel: () => void;
  order: Order;
}

export function OrderCancelDialog({
  isOpen,
  onClose,
  isCancelling,
  cancelReason,
  onChangeCancelReason,
  customReason,
  onChangeCustomReason,
  bankName,
  onChangeBankName,
  bankAccountNumber,
  onChangeBankAccountNumber,
  bankAccountName,
  onChangeBankAccountName,
  onConfirmCancel,
  order,
}: OrderCancelDialogProps) {
  const isPaidVNPay =
    order.payment_method === "VNPAY" &&
    (order.payment_status === "PAID" || order.payment_status === "REFUND_PENDING");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bạn muốn hủy đơn hàng này?"
      description="Đơn hàng chưa được chuyển sang bếp chế biến nên bạn có thể tự hủy miễn phí."
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isCancelling}>
            Giữ lại đơn
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirmCancel}
            disabled={isCancelling}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isCancelling ? "Đang hủy..." : "Xác nhận hủy đơn"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs py-2">
        <div className="space-y-2">
          <label className="font-semibold text-ink block">Vui lòng chọn lý do hủy:</label>
          <div className="space-y-1.5">
            {CANCEL_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  cancelReason === r
                    ? "border-brand-red bg-brand-red/5 font-semibold text-ink"
                    : "border-border hover:bg-surface-hover text-ink-muted"
                }`}
              >
                <input
                  type="radio"
                  name="cust_cancel_reason"
                  value={r}
                  checked={cancelReason === r}
                  onChange={(e) => onChangeCancelReason(e.target.value)}
                  className="text-brand-red focus:ring-brand-red"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {cancelReason === "Khác" && (
          <div className="space-y-1 pt-1">
            <label className="font-semibold text-ink block">Lý do cụ thể:</label>
            <textarea
              value={customReason}
              onChange={(e) => onChangeCustomReason(e.target.value)}
              placeholder="Nhập lý do của bạn..."
              rows={3}
              className="w-full p-2.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
        )}

        {isPaidVNPay && (
          <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl text-emerald-950 space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thông tin tài khoản nhận lại tiền ({formatVND(Number(order.total_amount))})</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Đơn hàng đã thanh toán qua VNPay. Vui lòng cung cấp số tài khoản để nhà hàng chuyển khoản hoàn tiền ngay:
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                  Ngân hàng thụ hưởng:
                </label>
                <select
                  value={bankName}
                  onChange={(e) => onChangeBankName(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                  Số tài khoản nhận hoàn tiền:
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => onChangeBankAccountNumber(e.target.value)}
                  placeholder="VD: 0987654321..."
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                  Tên chủ tài khoản (In hoa không dấu):
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => onChangeBankAccountName(e.target.value)}
                  placeholder="VD: NGUYEN VAN A..."
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-medium"
                />
              </div>
            </div>

            <p className="text-[10px] text-emerald-700/80 italic pt-1">
              * Nhà hàng sẽ đối soát và thực hiện lệnh chuyển khoản hoàn tiền theo đúng thông tin bạn cung cấp trong 24-48 giờ làm việc.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
