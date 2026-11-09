import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider.js';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';
import { UploadController } from './upload.controller.js';
import { UploadCustomerController } from './upload-customer.controller.js';

@Module({
  controllers: [UploadController, UploadCustomerController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
