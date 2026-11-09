import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsService } from './events.service.js';
import { EventsController } from './events.controller.js';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
