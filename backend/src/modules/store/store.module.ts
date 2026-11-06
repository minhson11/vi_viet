import { Module } from '@nestjs/common';
import { StoreService } from './services/store.service.js';
import { StorePublicController } from './controllers/store-public.controller.js';
import { StoreAdminController } from './controllers/store-admin.controller.js';

@Module({
  controllers: [StorePublicController, StoreAdminController],
  providers: [StoreService],
})
export class StoreModule {}
