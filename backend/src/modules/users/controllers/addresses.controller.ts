import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AddressesService } from '../services/addresses.service.js';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address.dto.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async getMyAddresses(@CurrentUser('id') userId: string) {
    return this.addressesService.findAll(userId);
  }

  @Post()
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(userId, dto);
  }

  @Get(':id')
  async getAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addressesService.findOne(userId, id);
  }

  @Patch(':id')
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(userId, id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/default')
  async setDefaultAddress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefault(userId, id);
  }

  @Delete(':id')
  async deleteAddress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressesService.remove(userId, id);
  }
}
