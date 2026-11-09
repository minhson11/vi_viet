import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Subject, Observable, merge, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface OrderEventPayload {
  orderId: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  userId: string;
  updatedAt: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly orderEvents$ = new Subject<OrderEventPayload>();

  /**
   * Phát sự kiện cập nhật trạng thái đơn hàng tới các client đang lắng nghe SSE
   */
  emitOrderUpdated(payload: OrderEventPayload) {
    this.logger.log(
      `[SSE] Phát sự kiện order.updated: Mã đơn ${payload.orderCode} -> ${payload.status}`,
    );
    this.orderEvents$.next(payload);
  }

  /**
   * Tạo stream SSE tùy biến và lọc theo vai trò của người dùng
   */
  getOrderEventsForUser(
    user: { id?: string; role?: string } | null,
  ): Observable<MessageEvent> {
    const eventsStream = this.orderEvents$.pipe(
      filter((event) => {
        if (!user) return false;
        // ADMIN và OPERATOR nhận tất cả cập nhật đơn hàng
        if (user.role === 'ADMIN' || user.role === 'OPERATOR') return true;
        // KITCHEN chỉ nhận các đơn hàng cần bếp chế biến
        if (user.role === 'KITCHEN') {
          return ['CONFIRMED', 'PREPARING', 'READY'].includes(event.status);
        }
        // CUSTOMER chỉ nhận sự kiện đơn hàng của chính mình
        if (user.role === 'CUSTOMER') {
          return event.userId === user.id;
        }
        return false;
      }),
      map((event) => ({
        type: 'order.updated',
        data: {
          orderId: event.orderId,
          orderCode: event.orderCode,
          status: event.status,
          paymentStatus: event.paymentStatus,
          updatedAt: event.updatedAt,
        },
      })),
    );

    // Heartbeat ping mỗi 20 giây để duy trì kết nối qua proxy / load balancer
    const heartbeatStream = interval(20000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() },
      })),
    );

    return merge(eventsStream, heartbeatStream);
  }
}
