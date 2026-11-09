/// <reference types="multer" />
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.guard.js';

@Controller('upload')
export class UploadCustomerController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('review-image')
  @RateLimit(15, 60 * 1000)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Tối đa 5MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Định dạng file không hỗ trợ! Vui lòng chỉ tải lên ảnh JPG, PNG hoặc WebP.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadReviewImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file ảnh để tải lên (field name: "file")',
      );
    }
    return this.cloudinaryService.uploadImage(file, 'vi-viet/reviews');
  }
}
