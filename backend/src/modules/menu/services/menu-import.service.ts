import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  dish_images_kind,
  dishes_ingredient_data_status,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service.js';
import {
  MENU_IMPORT_HEADERS,
  MENU_IMPORT_SHEET,
  parseMenuWorkbook,
} from './menu-import.parser.js';
import type {
  MenuImportDish,
  MenuImportError,
  MenuImportIngredient,
  MenuImportPreview,
  MenuImportTag,
  ParsedMenuWorkbook,
} from './menu-import.types.js';

type ExistingDish = Prisma.dishesGetPayload<{
  include: {
    dish_variants: true;
    dish_images: true;
    option_groups: { include: { option_values: true } };
  };
}>;

interface ImportAnalysis {
  parsed: ParsedMenuWorkbook;
  preview: MenuImportPreview;
  categories: Map<string, bigint>;
  existingDishes: Map<string, ExistingDish>;
  ingredients: Map<string, bigint>;
  tags: Map<string, bigint>;
  ingredientImports: Map<string, MenuImportIngredient>;
  tagImports: Map<string, MenuImportTag>;
}

@Injectable()
export class MenuImportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vị Việt';
    const sheet = workbook.addWorksheet(MENU_IMPORT_SHEET, {
      views: [{ state: 'frozen', ySplit: 1, xSplit: 3 }],
    });
    sheet.columns = MENU_IMPORT_HEADERS.map((header) => ({
      header,
      key: header,
      width: this.columnWidth(header),
    }));

    const rows: Record<string, unknown>[] = [
      {
        loai_dong: 'CATEGORY',
        hanh_dong: 'CREATE',
        danh_muc_slug: 'mon-nuoc-mau',
        danh_muc_ten: 'Món nước mẫu',
        danh_muc_hoat_dong: 'TRUE',
        thu_tu: 1,
      },
      {
        loai_dong: 'DISH',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-mau',
        ten_mon: 'Phở bò mẫu',
        danh_muc_slug: 'mon-nuoc-mau',
        mo_ta: 'Mô tả món ăn',
        cau_chuyen: 'Câu chuyện món ăn',
        muc_cay: 0,
        trang_thai: 'AVAILABLE',
        thu_tu: 1,
        trang_thai_nguyen_lieu: 'VERIFIED',
      },
      {
        loai_dong: 'VARIANT',
        dish_slug: 'pho-bo-mau',
        ten_bien_the: 'Tiêu chuẩn',
        gia: 50000,
        bien_the_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'VARIANT',
        dish_slug: 'pho-bo-mau',
        ten_bien_the: 'Đặc biệt',
        gia: 70000,
        bien_the_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'INGREDIENT',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-mau',
        ma_nguyen_lieu: 'thit-bo-mau',
        ten_nguyen_lieu: 'Thịt bò mẫu',
        gay_di_ung: 'FALSE',
        ghi_chu_nguyen_lieu: 'Thái mỏng',
      },
      {
        loai_dong: 'TAG',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-mau',
        ma_the: 'dac-san-mau',
        ten_the: 'Đặc sản mẫu',
      },
      {
        loai_dong: 'IMAGE',
        dish_slug: 'pho-bo-mau',
        url_anh: 'https://example.com/pho-bo.jpg',
        loai_anh: 'COVER',
        alt_anh: 'Phở bò mẫu',
        thu_tu_anh: 1,
      },
      {
        loai_dong: 'OPTION_GROUP',
        dish_slug: 'pho-bo-mau',
        ten_nhom_tuy_chon: 'Topping',
        chon_toi_thieu: 0,
        chon_toi_da: 3,
        nhom_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'OPTION_VALUE',
        dish_slug: 'pho-bo-mau',
        ten_nhom_tuy_chon: 'Topping',
        ten_gia_tri: 'Thêm trứng',
        gia_them: 10000,
        gia_tri_hoat_dong: 'TRUE',
      },
    ];
    rows.forEach((row) => sheet.addRow(row));

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B1E2D' },
    };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 28;
    sheet.autoFilter = `A1:${sheet.getColumn(MENU_IMPORT_HEADERS.length).letter}1`;

    const output = await workbook.xlsx.writeBuffer();
    return Buffer.from(output);
  }

  async preview(buffer: Buffer): Promise<MenuImportPreview> {
    return (await this.analyze(buffer)).preview;
  }

  async import(buffer: Buffer) {
    const analysis = await this.analyze(buffer);
    if (!analysis.preview.valid) {
      throw new BadRequestException({
        message: 'File Excel còn lỗi, không thể import.',
        error: analysis.preview,
      });
    }

    const {
      parsed,
      categories,
      existingDishes,
      ingredients,
      tags,
      ingredientImports,
      tagImports,
    } = analysis;
    await this.prisma.$transaction(
      async (tx) => {
        await this.applyCategories(tx, parsed, categories);
        await this.applyIngredients(tx, ingredientImports, ingredients);
        await this.applyTags(tx, tagImports, tags);
        for (const dish of parsed.dishes) {
          await this.applyDish(
            tx,
            dish,
            existingDishes.get(dish.slug),
            categories,
            ingredients,
            tags,
          );
        }
      },
      { maxWait: 5_000, timeout: 30_000 },
    );

    return {
      success: true,
      imported: parsed.dishes.length,
      created: parsed.dishes.filter((dish) => dish.action === 'CREATE').length,
      updated: parsed.dishes.filter((dish) => dish.action === 'UPDATE').length,
    };
  }

  private async analyze(buffer: Buffer): Promise<ImportAnalysis> {
    const parsed = await parseMenuWorkbook(buffer);
    const ingredientImports = this.collectIngredients(parsed, parsed.errors);
    const tagImports = this.collectTags(parsed, parsed.errors);
    const categorySlugs = [
      ...new Set([
        ...parsed.categories.map((item) => item.slug),
        ...parsed.dishes.map((item) => item.categorySlug),
      ]),
    ];
    const dishSlugs = parsed.dishes.map((item) => item.slug);
    const ingredientCodes = [...ingredientImports.keys()];
    const tagCodes = [...tagImports.keys()];

    const [categoryRows, dishRows, ingredientRows, tagRows] = await Promise.all([
      this.prisma.categories.findMany({
        where: { slug: { in: categorySlugs } },
        select: { id: true, slug: true },
      }),
      this.prisma.dishes.findMany({
        where: { slug: { in: dishSlugs }, deleted_at: null },
        include: {
          dish_variants: true,
          dish_images: true,
          option_groups: { include: { option_values: true } },
        },
      }),
      this.prisma.ingredients.findMany({
        where: { code: { in: ingredientCodes } },
        select: { id: true, code: true },
      }),
      this.prisma.tags.findMany({
        where: { code: { in: tagCodes } },
        select: { id: true, code: true },
      }),
    ]);

    const categories = new Map(categoryRows.map((item) => [item.slug, item.id]));
    const existingDishes = new Map(dishRows.map((item) => [item.slug, item]));
    const ingredients = new Map(ingredientRows.map((item) => [item.code, item.id]));
    const tags = new Map(tagRows.map((item) => [item.code, item.id]));

    for (const category of parsed.categories) {
      const exists = categories.has(category.slug);
      if (category.action === 'CREATE' && exists) {
        parsed.errors.push(
          this.error(
            category.row,
            'danh_muc_slug',
            'CATEGORY_ALREADY_EXISTS',
            `Danh mục '${category.slug}' đã tồn tại.`,
          ),
        );
      }
      if (category.action === 'UPDATE' && !exists) {
        parsed.errors.push(
          this.error(
            category.row,
            'danh_muc_slug',
            'CATEGORY_NOT_FOUND',
            `Không tìm thấy danh mục '${category.slug}'.`,
          ),
        );
      }
    }

    for (const item of ingredientImports.values()) {
      this.validateCatalogAction(
        item.row,
        'ma_nguyen_lieu',
        item.code,
        item.action,
        ingredients.has(item.code),
        parsed.errors,
        'INGREDIENT',
      );
    }
    for (const item of tagImports.values()) {
      this.validateCatalogAction(
        item.row,
        'ma_the',
        item.code,
        item.action,
        tags.has(item.code),
        parsed.errors,
        'TAG',
      );
    }
    for (const dish of parsed.dishes) {
      this.validateDish(
        dish,
        parsed,
        categories,
        existingDishes,
      );
    }

    const invalidSlugs = new Set(
      parsed.errors.flatMap((item) => (item.slug ? [item.slug] : [])),
    );
    const preview: MenuImportPreview = {
      valid: parsed.errors.length === 0,
      summary: {
        rows: parsed.rows,
        dishes: parsed.dishes.length,
        create: parsed.dishes.filter((dish) => dish.action === 'CREATE').length,
        update: parsed.dishes.filter((dish) => dish.action === 'UPDATE').length,
        invalid:
          parsed.errors.length > 0 ? Math.max(invalidSlugs.size, 1) : 0,
      },
      errors: parsed.errors,
    };
    return {
      parsed,
      preview,
      categories,
      existingDishes,
      ingredients,
      tags,
      ingredientImports,
      tagImports,
    };
  }

  private collectIngredients(
    parsed: ParsedMenuWorkbook,
    errors: MenuImportError[],
  ): Map<string, MenuImportIngredient> {
    const result = new Map<string, MenuImportIngredient>();
    for (const item of parsed.dishes.flatMap((dish) => dish.ingredients)) {
      const current = result.get(item.code);
      if (!current) {
        result.set(item.code, item);
        continue;
      }
      if (
        current.name &&
        item.name &&
        current.name !== item.name ||
        current.isAllergen !== undefined &&
          item.isAllergen !== undefined &&
          current.isAllergen !== item.isAllergen ||
        current.action !== 'USE' &&
          item.action !== 'USE' &&
          current.action !== item.action
      ) {
        errors.push(
          this.error(
            item.row,
            'ma_nguyen_lieu',
            'INCONSISTENT_INGREDIENT_DATA',
            `Nguyên liệu '${item.code}' có khai báo không thống nhất.`,
          ),
        );
      } else if (current.action === 'USE' && item.action !== 'USE') {
        result.set(item.code, item);
      }
    }
    return result;
  }

  private collectTags(
    parsed: ParsedMenuWorkbook,
    errors: MenuImportError[],
  ): Map<string, MenuImportTag> {
    const result = new Map<string, MenuImportTag>();
    for (const item of parsed.dishes.flatMap((dish) => dish.tags)) {
      const current = result.get(item.code);
      if (!current) {
        result.set(item.code, item);
      } else if (
        current.name &&
          item.name &&
          current.name !== item.name ||
        current.action !== 'USE' &&
          item.action !== 'USE' &&
          current.action !== item.action
      ) {
        errors.push(
          this.error(
            item.row,
            'ma_the',
            'INCONSISTENT_TAG_DATA',
            `Thẻ '${item.code}' có khai báo không thống nhất.`,
          ),
        );
      } else if (current.action === 'USE' && item.action !== 'USE') {
        result.set(item.code, item);
      }
    }
    return result;
  }

  private validateCatalogAction(
    row: number,
    column: string,
    code: string,
    action: 'CREATE' | 'UPDATE' | 'USE',
    exists: boolean,
    errors: MenuImportError[],
    prefix: string,
  ): void {
    if (action === 'CREATE' && exists) {
      errors.push(
        this.error(
          row,
          column,
          `${prefix}_ALREADY_EXISTS`,
          `'${code}' đã tồn tại.`,
        ),
      );
    }
    if ((action === 'UPDATE' || action === 'USE') && !exists) {
      errors.push(
        this.error(
          row,
          column,
          `${prefix}_NOT_FOUND`,
          `Không tìm thấy '${code}'.`,
        ),
      );
    }
  }

  private validateDish(
    dish: MenuImportDish,
    parsed: ParsedMenuWorkbook,
    categories: Map<string, bigint>,
    existingDishes: Map<string, ExistingDish>,
  ): void {
    const add = (column: string, code: string, message: string) =>
      parsed.errors.push(
        this.error(dish.row, column, code, message, dish.slug),
      );
    const existing = existingDishes.get(dish.slug);
    if (dish.action === 'CREATE' && existing) {
      add('dish_slug', 'DISH_ALREADY_EXISTS', `Món '${dish.slug}' đã tồn tại.`);
    }
    if (dish.action === 'UPDATE' && !existing) {
      add('dish_slug', 'DISH_NOT_FOUND', `Không tìm thấy món '${dish.slug}'.`);
    }
    if (
      !categories.has(dish.categorySlug) &&
      !parsed.categories.some(
        (category) =>
          category.slug === dish.categorySlug && category.action === 'CREATE',
      )
    ) {
      add(
        'danh_muc_slug',
        'CATEGORY_NOT_FOUND',
        `Không tìm thấy danh mục '${dish.categorySlug}'.`,
      );
    }
    if (dish.action === 'CREATE' && dish.variants.length === 0) {
      add(
        'ten_bien_the',
        'VARIANT_REQUIRED',
        'Món tạo mới phải có ít nhất một biến thể.',
      );
    }
    if (
      dish.action === 'CREATE' &&
      dish.ingredients.length === 0 &&
      dish.ingredientDataStatus &&
      dish.ingredientDataStatus !== dishes_ingredient_data_status.UNKNOWN
    ) {
      add(
        'trang_thai_nguyen_lieu',
        'INVALID_INGREDIENT_STATUS',
        'Món không có nguyên liệu phải dùng trạng thái UNKNOWN.',
      );
    }
    if (dish.availability !== 'AVAILABLE') return;
    const activeVariants = new Map(
      (existing?.dish_variants ?? []).map((variant) => [
        variant.name,
        variant.is_active,
      ]),
    );
    dish.variants.forEach((variant) =>
      activeVariants.set(variant.name, variant.isActive),
    );
    if (![...activeVariants.values()].some(Boolean)) {
      add(
        'bien_the_hoat_dong',
        'ACTIVE_VARIANT_REQUIRED',
        'Món đang mở bán phải có ít nhất một biến thể hoạt động.',
      );
    }
  }

  private async applyCategories(
    tx: Prisma.TransactionClient,
    parsed: ParsedMenuWorkbook,
    categories: Map<string, bigint>,
  ): Promise<void> {
    for (const category of parsed.categories) {
      if (category.action === 'CREATE') {
        const created = await tx.categories.create({
          data: {
            slug: category.slug,
            name: category.name,
            sort_order: category.sortOrder,
            is_active: category.isActive,
          },
        });
        categories.set(category.slug, created.id);
      } else {
        await tx.categories.update({
          where: { id: categories.get(category.slug)! },
          data: {
            name: category.name,
            sort_order: category.sortOrder,
            is_active: category.isActive,
          },
        });
      }
    }
  }

  private async applyIngredients(
    tx: Prisma.TransactionClient,
    imports: Map<string, MenuImportIngredient>,
    ingredients: Map<string, bigint>,
  ): Promise<void> {
    for (const item of imports.values()) {
      if (item.action === 'CREATE') {
        const created = await tx.ingredients.create({
          data: {
            code: item.code,
            name: item.name!,
            is_allergen: item.isAllergen ?? false,
          },
        });
        ingredients.set(item.code, created.id);
      } else if (item.action === 'UPDATE') {
        await tx.ingredients.update({
          where: { id: ingredients.get(item.code)! },
          data: { name: item.name!, is_allergen: item.isAllergen },
        });
      }
    }
  }

  private async applyTags(
    tx: Prisma.TransactionClient,
    imports: Map<string, MenuImportTag>,
    tags: Map<string, bigint>,
  ): Promise<void> {
    for (const item of imports.values()) {
      if (item.action === 'CREATE') {
        const created = await tx.tags.create({
          data: { code: item.code, name: item.name! },
        });
        tags.set(item.code, created.id);
      } else if (item.action === 'UPDATE') {
        await tx.tags.update({
          where: { id: tags.get(item.code)! },
          data: { name: item.name! },
        });
      }
    }
  }

  private async applyDish(
    tx: Prisma.TransactionClient,
    dish: MenuImportDish,
    existing: ExistingDish | undefined,
    categories: Map<string, bigint>,
    ingredients: Map<string, bigint>,
    tags: Map<string, bigint>,
  ): Promise<void> {
    const ingredientStatus = this.ingredientStatus(dish);
    const dishRow =
      dish.action === 'CREATE'
        ? await tx.dishes.create({
            data: {
              category_id: categories.get(dish.categorySlug)!,
              name: dish.name,
              slug: dish.slug,
              description: dish.description,
              story: dish.story,
              spicy_level: dish.spicyLevel,
              availability: dish.availability,
              sort_order: dish.sortOrder,
              ingredient_data_status:
                ingredientStatus ?? dishes_ingredient_data_status.UNKNOWN,
            },
          })
        : await tx.dishes.update({
            where: { id: existing!.id },
            data: {
              category_id: categories.get(dish.categorySlug)!,
              name: dish.name,
              description: dish.description,
              story: dish.story,
              spicy_level: dish.spicyLevel,
              availability: dish.availability,
              sort_order: dish.sortOrder,
              ingredient_data_status: ingredientStatus,
            },
          });
    const dishId = dishRow.id;

    const existingVariants = new Map(
      (existing?.dish_variants ?? []).map((item) => [item.name, item]),
    );
    for (const variant of dish.variants) {
      const current = existingVariants.get(variant.name);
      if (current) {
        await tx.dish_variants.update({
          where: { id: current.id },
          data: { price: variant.price, is_active: variant.isActive },
        });
      } else {
        await tx.dish_variants.create({
          data: {
            dish_id: dishId,
            name: variant.name,
            price: variant.price,
            is_active: variant.isActive,
          },
        });
      }
    }

    if (dish.ingredients.length > 0) {
      await tx.dish_ingredients.deleteMany({ where: { dish_id: dishId } });
      await tx.dish_ingredients.createMany({
        data: dish.ingredients.map((item) => ({
          dish_id: dishId,
          ingredient_id: ingredients.get(item.code)!,
          note: item.note,
        })),
      });
    }
    if (dish.tags.length > 0) {
      await tx.dish_tags.deleteMany({ where: { dish_id: dishId } });
      await tx.dish_tags.createMany({
        data: dish.tags.map((item) => ({
          dish_id: dishId,
          tag_id: tags.get(item.code)!,
        })),
      });
    }

    if (dish.images.length > 0) {
      const importedCover = dish.images.some((item) => item.kind === 'COVER');
      if (importedCover) {
        await tx.dish_images.updateMany({
          where: { dish_id: dishId, kind: dish_images_kind.COVER },
          data: { kind: dish_images_kind.GALLERY },
        });
      }
      const existingImages = new Map(
        (existing?.dish_images ?? []).map((item) => [item.asset_path, item]),
      );
      for (let index = 0; index < dish.images.length; index++) {
        const image = dish.images[index];
        const kind =
          dish.action === 'CREATE' && !importedCover && index === 0
            ? dish_images_kind.COVER
            : image.kind;
        const current = existingImages.get(image.assetPath);
        if (current) {
          await tx.dish_images.update({
            where: { id: current.id },
            data: {
              kind,
              alt_text: image.altText || dish.name,
              sort_order: image.sortOrder,
            },
          });
        } else {
          await tx.dish_images.create({
            data: {
              dish_id: dishId,
              asset_path: image.assetPath,
              kind,
              alt_text: image.altText || dish.name,
              sort_order: image.sortOrder,
            },
          });
        }
      }
    }

    const existingGroups = new Map(
      (existing?.option_groups ?? []).map((item) => [item.name, item]),
    );
    for (const group of dish.optionGroups) {
      const currentGroup = existingGroups.get(group.name);
      const savedGroup = currentGroup
        ? await tx.option_groups.update({
            where: { id: currentGroup.id },
            data: {
              min_select: group.minSelect,
              max_select: group.maxSelect,
              is_active: group.isActive,
            },
          })
        : await tx.option_groups.create({
            data: {
              dish_id: dishId,
              name: group.name,
              min_select: group.minSelect,
              max_select: group.maxSelect,
              is_active: group.isActive,
            },
          });
      const existingValues = new Map(
        (currentGroup?.option_values ?? []).map((item) => [item.name, item]),
      );
      for (const value of group.values) {
        const currentValue = existingValues.get(value.name);
        if (currentValue) {
          await tx.option_values.update({
            where: { id: currentValue.id },
            data: {
              extra_price: value.extraPrice,
              is_active: value.isActive,
            },
          });
        } else {
          await tx.option_values.create({
            data: {
              dish_id: dishId,
              group_id: savedGroup.id,
              name: value.name,
              extra_price: value.extraPrice,
              is_active: value.isActive,
            },
          });
        }
      }
    }
  }

  private ingredientStatus(dish: MenuImportDish) {
    if (dish.ingredients.length === 0) {
      return dish.action === 'CREATE'
        ? dishes_ingredient_data_status.UNKNOWN
        : dish.ingredientDataStatus;
    }
    return !dish.ingredientDataStatus ||
      dish.ingredientDataStatus === dishes_ingredient_data_status.UNKNOWN
      ? dishes_ingredient_data_status.PARTIAL
      : dish.ingredientDataStatus;
  }

  private error(
    row: number,
    column: string,
    code: string,
    message: string,
    slug?: string,
  ): MenuImportError {
    return { sheet: MENU_IMPORT_SHEET, row, column, code, message, slug };
  }

  private columnWidth(header: string): number {
    if (['mo_ta', 'cau_chuyen', 'url_anh'].includes(header)) return 34;
    if (['ghi_chu_nguyen_lieu', 'ten_nhom_tuy_chon'].includes(header)) return 26;
    return Math.max(16, header.length + 3);
  }
}
