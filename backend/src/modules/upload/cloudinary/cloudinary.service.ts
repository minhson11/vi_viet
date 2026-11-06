/// <reference types="multer" />
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'node:stream';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Upload file ảnh từ buffer lên Cloudinary sử dụng Upload Preset
   * @param file File nhận từ Multer
   * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: 'vi-viet/dishes')
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'vi-viet/dishes',
  ): Promise<CloudinaryUploadResult> {
    const cloudName = this.configService
      .get<string>('CLOUDINARY_CLOUD_NAME')
      ?.trim();
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.configService
      .get<string>('CLOUDINARY_API_SECRET')
      ?.trim();
    const uploadPreset =
      this.configService
        .get<string>('CLOUDINARY_UPLOAD_PRESET', 'vi_viet')
        ?.trim() || 'vi_viet';

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Chưa cấu hình tài khoản Cloudinary trong file .env! Vui lòng điền CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      );
    }

    if (!file || !file.buffer) {
      throw new BadRequestException(
        'Không tìm thấy dữ liệu file ảnh để upload!',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, any> = {
        resource_type: 'image',
        upload_preset: uploadPreset,
      };

      if (folder) {
        uploadOptions.folder = folder;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(`❌ Lỗi upload Cloudinary: ${error.message}`);
            return reject(
              new BadRequestException(
                `Lỗi upload ảnh lên Cloudinary: ${error.message}`,
              ),
            );
          }
          if (!result) {
            return reject(
              new BadRequestException(
                'Không nhận được phản hồi từ máy chủ Cloudinary',
              ),
            );
          }

          this.logger.log(
            `✅ Upload thành công với preset [${uploadPreset}]: ${result.secure_url}`,
          );

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Xóa ảnh trên Cloudinary theo public_id
   * @param publicId ID công khai của ảnh trên Cloudinary
   */
  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(
            `❌ Lỗi xóa ảnh Cloudinary [${publicId}]: ${error.message}`,
          );
          return reject(error);
        }
        resolve(result);
      });
    });
  }
}
