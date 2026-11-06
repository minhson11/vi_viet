import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service.js';
import { CartController } from './controllers/cart.controller.js';

@Module({
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
