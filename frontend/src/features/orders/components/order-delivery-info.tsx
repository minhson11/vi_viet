"use client";

import React from "react";
import { Phone, MapPin, FileText } from "lucide-react";
import { Order } from "../api/orders.api";

interface OrderDeliveryInfoProps {
  order: Order;
}

export function OrderDeliveryInfo({ order }: OrderDeliveryInfoProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3 text-xs">
      <h3 className="font-bold text-ink-muted uppercase tracking-wider text-[10px]">
        Thông tin giao hàng
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-ink">
        <div className="space-y-1">
          <span className="text-ink-muted text-[11px] block">Người nhận:</span>
          <p className="font-bold text-sm">{order.recipient_name}</p>
          <p className="font-mono text-ink-muted flex items-center gap-1">
            <Phone className="w-3 h-3 text-brand-red" />
            <span>{order.recipient_phone}</span>
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-ink-muted text-[11px] block">Địa chỉ giao:</span>
          {order.delivery_address ? (
            <p className="flex items-start gap-1 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0 mt-0.5" />
              <span>{order.delivery_address}</span>
            </p>
          ) : (
            <p className="italic text-ink-muted">Nhận món tại quầy</p>
          )}
        </div>
        {(order.customer_note || order.delivery_note) && (
          <div className="sm:col-span-2 p-2.5 bg-amber-500/10 border border-amber-300/40 rounded-lg text-amber-900">
            <div className="flex items-center gap-1 font-bold text-[11px]">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Lời dặn của bạn:</span>
            </div>
            <p className="text-xs italic pl-4.5 mt-0.5">
              {order.customer_note || order.delivery_note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
