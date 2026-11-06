import { Body, Controller, Get, Put } from '@nestjs/common';
import { StoreService } from '../services/store.service.js';
import { UpdateStoreDto } from '../dto/update-store.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

@Controller('admin/store')
export class StoreAdminController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @Roles(Role.ADMIN)
  getStore() {
    return this.storeService.getStore();
  }

  @Put()
  @Roles(Role.ADMIN)
  updateStore(@Body() dto: UpdateStoreDto) {
    return this.storeService.updateStore(dto);
  }
}
