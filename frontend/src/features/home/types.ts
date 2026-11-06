export interface TableItem {
  id: string;
  dishId?: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

export interface FlavorProfile {
  top: string;
  heart: string;
  base: string;
}

export interface SatelliteDish {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  originalPrice?: number;
  image: string;
  tagline?: string;
  badge?: string;
  flavors?: FlavorProfile;
}

export interface CategoryStoryShowcase {
  id: string;
  categoryId: string; // ID hoặc slug danh mục kết nối
  categoryName: string;
  categorySlug: string;
  badgeTag: string; // ví dụ: "Signature Tasting · Nước Dùng Di Sản"
  headlineTitle: string; // ví dụ: "Món Nước & Nước Dùng"
  headlineHighlight: string; // ví dụ: "Hầm Khói Trầm 48 Giờ"
  description: string;
  themeColor: "primary" | "secondary" | "gold";
  animationType: "roll" | "3dflip" | "spiral";
  badgeTop: string; // ví dụ: "Thố Sứ Nóng 88°C"
  badgeBottom: string; // ví dụ: "⚡ Giao Nhanh 30 Phút"
  flavors: FlavorProfile;
  mainDish: {
    id: string;
    name: string;
    slug?: string;
    price?: number;
    originalPrice?: number;
    image: string;
  };
  satelliteDishes: SatelliteDish[];
  isActive: boolean;
  sortOrder: number;
}

export interface HeritageDish {
  id: string;
  title: string;
  subtitle: string;
  categoryTag: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  badgeTop: string;
  badgeBottom: string;
  themeColor: "primary" | "secondary" | "gold";
  animationType: "roll" | "3dflip" | "spiral";
  flavors: FlavorProfile;
}

export interface ContemporaryDish {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
}
