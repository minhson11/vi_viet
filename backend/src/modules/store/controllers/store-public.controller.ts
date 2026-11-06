import { Controller, Get } from '@nestjs/common';
import { StoreService } from '../services/store.service.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('store')
export class StorePublicController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get()
  getStore() {
    return this.storeService.getStore();
  }
}
