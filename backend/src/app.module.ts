import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { PromotionsModule } from './modules/promotions/promotions.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { StoryModule } from './modules/story/story.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { validateEnvironment } from './config/environment.js';
import { HealthModule } from './modules/health/health.module.js';
import { StoreModule } from './modules/store/store.module.js';
import { RateLimitGuard } from './common/rate-limit/rate-limit.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MenuModule,
    UploadModule,
    CartModule,
    PromotionsModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    StoryModule,
    HealthModule,
    StoreModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
