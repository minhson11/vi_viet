import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableShutdownHooks();

  const express = app.getHttpAdapter().getInstance();
  const trustProxy = config.get<string>('TRUST_PROXY', 'true');
  if (trustProxy === 'true' || trustProxy === '1') {
    express.set('trust proxy', true);
  } else if (trustProxy && trustProxy !== 'false' && trustProxy !== '0') {
    express.set('trust proxy', trustProxy);
  }

  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));
  app.use((request: Request, response: Response, next: NextFunction) => {
    const suppliedRequestId = request.header('x-request-id');
    const requestId =
      suppliedRequestId && /^[A-Za-z0-9._-]{1,100}$/.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();

    response.setHeader('x-request-id', requestId);
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('cross-origin-opener-policy', 'same-origin-allow-popups');

    const start = Date.now();
    response.on('finish', () => {
      const duration = Date.now() - start;
      const url = request.originalUrl || request.url;
      logger.log(
        `[${requestId}] ${request.method} ${url} ${response.statusCode} - ${duration}ms`,
      );
    });
    next();
  });

  const corsOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin) return callback(null, true);
      try {
        const url = new URL(requestOrigin);
        const isVercel =
          url.hostname.endsWith('.vercel.app') || url.hostname === 'vercel.app';
        const isLocalhost =
          url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        const isConfigured = corsOrigins.includes(requestOrigin);
        if (isConfigured || isVercel || isLocalhost) {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }
      return callback(null, false);
    },
    credentials: true,
  });
  configureApp(app, config);

  const globalPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vị Việt API')
    .setDescription('API backend hệ thống ẩm thực truyền thống Vị Việt')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('vv_access')
    .build();
  SwaggerModule.setup(
    `${globalPrefix}/docs`,
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  express.get('/', (_req: Request, res: Response) => {
    res.redirect(302, `/${globalPrefix}/docs`);
  });

  const port = config.get<number>('PORT', 7000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Server đang chạy tại http://localhost:${port}/${globalPrefix}`);
  logger.log(`Swagger tại http://localhost:${port}/${globalPrefix}/docs`);
}

await bootstrap();
