import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

const RATE_LIMIT_KEY = 'rate_limit';
const MAX_KEYS = 10_000;
const requests = new Map<string, number[]>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export const RateLimit = (limit: number, windowMs: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs } satisfies RateLimitOptions);

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): number {
  if (!requests.has(key) && requests.size >= MAX_KEYS) {
    const oldestKey = requests.keys().next().value;
    if (oldestKey) requests.delete(oldestKey);
  }

  const recent = (requests.get(key) || []).filter(
    (timestamp) => timestamp > now - windowMs,
  );
  if (recent.length >= limit) {
    requests.set(key, recent);
    return Math.max(1, recent[0] + windowMs - now);
  }

  recent.push(now);
  requests.set(key, recent);
  return 0;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const key = `${request.ip}:${request.method}:${request.baseUrl}${request.path}`;
    const retryAfterMs = consumeRateLimit(key, options.limit, options.windowMs);
    if (retryAfterMs === 0) return true;

    response.setHeader('retry-after', Math.ceil(retryAfterMs / 1_000));
    throw new HttpException(
      'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
