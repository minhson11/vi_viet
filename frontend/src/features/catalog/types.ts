export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
}

export interface CatalogDish {
  id: string;
  category_id: string;
  category?: CatalogCategory;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  image_url?: string | null;
  is_active: boolean;
  is_featured: boolean;
  spicy_level: number;
  prep_time_minutes?: number | null;
}

