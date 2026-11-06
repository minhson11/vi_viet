import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';
import { slugify } from '../../../common/utils/slug.util.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic() {
    return this.prisma.categories.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            dishes: {
              where: {
                availability: 'AVAILABLE',
                deleted_at: null,
              },
            },
          },
        },
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.categories.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            dishes: {
              where: { deleted_at: null },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.categories.findUnique({
      where: { id: BigInt(id) },
    });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);

    const existing = await this.prisma.categories.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(`Slug danh mục '${slug}' đã tồn tại!`);
    }

    return this.prisma.categories.create({
      data: {
        name: dto.name,
        slug,
        sort_order: dto.sort_order ?? 0,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    let slug = dto.slug ? slugify(dto.slug) : undefined;
    if (!slug && dto.name) {
      slug = slugify(dto.name);
    }

    if (slug) {
      const existing = await this.prisma.categories.findUnique({
        where: { slug },
      });
      if (existing && existing.id !== BigInt(id)) {
        throw new ConflictException(`Slug danh mục '${slug}' đã được sử dụng!`);
      }
    }

    return this.prisma.categories.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        slug,
        sort_order: dto.sort_order,
        is_active: dto.is_active,
      },
    });
  }

  async remove(id: string) {
    const categoryId = BigInt(id);

    // Kiểm tra danh mục có tồn tại không
    await this.findById(id);

    // Kiểm tra tất cả món ăn tham chiếu đến danh mục này (bao gồm cả món đã xóa mềm)
    // vì ràng buộc khóa ngoại fk_dishes_1 của database ngăn chặn xóa cứng danh mục đang được tham chiếu
    const dishCount = await this.prisma.dishes.count({
      where: { category_id: categoryId },
    });

    if (dishCount > 0) {
      throw new BadRequestException(
        `Không thể xóa danh mục đã phát sinh dữ liệu (${dishCount} món ăn). Vui lòng chuyển món sang danh mục khác hoặc chuyển trạng thái danh mục sang Vô hiệu hóa (is_active = false)!`,
      );
    }

    return this.prisma.categories.delete({
      where: { id: categoryId },
    });
  }
}
