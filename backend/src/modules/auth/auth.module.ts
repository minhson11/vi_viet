import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { FirebaseIdentityService } from './services/firebase-identity.service.js';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseIdentityService],
})
export class AuthModule {}
