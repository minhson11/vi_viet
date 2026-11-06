import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service.js';
import { AddressesService } from './services/addresses.service.js';
import { UsersController } from './controllers/users.controller.js';
import { AddressesController } from './controllers/addresses.controller.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';

@Module({
  controllers: [UsersController, AddressesController, AdminUsersController],
  providers: [UsersService, AddressesService],
})
export class UsersModule {}
