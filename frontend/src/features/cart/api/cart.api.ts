import { httpClient } from "@/lib/http/client";
import { Cart, CartItem, CartItemOption } from "../types";

export interface AddToCartPayload {
  dish_id: string;
  dish_name?: string;
  dish_slug?: string;
  dish_image?: string | null;
  variant_id?: string;
  variant_name?: string;
  unit_price?: number;
  quantity: number;
  note?: string;
  option_ids?: string[];
  options?: CartItemOption[];
}

export interface UpdateCartItemPayload {
  quantity: number;
  note?: string;
}

const GUEST_CART_KEY = "viviet_guest_cart";

function getGuestCart(): Cart {
  if (typeof window === "undefined") {
    return { items: [], subtotal: 0, discount: 0, total: 0 };
  }
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [], subtotal: 0, discount: 0, total: 0 };
    const parsed = JSON.parse(raw);
    const items: CartItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    const subtotal = items.reduce(
      (s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 1),
      0
    );
    const discount = Number(parsed.discount || 0);
    return {
      items,
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  } catch {
    return { items: [], subtotal: 0, discount: 0, total: 0 };
  }
}

function saveGuestCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  const subtotal = cart.items.reduce(
    (s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 1),
    0
  );
  const discount = Number(cart.discount || 0);
  const total = Math.max(0, subtotal - discount);
  const finalCart: Cart = { ...cart, subtotal, total };
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(finalCart));

  const totalQty = finalCart.items.reduce((s, it) => s + Number(it.quantity || 1), 0);
  window.dispatchEvent(
    new CustomEvent("viviet_cart_updated", { detail: { count: totalQty } })
  );
}

function mapServerCartResponse(res: any): Cart {
  if (!res) {
    return { items: [], subtotal: 0, discount: 0, total: 0 };
  }
  const mappedItems: CartItem[] = (res.items || []).map((it: any) => {
    const dish = it.dish_variants?.dishes || it.dishes;
    const coverImage =
      it.cover_image?.asset_path ||
      (typeof it.cover_image === "string" ? it.cover_image : null) ||
      dish?.dish_images?.[0]?.asset_path ||
      dish?.image_url ||
      it.dish_image ||
      null;

    return {
      id: it.id?.toString() || "",
      dish_id: it.dish_id?.toString() || dish?.id?.toString() || "",
      dish_name: it.dish_name || dish?.name || "Món ăn Vị Việt",
      dish_slug: it.dish_slug || dish?.slug || "",
      dish_image: coverImage,
      variant_id: it.variant_id?.toString() || it.dish_variants?.id?.toString(),
      variant_name: it.variant_name || it.dish_variants?.name,
      unit_price: Number(it.unit_price || 0),
      quantity: Number(it.quantity || 1),
      notes: it.note || it.notes,
      options: (it.options || it.cart_item_options || []).map((opt: any) => {
        const val = opt.option_values || opt;
        return {
          option_id: (val.option_value_id || val.id || opt.option_id || "").toString(),
          name: val.name || opt.name || "Tùy chọn",
          price_adjustment: Number(val.extra_price ?? opt.price_adjustment ?? 0),
        };
      }),
    };
  });

  const subtotal = Number(res.subtotal || 0);
  const discount = Number(res.discount || 0);
  const total = Number(res.total || subtotal - discount);

  const serverCart: Cart = {
    items: mappedItems,
    subtotal,
    discount,
    total,
  };

  if (typeof window !== "undefined") {
    const totalQty = mappedItems.reduce((s, it) => s + it.quantity, 0);
    window.dispatchEvent(
      new CustomEvent("viviet_cart_updated", { detail: { count: totalQty } })
    );
  }

  return serverCart;
}

export const cartApi = {
  /**
   * Lấy giỏ hàng hiện tại (Yêu cầu đăng nhập theo Phương án 2)
   */
  async getCart(): Promise<Cart | null> {
    const token = httpClient.getToken();

    if (!token) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("viviet_cart_updated", { detail: { count: 0 } })
        );
      }
      return { items: [], subtotal: 0, discount: 0, total: 0 };
    }

    try {
      const res = await httpClient.get<any>("/cart");
      return mapServerCartResponse(res);
    } catch (err) {
      console.warn("Failed to fetch server cart:", err);
    }

    return { items: [], subtotal: 0, discount: 0, total: 0 };
  },

  /**
   * Thêm món vào giỏ hàng (Chặn ngay từ đầu nếu chưa đăng nhập & Cập nhật tức thì)
   */
  async addToCart(payload: AddToCartPayload): Promise<Cart | null> {
    const token = httpClient.getToken();

    if (!token) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("viviet_auth_required", {
            detail: {
              redirectUrl: payload.dish_slug ? `/mon/${payload.dish_slug}` : window.location.pathname,
              message: `Vui lòng đăng nhập tài khoản để thêm "${payload.dish_name || "món ăn"}" vào giỏ hàng.`,
            },
          })
        );
      }
      throw new Error("AUTH_REQUIRED");
    }

    // 1. Optimistic UI: Nhảy số giỏ hàng ngay lập tức (0ms)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("viviet_cart_optimistic_add", {
          detail: { count: payload.quantity || 1 },
        })
      );
    }

    try {
      const res = await httpClient.post<any>("/cart/items", {
        dish_id: payload.dish_id,
        variant_id: payload.variant_id || payload.dish_id,
        option_value_ids: payload.option_ids || [],
        quantity: payload.quantity || 1,
        note: payload.note,
      });
      return mapServerCartResponse(res);
    } catch (err) {
      console.error("Backend add to cart failed:", err);
      // Rollback số lượng giỏ hàng nếu lỗi
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("viviet_cart_updated"));
      }
      throw err;
    }
  },

  /**
   * Cập nhật số lượng của một món trong giỏ
   */
  async updateCartItem(itemId: string, payload: UpdateCartItemPayload): Promise<Cart | null> {
    const token = httpClient.getToken();

    if (token && !itemId.startsWith("guest-") && !itemId.startsWith("item-")) {
      try {
        const res = await httpClient.patch<any>(`/cart/items/${itemId}`, payload);
        return mapServerCartResponse(res);
      } catch (err) {
        console.warn("Backend update cart item failed:", err);
      }
    }

    // Cập nhật trong Guest Cart
    const currentCart = getGuestCart();
    const itemIndex = currentCart.items.findIndex((it) => it.id === itemId);
    if (itemIndex > -1) {
      if (payload.quantity <= 0) {
        currentCart.items.splice(itemIndex, 1);
      } else {
        currentCart.items[itemIndex].quantity = payload.quantity;
        if (payload.note !== undefined) {
          currentCart.items[itemIndex].notes = payload.note;
        }
      }
      saveGuestCart(currentCart);
    }
    return currentCart;
  },

  /**
   * Xóa một món khỏi giỏ hàng
   */
  async removeCartItem(itemId: string): Promise<Cart | null> {
    const token = httpClient.getToken();

    if (token && !itemId.startsWith("guest-") && !itemId.startsWith("item-")) {
      try {
        const res = await httpClient.delete<any>(`/cart/items/${itemId}`);
        return mapServerCartResponse(res);
      } catch (err) {
        console.warn("Backend remove cart item failed:", err);
      }
    }

    // Xóa trong Guest Cart
    const currentCart = getGuestCart();
    currentCart.items = currentCart.items.filter((it) => it.id !== itemId);
    saveGuestCart(currentCart);
    return currentCart;
  },

  /**
   * Xóa sạch toàn bộ giỏ hàng
   */
  async clearCart(): Promise<boolean> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_CART_KEY);
      window.dispatchEvent(
        new CustomEvent("viviet_cart_updated", { detail: { count: 0 } })
      );
    }

    const token = httpClient.getToken();
    if (token) {
      try {
        const res = await httpClient.delete<any>("/cart");
        mapServerCartResponse(res);
      } catch (e) {
        console.warn("Server clear cart failed:", e);
      }
    }

    return true;
  },
};
