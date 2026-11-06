import ExcelJS from 'exceljs';
import {
  MENU_IMPORT_HEADERS,
  parseMenuWorkbook,
} from './menu-import.parser.js';

async function workbookBuffer(
  rows: Record<string, unknown>[],
  sheetName = 'THUC_DON',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = MENU_IMPORT_HEADERS.map((header) => ({
    header,
    key: header,
  }));
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe('parseMenuWorkbook', () => {
  it('parses every supported row type from one sheet', async () => {
    const buffer = await workbookBuffer([
      {
        loai_dong: 'CATEGORY',
        hanh_dong: 'CREATE',
        danh_muc_slug: 'mon-nuoc-test',
        danh_muc_ten: 'Món nước test',
        danh_muc_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'DISH',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-test',
        ten_mon: 'Phở bò test',
        danh_muc_slug: 'mon-nuoc-test',
        muc_cay: 0,
        trang_thai: 'AVAILABLE',
        trang_thai_nguyen_lieu: 'VERIFIED',
      },
      {
        loai_dong: 'VARIANT',
        dish_slug: 'pho-bo-test',
        ten_bien_the: 'Tiêu chuẩn',
        gia: 50000,
        bien_the_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'VARIANT',
        dish_slug: 'pho-bo-test',
        ten_bien_the: 'Đặc biệt',
        gia: 70000,
        bien_the_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'INGREDIENT',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-test',
        ma_nguyen_lieu: 'thit-bo-test',
        ten_nguyen_lieu: 'Thịt bò test',
        gay_di_ung: 'FALSE',
        ghi_chu_nguyen_lieu: 'Thái mỏng',
      },
      {
        loai_dong: 'TAG',
        hanh_dong: 'CREATE',
        dish_slug: 'pho-bo-test',
        ma_the: 'dac-san-test',
        ten_the: 'Đặc sản test',
      },
      {
        loai_dong: 'IMAGE',
        dish_slug: 'pho-bo-test',
        url_anh: 'https://example.com/pho.jpg',
        loai_anh: 'COVER',
        alt_anh: 'Phở bò',
      },
      {
        loai_dong: 'OPTION_GROUP',
        dish_slug: 'pho-bo-test',
        ten_nhom_tuy_chon: 'Topping',
        chon_toi_thieu: 0,
        chon_toi_da: 2,
        nhom_hoat_dong: 'TRUE',
      },
      {
        loai_dong: 'OPTION_VALUE',
        dish_slug: 'pho-bo-test',
        ten_nhom_tuy_chon: 'Topping',
        ten_gia_tri: 'Thêm trứng',
        gia_them: 10000,
        gia_tri_hoat_dong: 'TRUE',
      },
    ]);

    const parsed = await parseMenuWorkbook(buffer);

    expect(parsed.errors).toEqual([]);
    expect(parsed.categories).toHaveLength(1);
    expect(parsed.dishes).toHaveLength(1);
    expect(parsed.dishes[0].variants).toHaveLength(2);
    expect(parsed.dishes[0].ingredients[0]).toMatchObject({
      code: 'thit-bo-test',
      name: 'Thịt bò test',
      note: 'Thái mỏng',
    });
    expect(parsed.dishes[0].tags[0].code).toBe('dac-san-test');
    expect(parsed.dishes[0].images[0].kind).toBe('COVER');
    expect(parsed.dishes[0].optionGroups[0].values[0]).toMatchObject({
      name: 'Thêm trứng',
      extraPrice: 10000,
    });
  });

  it('rejects formulas', async () => {
    const buffer = await workbookBuffer([
      {
        loai_dong: 'VARIANT',
        dish_slug: 'pho-bo-test',
        ten_bien_the: 'Tiêu chuẩn',
        gia: { formula: '25000*2', result: 50000 },
      },
    ]);

    const parsed = await parseMenuWorkbook(buffer);

    expect(parsed.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 2,
          column: 'gia',
          code: 'FORMULA_NOT_ALLOWED',
        }),
      ]),
    );
  });

  it('requires the THUC_DON sheet', async () => {
    const parsed = await parseMenuWorkbook(
      await workbookBuffer([], 'SAI_TEN'),
    );
    expect(parsed.errors[0].code).toBe('SHEET_NOT_FOUND');
  });
});
