import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../enums/role.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.',
      );
    }
    if (!requiredRoles?.length) return true;
    if (!user?.id) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này.',
      );
    }

    const dbUser = await this.prisma.users.findUnique({
      where: { id: BigInt(user.id) },
      select: { role: true, status: true },
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa hoặc không tồn tại.',
      );
    }

    request.user.role = dbUser.role;
    request.user.status = dbUser.status;
    if (!requiredRoles.includes(dbUser.role as Role)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này.',
      );
    }

    return true;
  }
}
