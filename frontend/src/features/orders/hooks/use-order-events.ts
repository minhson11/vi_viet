import { useEffect, useRef } from "react";
import { httpClient } from "@/lib/http/client";

export interface OrderUpdateEvent {
  orderId: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  updatedAt: string;
}

/**
 * Hook lắng nghe luồng sự kiện thời gian thực Server-Sent Events (API-54)
 * Tự động kết nối, tự động retry khi rớt mạng và gọi callback khi có cập nhật đơn hàng.
 */
export function useOrderEvents(
  onOrderUpdated: (event: OrderUpdateEvent) => void,
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = httpClient.getToken();
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api/v1";
    const sseUrl = `${apiUrl}/events${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;

    const es = new EventSource(sseUrl, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("order.updated", (e: MessageEvent) => {
      try {
        const payload: OrderUpdateEvent = JSON.parse(e.data);
        onOrderUpdated(payload);
      } catch (err) {
        console.error("Failed to parse SSE order.updated payload:", err);
      }
    });

    es.onerror = (err) => {
      // Trình duyệt tự động kết nối lại khi có lỗi mạng
      console.warn(
        "SSE connection interrupted, retrying automatically...",
        err,
      );
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [onOrderUpdated]);
}
