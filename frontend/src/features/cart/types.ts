export interface CartItemOption {
  option_id: string;
  name: string;
  price_adjustment: number;
}

export interface CartItem {
  id: string;
  dish_id: string;
  dish_name: string;
  dish_slug?: string;
  dish_image?: string | null;
  variant_id?: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  options?: CartItemOption[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

