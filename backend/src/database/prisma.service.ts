import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Đảm bảo serialize BigInt thành string khi trả về JSON cho frontend
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await this.$connect();
        this.logger.log('Prisma ORM connected to the database successfully.');
        return;
      } catch (err: any) {
        attempt++;
        this.logger.warn(
          `[Prisma] Kết nối tới TiDB Cloud thất bại (lần ${attempt}/${maxRetries}): ${err.message}. Đang tự động thử lại sau 2.5 giây...`,
        );
        if (attempt >= maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma ORM disconnected from the database.');
  }
}
