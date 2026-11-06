import type {
  dish_images_kind,
  dishes_availability,
  dishes_ingredient_data_status,
} from '@prisma/client';

export type MenuImportAction = 'CREATE' | 'UPDATE';
export type CatalogImportAction = MenuImportAction | 'USE';
export type MenuImportRowType =
  | 'CATEGORY'
  | 'DISH'
  | 'VARIANT'
  | 'INGREDIENT'
  | 'TAG'
  | 'IMAGE'
  | 'OPTION_GROUP'
  | 'OPTION_VALUE';

export interface MenuImportCategory {
  row: number;
  action: MenuImportAction;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuImportVariant {
  row: number;
  name: string;
  price: number;
  isActive: boolean;
}

export interface MenuImportIngredient {
  row: number;
  action: CatalogImportAction;
  code: string;
  name?: string;
  isAllergen?: boolean;
  note: string | null;
}

export interface MenuImportTag {
  row: number;
  action: CatalogImportAction;
  code: string;
  name?: string;
}

export interface MenuImportImage {
  row: number;
  assetPath: string;
  kind: dish_images_kind;
  altText: string | null;
  sortOrder: number;
}

export interface MenuImportOptionValue {
  row: number;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

export interface MenuImportOptionGroup {
  row: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  isActive: boolean;
  values: MenuImportOptionValue[];
}

export interface MenuImportDish {
  row: number;
  action: MenuImportAction;
  slug: string;
  name: string;
  categorySlug: string;
  description: string | null;
  story: string | null;
  spicyLevel: number;
  availability: dishes_availability;
  sortOrder: number;
  ingredientDataStatus?: dishes_ingredient_data_status;
  variants: MenuImportVariant[];
  ingredients: MenuImportIngredient[];
  tags: MenuImportTag[];
  images: MenuImportImage[];
  optionGroups: MenuImportOptionGroup[];
}

export interface MenuImportError {
  sheet: 'THUC_DON';
  row: number;
  column: string;
  code: string;
  message: string;
  slug?: string;
}

export interface ParsedMenuWorkbook {
  rows: number;
  categories: MenuImportCategory[];
  dishes: MenuImportDish[];
  errors: MenuImportError[];
}

export interface MenuImportPreview {
  valid: boolean;
  summary: {
    rows: number;
    dishes: number;
    create: number;
    update: number;
    invalid: number;
  };
  errors: MenuImportError[];
}
