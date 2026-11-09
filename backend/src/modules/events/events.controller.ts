import {
  Controller,
  Sse,
  MessageEvent,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator.js';
import { EventsService } from './events.service.js';

@ApiTags('Sự kiện thời gian thực (SSE)')
@Controller()
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Sse('events')
  @ApiOperation({
    summary:
      'Server-Sent Events stream cập nhật trạng thái đơn hàng thời gian thực (API-54)',
  })
  sse(@Req() req: Request): Observable<MessageEvent> {
    const user = this.extractUserFromRequest(req);
    this.logger.log(
      `[SSE] Client connected: user=${user ? user.id : 'anonymous'} (role=${user ? user.role : 'none'})`,
    );

    return this.eventsService.getOrderEventsForUser(user);
  }

  private extractUserFromRequest(
    req: Request,
  ): { id: string; role: string } | null {
    try {
      let token: string | undefined;

      // 1. Kiểm tra header Authorization
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // 2. Kiểm tra query param ?token=... (cho EventSource browser)
      if (!token && typeof req.query?.token === 'string') {
        token = req.query.token;
      }

      // 3. Kiểm tra cookie vv_access
      if (!token && req.headers.cookie) {
        const match = req.headers.cookie.match(
          /(?:^|;\s*)vv_access=([^;]*)/,
        );
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }

      if (!token) return null;

      const accessSecret =
        this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify(token, {
        secret: accessSecret,
      });

      return {
        id: payload.sub || payload.id,
        role: payload.role || 'CUSTOMER',
      };
    } catch {
      return null;
    }
  }
}
