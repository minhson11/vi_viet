/// <reference types="multer" />
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { RateLimit } from '../../common/rate-limit/rate-limit.guard.js';

const ALLOWED_FOLDERS = ['dishes', 'categories', 'avatars', 'banners'];

@Roles(Role.ADMIN, Role.OPERATOR)
@Controller('admin/upload')
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @RateLimit(20, 60 * 1000)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
      fileFilter: (req, file, callback) => {
        // Chỉ chấp nhận các định dạng ảnh phổ biến
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
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file ảnh để tải lên (field name: "file")',
      );
    }

    const cleanFolder = folder?.trim().toLowerCase();
    if (cleanFolder && !ALLOWED_FOLDERS.includes(cleanFolder)) {
      throw new BadRequestException(
        `Thư mục upload không hợp lệ. Chỉ chấp nhận các thư mục: ${ALLOWED_FOLDERS.join(', ')}.`,
      );
    }

    const uploadFolder = `vi-viet/${cleanFolder || 'dishes'}`;
    return this.cloudinaryService.uploadImage(file, uploadFolder);
  }
}
