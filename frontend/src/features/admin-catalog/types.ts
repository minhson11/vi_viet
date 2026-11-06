export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  dish_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DishVariant {
  id?: string;
  dish_id?: string;
  name: string;
  sku?: string | null;
  price_adjustment: number;
  is_available: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface OptionItem {
  id?: string;
  group_id?: string;
  name: string;
  price_adjustment: number;
  is_available: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface OptionGroup {
  id?: string;
  dish_id?: string;
  name: string;
  is_required: boolean;
  min_choices: number;
  max_choices: number;
  sort_order: number;
  items: OptionItem[];
}

export interface DishImage {
  id?: string;
  dish_id?: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export type IngredientDataStatus = 'UNKNOWN' | 'PARTIAL' | 'VERIFIED';

export interface Ingredient {
  id: string;
  name: string;
  code: string;
  is_allergen: boolean;
}

export interface DishIngredient extends Ingredient {
  note: string | null;
}

export interface DishIngredientInput {
  ingredient_id: string;
  note?: string;
}

export interface MenuImportError {
  sheet: "THUC_DON";
  row: number;
  column: string;
  code: string;
  message: string;
  slug?: string;
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

export interface MenuImportResult {
  success: boolean;
  imported: number;
  created: number;
  updated: number;
}

export interface Dish {
  id: string;
  category_id: string;
  category?: Category;
  name: string;
  slug: string;
  description?: string | null;
  story?: string | null;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  spicy_level: number;
  calories?: number | null;
  prep_time_minutes?: number | null;
  image_url?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  variants?: DishVariant[];
  option_groups?: OptionGroup[];
  images?: DishImage[];
  tags?: { tag: Tag }[];
  ingredients?: DishIngredient[];
  ingredient_data_status?: IngredientDataStatus;
}

export interface DishFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedDishes {
  data: Dish[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

