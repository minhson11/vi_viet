import ExcelJS from 'exceljs';
import {
  dish_images_kind,
  dishes_availability,
  dishes_ingredient_data_status,
} from '@prisma/client';
import { slugify } from '../../../common/utils/slug.util.js';
import type {
  CatalogImportAction,
  MenuImportAction,
  MenuImportCategory,
  MenuImportDish,
  MenuImportError,
  MenuImportImage,
  MenuImportIngredient,
  MenuImportOptionGroup,
  MenuImportOptionValue,
  MenuImportRowType,
  MenuImportTag,
  MenuImportVariant,
  ParsedMenuWorkbook,
} from './menu-import.types.js';

export const MENU_IMPORT_SHEET = 'THUC_DON';
export const MENU_IMPORT_HEADERS = [
  'loai_dong',
  'hanh_dong',
  'dish_slug',
  'ten_mon',
  'danh_muc_slug',
  'danh_muc_ten',
  'danh_muc_hoat_dong',
  'mo_ta',
  'cau_chuyen',
  'muc_cay',
  'trang_thai',
  'thu_tu',
  'trang_thai_nguyen_lieu',
  'ten_bien_the',
  'gia',
  'bien_the_hoat_dong',
  'ma_nguyen_lieu',
  'ten_nguyen_lieu',
  'gay_di_ung',
  'ghi_chu_nguyen_lieu',
  'ma_the',
  'ten_the',
  'url_anh',
  'loai_anh',
  'alt_anh',
  'thu_tu_anh',
  'ten_nhom_tuy_chon',
  'chon_toi_thieu',
  'chon_toi_da',
  'nhom_hoat_dong',
  'ten_gia_tri',
  'gia_them',
  'gia_tri_hoat_dong',
] as const;

const ROW_TYPES: MenuImportRowType[] = [
  'CATEGORY',
  'DISH',
  'VARIANT',
  'INGREDIENT',
  'TAG',
  'IMAGE',
  'OPTION_GROUP',
  'OPTION_VALUE',
];
const MAX_ROWS = 2_000;
const MAX_DISHES = 500;

interface PendingDishData {
  firstRow: number;
  variants: MenuImportVariant[];
  ingredients: MenuImportIngredient[];
  tags: MenuImportTag[];
  images: MenuImportImage[];
  optionGroups: MenuImportOptionGroup[];
  optionValues: Array<{
    groupName: string;
    value: MenuImportOptionValue;
  }>;
}

function issue(
  row: number,
  column: string,
  code: string,
  message: string,
  slug?: string,
): MenuImportError {
  return { sheet: MENU_IMPORT_SHEET, row, column, code, message, slug };
}

function hasFormula(cell: ExcelJS.Cell): boolean {
  return Boolean(
    cell.value && typeof cell.value === 'object' && 'formula' in cell.value,
  );
}

function text(cell: ExcelJS.Cell): string {
  return cell.text.trim();
}

function parseInteger(
  value: string,
  row: number,
  column: string,
  errors: MenuImportError[],
  options: { min?: number; max?: number; fallback?: number } = {},
): number | undefined {
  if (!value && options.fallback !== undefined) return options.fallback;
  if (!/^-?\d+$/.test(value.replace(/\s/g, ''))) {
    errors.push(
      issue(
        row,
        column,
        'INVALID_NUMBER',
        `Giá trị '${value}' phải là số nguyên không có dấu phân cách.`,
      ),
    );
    return undefined;
  }
  const number = Number(value.replace(/\s/g, ''));
  if (
    !Number.isSafeInteger(number) ||
    (options.min !== undefined && number < options.min) ||
    (options.max !== undefined && number > options.max)
  ) {
    errors.push(
      issue(row, column, 'INVALID_NUMBER', `Giá trị '${value}' không hợp lệ.`),
    );
    return undefined;
  }
  return number;
}

function parseBoolean(
  value: string,
  row: number,
  column: string,
  errors: MenuImportError[],
  fallback?: boolean,
): boolean | undefined {
  if (!value && fallback !== undefined) return fallback;
  const normalized = value.toUpperCase();
  if (normalized === 'TRUE') return true;
  if (normalized === 'FALSE') return false;
  errors.push(
    issue(
      row,
      column,
      'INVALID_BOOLEAN',
      `Giá trị '${value}' phải là TRUE hoặc FALSE.`,
    ),
  );
  return undefined;
}

function required(
  value: string,
  row: number,
  column: string,
  errors: MenuImportError[],
): string {
  if (!value) {
    errors.push(
      issue(
        row,
        column,
        'REQUIRED_VALUE_MISSING',
        `Cột '${column}' không được để trống.`,
      ),
    );
  }
  return value;
}

function maxLength(
  value: string,
  max: number,
  row: number,
  column: string,
  errors: MenuImportError[],
): void {
  if (value.length > max) {
    errors.push(
      issue(
        row,
        column,
        'VALUE_TOO_LONG',
        `Cột '${column}' tối đa ${max} ký tự.`,
      ),
    );
  }
}

function normalizeSlug(
  value: string,
  row: number,
  column: string,
  errors: MenuImportError[],
): string {
  try {
    return slugify(value);
  } catch {
    errors.push(issue(row, column, 'INVALID_SLUG', `Cột '${column}' không hợp lệ.`));
    return '';
  }
}

function parseAction(
  value: string,
  row: number,
  errors: MenuImportError[],
  allowUse = false,
): MenuImportAction | CatalogImportAction | undefined {
  const normalized = value.toUpperCase();
  const allowed = allowUse ? ['CREATE', 'UPDATE', 'USE'] : ['CREATE', 'UPDATE'];
  if (allowed.includes(normalized)) {
    return normalized as MenuImportAction | CatalogImportAction;
  }
  errors.push(
    issue(
      row,
      'hanh_dong',
      'INVALID_ENUM',
      `Hành động phải là ${allowed.join(', ')}.`,
    ),
  );
  return undefined;
}

function pendingFor(
  pending: Map<string, PendingDishData>,
  slug: string,
  row: number,
): PendingDishData {
  let data = pending.get(slug);
  if (!data) {
    data = {
      firstRow: row,
      variants: [],
      ingredients: [],
      tags: [],
      images: [],
      optionGroups: [],
      optionValues: [],
    };
    pending.set(slug, data);
  }
  return data;
}

export async function parseMenuWorkbook(
  buffer: Buffer,
): Promise<ParsedMenuWorkbook> {
  const workbook = new ExcelJS.Workbook();
  const errors: MenuImportError[] = [];
  try {
    await workbook.xlsx.load(Uint8Array.from(buffer).buffer);
  } catch {
    return {
      rows: 0,
      categories: [],
      dishes: [],
      errors: [
        issue(
          1,
          'file',
          'INVALID_FILE',
          'Không thể đọc file Excel. File có thể bị hỏng hoặc không đúng định dạng .xlsx.',
        ),
      ],
    };
  }

  if (workbook.worksheets.length !== 1) {
    return {
      rows: 0,
      categories: [],
      dishes: [],
      errors: [
        issue(
          1,
          'sheet',
          'INVALID_SHEET_COUNT',
          `File chỉ được có một sheet tên '${MENU_IMPORT_SHEET}'.`,
        ),
      ],
    };
  }
  const worksheet = workbook.getWorksheet(MENU_IMPORT_SHEET);
  if (!worksheet) {
    return {
      rows: 0,
      categories: [],
      dishes: [],
      errors: [
        issue(
          1,
          'sheet',
          'SHEET_NOT_FOUND',
          `File phải có sheet tên '${MENU_IMPORT_SHEET}'.`,
        ),
      ],
    };
  }

  const headerIndexes = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, column) => {
    headerIndexes.set(text(cell).toLowerCase(), column);
  });
  const missingHeaders = MENU_IMPORT_HEADERS.filter(
    (header) => !headerIndexes.has(header),
  );
  if (missingHeaders.length > 0) {
    return {
      rows: 0,
      categories: [],
      dishes: [],
      errors: [
        issue(
          1,
          'header',
          'INVALID_HEADERS',
          `Thiếu cột: ${missingHeaders.join(', ')}.`,
        ),
      ],
    };
  }

  const dataRows = Math.max(worksheet.actualRowCount - 1, 0);
  if (dataRows > MAX_ROWS) {
    return {
      rows: dataRows,
      categories: [],
      dishes: [],
      errors: [
        issue(1, 'file', 'ROW_LIMIT_EXCEEDED', `File vượt ${MAX_ROWS} dòng.`),
      ],
    };
  }

  const get = (row: ExcelJS.Row, header: string) =>
    text(row.getCell(headerIndexes.get(header)!));
  const categories = new Map<string, MenuImportCategory>();
  const dishes = new Map<string, MenuImportDish>();
  const pending = new Map<string, PendingDishData>();
  let processedRows = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (
      MENU_IMPORT_HEADERS.every(
        (header) => !get(row, header),
      )
    ) {
      continue;
    }
    processedRows++;
    const before = errors.length;
    for (const header of MENU_IMPORT_HEADERS) {
      const cell = row.getCell(headerIndexes.get(header)!);
      if (hasFormula(cell)) {
        errors.push(
          issue(
            rowNumber,
            header,
            'FORMULA_NOT_ALLOWED',
            `Cột '${header}' không được chứa công thức.`,
          ),
        );
      }
    }
    if (errors.length > before) continue;

    const rowTypeText = required(
      get(row, 'loai_dong').toUpperCase(),
      rowNumber,
      'loai_dong',
      errors,
    );
    if (!ROW_TYPES.includes(rowTypeText as MenuImportRowType)) {
      errors.push(
        issue(
          rowNumber,
          'loai_dong',
          'INVALID_ROW_TYPE',
          `Loại dòng phải là: ${ROW_TYPES.join(', ')}.`,
        ),
      );
      continue;
    }
    const rowType = rowTypeText as MenuImportRowType;

    if (rowType === 'CATEGORY') {
      const action = parseAction(get(row, 'hanh_dong'), rowNumber, errors);
      const rawSlug = required(
        get(row, 'danh_muc_slug'),
        rowNumber,
        'danh_muc_slug',
        errors,
      );
      const slug = normalizeSlug(rawSlug, rowNumber, 'danh_muc_slug', errors);
      const name = required(
        get(row, 'danh_muc_ten'),
        rowNumber,
        'danh_muc_ten',
        errors,
      );
      const sortOrder = parseInteger(
        get(row, 'thu_tu'),
        rowNumber,
        'thu_tu',
        errors,
        { fallback: 0 },
      );
      const isActive = parseBoolean(
        get(row, 'danh_muc_hoat_dong'),
        rowNumber,
        'danh_muc_hoat_dong',
        errors,
        true,
      );
      maxLength(slug, 140, rowNumber, 'danh_muc_slug', errors);
      maxLength(name, 100, rowNumber, 'danh_muc_ten', errors);
      if (categories.has(slug)) {
        errors.push(
          issue(
            rowNumber,
            'danh_muc_slug',
            'DUPLICATE_CATEGORY',
            `Danh mục '${slug}' bị lặp trong file.`,
          ),
        );
      }
      if (errors.length === before) {
        categories.set(slug, {
          row: rowNumber,
          action: action as MenuImportAction,
          slug,
          name,
          sortOrder: sortOrder!,
          isActive: isActive!,
        });
      }
      continue;
    }

    const rawDishSlug = required(
      get(row, 'dish_slug'),
      rowNumber,
      'dish_slug',
      errors,
    );
    const dishSlug = normalizeSlug(
      rawDishSlug,
      rowNumber,
      'dish_slug',
      errors,
    );
    maxLength(dishSlug, 180, rowNumber, 'dish_slug', errors);

    if (rowType === 'DISH') {
      const action = parseAction(get(row, 'hanh_dong'), rowNumber, errors);
      const name = required(
        get(row, 'ten_mon'),
        rowNumber,
        'ten_mon',
        errors,
      );
      const rawCategorySlug = required(
        get(row, 'danh_muc_slug'),
        rowNumber,
        'danh_muc_slug',
        errors,
      );
      const categorySlug = normalizeSlug(
        rawCategorySlug,
        rowNumber,
        'danh_muc_slug',
        errors,
      );
      const availabilityText = required(
        get(row, 'trang_thai').toUpperCase(),
        rowNumber,
        'trang_thai',
        errors,
      );
      const availability = Object.values(dishes_availability).includes(
        availabilityText as dishes_availability,
      )
        ? (availabilityText as dishes_availability)
        : undefined;
      if (!availability) {
        errors.push(
          issue(
            rowNumber,
            'trang_thai',
            'INVALID_ENUM',
            'Trạng thái phải là AVAILABLE, SOLD_OUT hoặc HIDDEN.',
            dishSlug,
          ),
        );
      }
      const ingredientStatusText = get(
        row,
        'trang_thai_nguyen_lieu',
      ).toUpperCase();
      const ingredientDataStatus = ingredientStatusText
        ? Object.values(dishes_ingredient_data_status).includes(
            ingredientStatusText as dishes_ingredient_data_status,
          )
          ? (ingredientStatusText as dishes_ingredient_data_status)
          : undefined
        : undefined;
      if (ingredientStatusText && !ingredientDataStatus) {
        errors.push(
          issue(
            rowNumber,
            'trang_thai_nguyen_lieu',
            'INVALID_ENUM',
            'Trạng thái nguyên liệu phải là UNKNOWN, PARTIAL hoặc VERIFIED.',
            dishSlug,
          ),
        );
      }
      const spicyLevel = parseInteger(
        get(row, 'muc_cay'),
        rowNumber,
        'muc_cay',
        errors,
        { min: 0, max: 3, fallback: 0 },
      );
      const sortOrder = parseInteger(
        get(row, 'thu_tu'),
        rowNumber,
        'thu_tu',
        errors,
        { fallback: 0 },
      );
      maxLength(name, 160, rowNumber, 'ten_mon', errors);
      maxLength(categorySlug, 140, rowNumber, 'danh_muc_slug', errors);
      if (dishes.has(dishSlug)) {
        errors.push(
          issue(
            rowNumber,
            'dish_slug',
            'DUPLICATE_DISH',
            `Món '${dishSlug}' có nhiều dòng DISH.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        dishes.set(dishSlug, {
          row: rowNumber,
          action: action as MenuImportAction,
          slug: dishSlug,
          name,
          categorySlug,
          description: get(row, 'mo_ta') || null,
          story: get(row, 'cau_chuyen') || null,
          spicyLevel: spicyLevel!,
          availability: availability!,
          sortOrder: sortOrder!,
          ingredientDataStatus,
          variants: [],
          ingredients: [],
          tags: [],
          images: [],
          optionGroups: [],
        });
      }
      continue;
    }

    const data = pendingFor(pending, dishSlug, rowNumber);
    if (rowType === 'VARIANT') {
      const name = required(
        get(row, 'ten_bien_the'),
        rowNumber,
        'ten_bien_the',
        errors,
      );
      const price = parseInteger(
        get(row, 'gia'),
        rowNumber,
        'gia',
        errors,
        { min: 0 },
      );
      const isActive = parseBoolean(
        get(row, 'bien_the_hoat_dong'),
        rowNumber,
        'bien_the_hoat_dong',
        errors,
        true,
      );
      maxLength(name, 100, rowNumber, 'ten_bien_the', errors);
      if (data.variants.some((item) => item.name === name)) {
        errors.push(
          issue(
            rowNumber,
            'ten_bien_the',
            'DUPLICATE_VARIANT',
            `Biến thể '${name}' bị lặp.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        data.variants.push({
          row: rowNumber,
          name,
          price: price!,
          isActive: isActive!,
        });
      }
      continue;
    }

    if (rowType === 'INGREDIENT') {
      const action = parseAction(
        get(row, 'hanh_dong') || 'USE',
        rowNumber,
        errors,
        true,
      );
      const code = required(
        get(row, 'ma_nguyen_lieu').toLowerCase(),
        rowNumber,
        'ma_nguyen_lieu',
        errors,
      );
      const name = get(row, 'ten_nguyen_lieu');
      if (action !== 'USE' && !name) {
        required(name, rowNumber, 'ten_nguyen_lieu', errors);
      }
      const allergenText = get(row, 'gay_di_ung');
      const isAllergen = allergenText
        ? parseBoolean(
            allergenText,
            rowNumber,
            'gay_di_ung',
            errors,
          )
        : undefined;
      maxLength(code, 100, rowNumber, 'ma_nguyen_lieu', errors);
      maxLength(name, 120, rowNumber, 'ten_nguyen_lieu', errors);
      maxLength(
        get(row, 'ghi_chu_nguyen_lieu'),
        500,
        rowNumber,
        'ghi_chu_nguyen_lieu',
        errors,
      );
      if (data.ingredients.some((item) => item.code === code)) {
        errors.push(
          issue(
            rowNumber,
            'ma_nguyen_lieu',
            'DUPLICATE_INGREDIENT',
            `Nguyên liệu '${code}' bị lặp trong món.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        data.ingredients.push({
          row: rowNumber,
          action: action as CatalogImportAction,
          code,
          name: name || undefined,
          isAllergen,
          note: get(row, 'ghi_chu_nguyen_lieu') || null,
        });
      }
      continue;
    }

    if (rowType === 'TAG') {
      const action = parseAction(
        get(row, 'hanh_dong') || 'USE',
        rowNumber,
        errors,
        true,
      );
      const code = required(
        get(row, 'ma_the').toLowerCase(),
        rowNumber,
        'ma_the',
        errors,
      );
      const name = get(row, 'ten_the');
      if (action !== 'USE' && !name) required(name, rowNumber, 'ten_the', errors);
      maxLength(code, 80, rowNumber, 'ma_the', errors);
      maxLength(name, 100, rowNumber, 'ten_the', errors);
      if (data.tags.some((item) => item.code === code)) {
        errors.push(
          issue(
            rowNumber,
            'ma_the',
            'DUPLICATE_TAG',
            `Thẻ '${code}' bị lặp trong món.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        data.tags.push({
          row: rowNumber,
          action: action as CatalogImportAction,
          code,
          name: name || undefined,
        });
      }
      continue;
    }

    if (rowType === 'IMAGE') {
      const assetPath = required(
        get(row, 'url_anh'),
        rowNumber,
        'url_anh',
        errors,
      );
      const kindText = (get(row, 'loai_anh') || 'GALLERY').toUpperCase();
      const kind = Object.values(dish_images_kind).includes(
        kindText as dish_images_kind,
      )
        ? (kindText as dish_images_kind)
        : undefined;
      if (!kind) {
        errors.push(
          issue(
            rowNumber,
            'loai_anh',
            'INVALID_ENUM',
            'Loại ảnh phải là COVER, GALLERY hoặc CUTOUT.',
            dishSlug,
          ),
        );
      }
      const sortOrder = parseInteger(
        get(row, 'thu_tu_anh'),
        rowNumber,
        'thu_tu_anh',
        errors,
        { fallback: 0 },
      );
      maxLength(assetPath, 500, rowNumber, 'url_anh', errors);
      maxLength(get(row, 'alt_anh'), 255, rowNumber, 'alt_anh', errors);
      if (data.images.some((item) => item.assetPath === assetPath)) {
        errors.push(
          issue(
            rowNumber,
            'url_anh',
            'DUPLICATE_IMAGE',
            `Ảnh '${assetPath}' bị lặp.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        data.images.push({
          row: rowNumber,
          assetPath,
          kind: kind!,
          altText: get(row, 'alt_anh') || null,
          sortOrder: sortOrder!,
        });
      }
      continue;
    }

    if (rowType === 'OPTION_GROUP') {
      const name = required(
        get(row, 'ten_nhom_tuy_chon'),
        rowNumber,
        'ten_nhom_tuy_chon',
        errors,
      );
      const minSelect = parseInteger(
        get(row, 'chon_toi_thieu'),
        rowNumber,
        'chon_toi_thieu',
        errors,
        { min: 0, fallback: 0 },
      );
      const maxSelect = parseInteger(
        get(row, 'chon_toi_da'),
        rowNumber,
        'chon_toi_da',
        errors,
        { min: 1, fallback: 1 },
      );
      const isActive = parseBoolean(
        get(row, 'nhom_hoat_dong'),
        rowNumber,
        'nhom_hoat_dong',
        errors,
        true,
      );
      maxLength(name, 100, rowNumber, 'ten_nhom_tuy_chon', errors);
      if (
        minSelect !== undefined &&
        maxSelect !== undefined &&
        maxSelect < minSelect
      ) {
        errors.push(
          issue(
            rowNumber,
            'chon_toi_da',
            'INVALID_OPTION_RANGE',
            'Số lựa chọn tối đa không được nhỏ hơn tối thiểu.',
            dishSlug,
          ),
        );
      }
      if (data.optionGroups.some((item) => item.name === name)) {
        errors.push(
          issue(
            rowNumber,
            'ten_nhom_tuy_chon',
            'DUPLICATE_OPTION_GROUP',
            `Nhóm tùy chọn '${name}' bị lặp.`,
            dishSlug,
          ),
        );
      }
      if (errors.length === before) {
        data.optionGroups.push({
          row: rowNumber,
          name,
          minSelect: minSelect!,
          maxSelect: maxSelect!,
          isActive: isActive!,
          values: [],
        });
      }
      continue;
    }

    const groupName = required(
      get(row, 'ten_nhom_tuy_chon'),
      rowNumber,
      'ten_nhom_tuy_chon',
      errors,
    );
    const name = required(
      get(row, 'ten_gia_tri'),
      rowNumber,
      'ten_gia_tri',
      errors,
    );
    const extraPrice = parseInteger(
      get(row, 'gia_them'),
      rowNumber,
      'gia_them',
      errors,
      { min: 0, fallback: 0 },
    );
    const isActive = parseBoolean(
      get(row, 'gia_tri_hoat_dong'),
      rowNumber,
      'gia_tri_hoat_dong',
      errors,
      true,
    );
    maxLength(groupName, 100, rowNumber, 'ten_nhom_tuy_chon', errors);
    maxLength(name, 100, rowNumber, 'ten_gia_tri', errors);
    if (
      data.optionValues.some(
        (item) => item.groupName === groupName && item.value.name === name,
      )
    ) {
      errors.push(
        issue(
          rowNumber,
          'ten_gia_tri',
          'DUPLICATE_OPTION_VALUE',
          `Giá trị '${name}' bị lặp trong nhóm '${groupName}'.`,
          dishSlug,
        ),
      );
    }
    if (errors.length === before) {
      data.optionValues.push({
        groupName,
        value: {
          row: rowNumber,
          name,
          extraPrice: extraPrice!,
          isActive: isActive!,
        },
      });
    }
  }

  for (const [slug, data] of pending) {
    const dish = dishes.get(slug);
    if (!dish) {
      errors.push(
        issue(
          data.firstRow,
          'dish_slug',
          'DISH_ROW_REQUIRED',
          `Thiếu dòng DISH cho '${slug}'.`,
          slug,
        ),
      );
      continue;
    }
    dish.variants = data.variants;
    dish.ingredients = data.ingredients;
    dish.tags = data.tags;
    dish.images = data.images;
    dish.optionGroups = data.optionGroups;
    for (const item of data.optionValues) {
      const group = dish.optionGroups.find(
        (candidate) => candidate.name === item.groupName,
      );
      if (!group) {
        errors.push(
          issue(
            item.value.row,
            'ten_nhom_tuy_chon',
            'OPTION_GROUP_ROW_REQUIRED',
            `Thiếu dòng OPTION_GROUP '${item.groupName}'.`,
            slug,
          ),
        );
      } else {
        group.values.push(item.value);
      }
    }
    if (dish.images.filter((image) => image.kind === 'COVER').length > 1) {
      errors.push(
        issue(
          dish.row,
          'loai_anh',
          'MULTIPLE_COVER_IMAGES',
          `Món '${slug}' chỉ được có một ảnh COVER.`,
          slug,
        ),
      );
    }
  }

  if (dishes.size > MAX_DISHES) {
    errors.push(
      issue(
        1,
        'file',
        'DISH_LIMIT_EXCEEDED',
        `File vượt quá giới hạn ${MAX_DISHES} món.`,
      ),
    );
  }

  return {
    rows: processedRows,
    categories: [...categories.values()],
    dishes: [...dishes.values()],
    errors,
  };
}
