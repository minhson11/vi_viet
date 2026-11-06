import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/database/prisma.service.js';
import { MENU_IMPORT_HEADERS } from '../src/modules/menu/services/menu-import.parser.js';
import { createE2eApp } from './setup/create-e2e-app.js';

describe('Menu Excel import', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService | undefined;
  let adminToken = '';
  const suffix = `${Date.now()}`;
  const slug = `excel-import-test-${suffix}`;
  const failedSlug = `excel-import-test-fail-${suffix}`;
  const categorySlug = `excel-import-category-${suffix}`;
  const ingredientCode = `excel-import-ingredient-${suffix}`;
  const tagCode = `excel-import-tag-${suffix}`;

  async function workbook(
    action: 'CREATE' | 'UPDATE',
    rows: Array<{ variant: string; price: number }>,
    dishSlug = slug,
    dishCategory = categorySlug,
  ): Promise<Buffer> {
    const file = new ExcelJS.Workbook();
    const sheet = file.addWorksheet('THUC_DON');
    sheet.columns = MENU_IMPORT_HEADERS.map((header) => ({
      header,
      key: header,
    }));
    sheet.addRow({
      loai_dong: 'DISH',
      hanh_dong: action,
      dish_slug: dishSlug,
      ten_mon: `Món import test ${suffix}`,
      danh_muc_slug: dishCategory,
      mo_ta: 'Dữ liệu kiểm thử sẽ được dọn sau test',
      muc_cay: 1,
      trang_thai: 'AVAILABLE',
      thu_tu: 99,
      trang_thai_nguyen_lieu: action === 'CREATE' ? 'VERIFIED' : '',
    });
    for (const row of rows) {
      sheet.addRow({
        loai_dong: 'VARIANT',
        dish_slug: dishSlug,
        ten_bien_the: row.variant,
        gia: row.price,
        bien_the_hoat_dong: 'TRUE',
      });
    }
    if (action === 'CREATE') {
      sheet.addRow({
        loai_dong: 'INGREDIENT',
        hanh_dong: 'USE',
        dish_slug: dishSlug,
        ma_nguyen_lieu: ingredientCode,
        ghi_chu_nguyen_lieu: 'Kiểm thử',
      });
      sheet.addRow({
        loai_dong: 'TAG',
        hanh_dong: 'USE',
        dish_slug: dishSlug,
        ma_the: tagCode,
      });
      sheet.addRow({
        loai_dong: 'IMAGE',
        dish_slug: dishSlug,
        url_anh: `https://example.com/${dishSlug}.jpg`,
        loai_anh: 'COVER',
        alt_anh: 'Ảnh kiểm thử',
      });
      sheet.addRow({
        loai_dong: 'OPTION_GROUP',
        dish_slug: dishSlug,
        ten_nhom_tuy_chon: 'Topping test',
        chon_toi_thieu: 0,
        chon_toi_da: 2,
        nhom_hoat_dong: 'TRUE',
      });
      sheet.addRow({
        loai_dong: 'OPTION_VALUE',
        dish_slug: dishSlug,
        ten_nhom_tuy_chon: 'Topping test',
        ten_gia_tri: 'Thêm trứng',
        gia_them: 10000,
        gia_tri_hoat_dong: 'TRUE',
      });
    }
    return Buffer.from(await file.xlsx.writeBuffer());
  }

  const authorized = () =>
    request(app!.getHttpServer()).post('/api/v1/admin/menu/import');

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
    adminToken = await app.get(JwtService).signAsync(
      { sub: '1', email: 'admin@viviet.test', role: 'ADMIN', status: 'ACTIVE' },
      {
        secret: 'vi_viet_super_secret_jwt_access_token_key_2026',
        expiresIn: '1h',
      },
    );
    await prisma.categories.create({
      data: { name: `Excel import test ${suffix}`, slug: categorySlug },
    });
    await prisma.ingredients.create({
      data: { name: `Nguyên liệu test ${suffix}`, code: ingredientCode },
    });
    await prisma.tags.create({
      data: { name: `Thẻ test ${suffix}`, code: tagCode },
    });
  });

  afterAll(async () => {
    if (prisma) {
      const dishes = await prisma.dishes.findMany({
        where: { slug: { in: [slug, failedSlug] } },
        select: { id: true },
      });
      for (const dish of dishes) {
        await prisma.dish_images.deleteMany({ where: { dish_id: dish.id } });
        await prisma.dish_tags.deleteMany({ where: { dish_id: dish.id } });
        await prisma.dish_ingredients.deleteMany({ where: { dish_id: dish.id } });
        await prisma.option_values.deleteMany({ where: { dish_id: dish.id } });
        await prisma.option_groups.deleteMany({ where: { dish_id: dish.id } });
        await prisma.dish_variants.deleteMany({ where: { dish_id: dish.id } });
        await prisma.dishes.delete({ where: { id: dish.id } });
      }
      await prisma.tags.deleteMany({ where: { code: tagCode } });
      await prisma.ingredients.deleteMany({ where: { code: ingredientCode } });
      await prisma.categories.deleteMany({ where: { slug: categorySlug } });
    }
    await app?.close();
  });

  it('blocks users without an admin token', async () => {
    const response = await authorized().attach(
      'file',
      await workbook('CREATE', [{ variant: 'Tiêu chuẩn', price: 50000 }]),
      'menu.xlsx',
    );
    expect([401, 403]).toContain(response.status);
  });

  it('previews without writing database data', async () => {
    const response = await request(app!.getHttpServer())
      .post('/api/v1/admin/menu/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach(
        'file',
        await workbook('CREATE', [
          { variant: 'Tiêu chuẩn', price: 50000 },
          { variant: 'Đặc biệt', price: 70000 },
        ]),
        'menu.xlsx',
      );

    expect(response.status).toBe(200);
    expect(response.body.data.valid).toBe(true);
    expect(response.body.data.summary).toMatchObject({
      rows: 8,
      dishes: 1,
      create: 1,
    });
    expect(await prisma!.dishes.findUnique({ where: { slug } })).toBeNull();
  });

  it('creates a complete dish from one sheet', async () => {
    const response = await authorized()
      .set('Authorization', `Bearer ${adminToken}`)
      .attach(
        'file',
        await workbook('CREATE', [
          { variant: 'Tiêu chuẩn', price: 50000 },
          { variant: 'Đặc biệt', price: 70000 },
        ]),
        'menu.xlsx',
      );

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      success: true,
      imported: 1,
      created: 1,
    });
    const saved = await prisma!.dishes.findUnique({
      where: { slug },
      include: {
        dish_variants: true,
        dish_ingredients: true,
        dish_tags: true,
        dish_images: true,
        option_groups: { include: { option_values: true } },
      },
    });
    expect(saved?.dish_variants).toHaveLength(2);
    expect(saved?.dish_ingredients).toHaveLength(1);
    expect(saved?.dish_tags).toHaveLength(1);
    expect(saved?.dish_images).toHaveLength(1);
    expect(saved?.option_groups).toHaveLength(1);
    expect(saved?.option_groups[0].option_values).toHaveLength(1);
  });

  it('updates listed variants without deleting variants omitted from Excel', async () => {
    const response = await authorized()
      .set('Authorization', `Bearer ${adminToken}`)
      .attach(
        'file',
        await workbook('UPDATE', [{ variant: 'Tiêu chuẩn', price: 55000 }]),
        'menu.xlsx',
      );

    expect(response.status).toBe(201);
    const saved = await prisma!.dishes.findUnique({
      where: { slug },
      include: {
        dish_variants: { orderBy: { price: 'asc' } },
        dish_ingredients: true,
        dish_tags: true,
      },
    });
    expect(saved?.dish_variants).toHaveLength(2);
    expect(Number(saved?.dish_variants[0].price)).toBe(55000);
    expect(saved?.dish_ingredients).toHaveLength(1);
    expect(saved?.dish_tags).toHaveLength(1);
  });

  it('writes nothing when validation fails', async () => {
    const response = await authorized()
      .set('Authorization', `Bearer ${adminToken}`)
      .attach(
        'file',
        await workbook(
          'CREATE',
          [{ variant: 'Tiêu chuẩn', price: 50000 }],
          failedSlug,
          'danh-muc-khong-ton-tai',
        ),
        'menu.xlsx',
      );

    expect(response.status).toBe(400);
    expect(
      await prisma!.dishes.findUnique({ where: { slug: failedSlug } }),
    ).toBeNull();
  });
});

