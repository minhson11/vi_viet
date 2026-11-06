import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import {
  AdminQueryUsersDto,
  AdminUpdateUserDto,
  AdminCreateUserDto,
} from '../dto/admin-user.dto.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';

@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query() query: AdminQueryUsersDto) {
    return this.usersService.findAllAdmin(query);
  }

  @Post()
  async createUser(@Body() dto: AdminCreateUserDto) {
    return this.usersService.adminCreateUser(dto);
  }

  @Patch(':id')
  async updateUser(
    @CurrentUser('id') adminId: string,
    @Param('id') targetUserId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(adminId, targetUserId, dto);
  }
}
