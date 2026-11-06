import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CartService } from '../services/cart.service.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AddToCartDto } from '../dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto.js';
import { MergeCartDto } from '../dto/merge-cart.dto.js';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  addToCart(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(userId, dto);
  }

  @Patch('items/:id')
  updateCartItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(userId, itemId, dto);
  }

  @Delete('items/:id')
  removeCartItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete()
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('merge')
  mergeCart(@CurrentUser('id') userId: string, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(userId, dto);
  }
}
