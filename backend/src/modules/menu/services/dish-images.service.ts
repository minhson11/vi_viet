/// <reference types="multer" />
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateDishImageDto } from '../dto/create-dish-image.dto.js';
import { UploadDishImageDto } from '../dto/upload-dish-image.dto.js';
import { SyncDishImagesDto } from '../dto/sync-dish-images.dto.js';
import { CloudinaryService } from '../../upload/cloudinary/cloudinary.service.js';
import { dish_images_kind } from '@prisma/client';

@Injectable()
export class DishImagesService {
  private readonly logger = new Logger(DishImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findByDishId(dishId: string) {
    return this.prisma.dish_images.findMany({
      where: { dish_id: BigInt(dishId) },
      orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Thêm 1 ảnh mới cho món ăn
   * Đảm bảo: Nếu ảnh mới là COVER thì toàn bộ ảnh cũ của món này tự động chuyển thành GALLERY
   */
  async addImage(dishId: string, dto: CreateDishImageDto) {
    const dishBigInt = BigInt(dishId);
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishBigInt },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${dishId}`);
    }

    const kind = dto.kind as dish_images_kind;

    // Nếu ảnh này là COVER, hạ tất cả các ảnh khác của món về GALLERY
    if (kind === dish_images_kind.COVER) {
      await this.prisma.dish_images.updateMany({
        where: { dish_id: dishBigInt, kind: dish_images_kind.COVER },
        data: { kind: dish_images_kind.GALLERY },
      });
    }

    return this.prisma.dish_images.create({
      data: {
        dish_id: dishBigInt,
        asset_path: dto.asset_path,
        kind: kind ?? dish_images_kind.GALLERY,
        alt_text: dto.alt_text,
        sort_order: dto.sort_order ?? 0,
      },
    });
  }

  /**
   * Upload trực tiếp ảnh lên Cloudinary và lưu thông tin vào bảng dish_images
   */
  async uploadAndAddImage(
    dishId: string,
    file: Express.Multer.File,
    dto: UploadDishImageDto,
  ) {
    const dishBigInt = BigInt(dishId);
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishBigInt },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${dishId}`);
    }

    if (!file) {
      throw new BadRequestException(
        'Vui lòng chọn file hình ảnh để tải lên (field: "file")',
      );
    }

    // 1. Upload lên Cloudinary thư mục vi-viet/dishes
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'vi-viet/dishes',
    );

    const kind = dto.kind as dish_images_kind;

    // Nếu ảnh mới là COVER, hạ tất cả các ảnh khác của món về GALLERY
    if (kind === dish_images_kind.COVER) {
      await this.prisma.dish_images.updateMany({
        where: { dish_id: dishBigInt, kind: dish_images_kind.COVER },
        data: { kind: dish_images_kind.GALLERY },
      });
    }

    // 2. Lưu đường dẫn và metadata vào CSDL
    return this.prisma.dish_images.create({
      data: {
        dish_id: dishBigInt,
        asset_path: uploadResult.url,
        kind: kind ?? dish_images_kind.GALLERY,
        alt_text: dto.alt_text || dish.name,
        sort_order: dto.sort_order ?? 0,
      },
    });
  }

  /**
   * Đặt 1 ảnh làm ảnh chính (COVER), các ảnh khác tự động chuyển thành GALLERY
   */
  async setCover(dishId: string, imageId: string) {
    const dishBigInt = BigInt(dishId);
    const imgBigInt = BigInt(imageId);

    const image = await this.prisma.dish_images.findFirst({
      where: { id: imgBigInt, dish_id: dishBigInt },
    });
    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh ID: ${imageId}`);
    }

    // Hạ tất cả các ảnh khác của món về GALLERY
    await this.prisma.dish_images.updateMany({
      where: { dish_id: dishBigInt, id: { not: imgBigInt } },
      data: { kind: dish_images_kind.GALLERY },
    });

    // Nâng ảnh được chọn lên COVER
    return this.prisma.dish_images.update({
      where: { id: imgBigInt },
      data: { kind: dish_images_kind.COVER },
    });
  }

  /**
   * Đồng bộ toàn bộ danh sách ảnh món ăn (Sync Images):
   * - Xóa bỏ triệt để các ảnh cũ không còn trong danh sách gửi lên
   * - Đảm bảo DUY NHẤT 1 ảnh được đánh dấu là COVER (không bao giờ tồn tại 2 ảnh chính)
   * - Thêm các ảnh mới và cập nhật thứ tự sort_order
   */
  async syncImages(dishId: string, dto: SyncDishImagesDto) {
    const dishBigInt = BigInt(dishId);
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishBigInt },
    });
    if (!dish || dish.deleted_at) {
      throw new NotFoundException(`Không tìm thấy món ăn ID: ${dishId}`);
    }

    const items = dto.images || [];

    // 1. Lấy tất cả ảnh hiện có trong database của món này
    const existingImages = await this.prisma.dish_images.findMany({
      where: { dish_id: dishBigInt },
    });

    // 2. Lọc danh sách ID ảnh cũ được giữ lại
    const retainedIds: bigint[] = [];
    for (const it of items) {
      if (it.id && !it.id.startsWith('img-')) {
        try {
          retainedIds.push(BigInt(it.id));
        } catch {
          // ignore invalid bigint
        }
      }
    }

    // 3. Tìm các ảnh cũ bị xóa khỏi danh sách
    const imagesToDelete = existingImages.filter(
      (img) => !retainedIds.includes(img.id),
    );
    for (const delImg of imagesToDelete) {
      // Gỡ bỏ liên kết trong story_sections nếu có
      await this.prisma.story_sections.updateMany({
        where: { image_id: delImg.id },
        data: { image_id: null },
      });

      // Dọn dẹp trên Cloudinary nếu có
      if (delImg.asset_path && delImg.asset_path.includes('cloudinary.com')) {
        try {
          const match = delImg.asset_path.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
          if (match && match[1]) {
            await this.cloudinaryService.deleteImage(match[1]);
          }
        } catch (e: any) {
          this.logger.warn(
            `Lỗi khi dọn ảnh Cloudinary (${delImg.asset_path}): ${e.message}`,
          );
        }
      }
    }

    if (imagesToDelete.length > 0) {
      await this.prisma.dish_images.deleteMany({
        where: { id: { in: imagesToDelete.map((x) => x.id) } },
      });
    }

    // 4. Xác định ảnh nào là COVER DUY NHẤT
    // Ưu tiên ảnh có is_primary === true, hoặc kind === 'COVER', nếu không có thì ảnh đầu tiên
    let primaryIndex = items.findIndex(
      (it) => it.is_primary === true || it.kind === 'COVER',
    );
    if (primaryIndex === -1 && items.length > 0) {
      primaryIndex = 0;
    }

    // 5. Cập nhật các ảnh cũ còn giữ lại và Thêm các ảnh mới
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const isThisCover = idx === primaryIndex;
      const targetKind = isThisCover
        ? dish_images_kind.COVER
        : dish_images_kind.GALLERY;
      const targetSortOrder = it.sort_order ?? idx + 1;
      const targetAlt = it.alt_text || dish.name;

      if (it.id && !it.id.startsWith('img-')) {
        // Cập nhật ảnh cũ
        try {
          const imgBigInt = BigInt(it.id);
          await this.prisma.dish_images.update({
            where: { id: imgBigInt },
            data: {
              kind: targetKind,
              sort_order: targetSortOrder,
              alt_text: targetAlt,
              asset_path: it.asset_path,
            },
          });
        } catch (err: any) {
          this.logger.warn(
            `Không thể cập nhật ảnh ID ${it.id}: ${err.message}`,
          );
        }
      } else {
        // Tạo ảnh mới
        await this.prisma.dish_images.create({
          data: {
            dish_id: dishBigInt,
            asset_path: it.asset_path,
            kind: targetKind,
            alt_text: targetAlt,
            sort_order: targetSortOrder,
          },
        });
      }
    }

    // 6. Trả về danh sách ảnh mới nhất
    return this.findByDishId(dishId);
  }

  async removeImage(dishId: string, imageId: string) {
    const imgBigInt = BigInt(imageId);
    const image = await this.prisma.dish_images.findFirst({
      where: { id: imgBigInt, dish_id: BigInt(dishId) },
    });
    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh ID: ${imageId}`);
    }

    // Gỡ liên kết trong story_sections nếu có
    await this.prisma.story_sections.updateMany({
      where: { image_id: imgBigInt },
      data: { image_id: null },
    });

    // Nếu ảnh lưu trên Cloudinary, cố gắng dọn dẹp để tiết kiệm dung lượng
    if (image.asset_path && image.asset_path.includes('cloudinary.com')) {
      try {
        const match = image.asset_path.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
        if (match && match[1]) {
          await this.cloudinaryService.deleteImage(match[1]);
        }
      } catch (err: any) {
        this.logger.warn(
          `Không thể xóa ảnh trên Cloudinary (${image.asset_path}): ${err.message}`,
        );
      }
    }

    return this.prisma.dish_images.delete({
      where: { id: imgBigInt },
    });
  }
}
