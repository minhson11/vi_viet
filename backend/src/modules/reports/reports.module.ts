import { Module } from '@nestjs/common';
import { ReportsService } from './services/reports.service.js';
import { ReportsAdminController } from './controllers/reports-admin.controller.js';

@Module({
  controllers: [ReportsAdminController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
