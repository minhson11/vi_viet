import { describe, it, expect, beforeEach } from 'vitest';
import { EventsService, OrderEventPayload } from './events.service.js';
import { firstValueFrom, take, toArray } from 'rxjs';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(() => {
    service = new EventsService();
  });

  it('phát sự kiện order.updated cho ADMIN nhận tất cả đơn', async () => {
    const adminUser = { id: '1', role: 'ADMIN' };
    const stream$ = service.getOrderEventsForUser(adminUser);

    const promise = firstValueFrom(stream$);

    service.emitOrderUpdated({
      orderId: '100',
      orderCode: 'VV-100',
      status: 'CONFIRMED',
      paymentStatus: 'UNPAID',
      userId: '50',
      updatedAt: '2026-11-09T10:00:00Z',
    });

    const received = await promise;
    expect(received.type).toBe('order.updated');
    expect((received.data as any).orderCode).toBe('VV-100');
    expect((received.data as any).status).toBe('CONFIRMED');
  });

  it('lọc sự kiện cho CUSTOMER chỉ nhận đơn của chính mình', async () => {
    const customerUser = { id: '50', role: 'CUSTOMER' };
    const stream$ = service.getOrderEventsForUser(customerUser);

    const receivedEvents: any[] = [];
    const sub = stream$.subscribe((ev) => {
      if (ev.type === 'order.updated') {
        receivedEvents.push(ev.data);
      }
    });

    // Phát đơn của user khác (id=99)
    service.emitOrderUpdated({
      orderId: '101',
      orderCode: 'VV-101',
      status: 'PREPARING',
      paymentStatus: 'PAID',
      userId: '99',
      updatedAt: '2026-11-09T10:05:00Z',
    });

    // Phát đơn của chính customer (id=50)
    service.emitOrderUpdated({
      orderId: '102',
      orderCode: 'VV-102',
      status: 'READY',
      paymentStatus: 'PAID',
      userId: '50',
      updatedAt: '2026-11-09T10:10:00Z',
    });

    sub.unsubscribe();

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].orderCode).toBe('VV-102');
  });

  it('lọc sự kiện cho KITCHEN chỉ nhận đơn CONFIRMED, PREPARING, READY', async () => {
    const kitchenUser = { id: '5', role: 'KITCHEN' };
    const stream$ = service.getOrderEventsForUser(kitchenUser);

    const receivedEvents: any[] = [];
    const sub = stream$.subscribe((ev) => {
      if (ev.type === 'order.updated') {
        receivedEvents.push(ev.data);
      }
    });

    // Đơn DELIVERING không thuộc phạm vi bếp
    service.emitOrderUpdated({
      orderId: '201',
      orderCode: 'VV-201',
      status: 'DELIVERING',
      paymentStatus: 'PAID',
      userId: '10',
      updatedAt: '2026-11-09T10:15:00Z',
    });

    // Đơn CONFIRMED bếp cần nấu
    service.emitOrderUpdated({
      orderId: '202',
      orderCode: 'VV-202',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      userId: '11',
      updatedAt: '2026-11-09T10:20:00Z',
    });

    sub.unsubscribe();

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].orderCode).toBe('VV-202');
  });
});
