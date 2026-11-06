import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider.js';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
