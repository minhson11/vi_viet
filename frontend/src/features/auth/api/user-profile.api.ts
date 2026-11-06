import { httpClient } from "@/lib/http/client";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  status: string;
  created_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  ward?: string;
  district?: string;
  city?: string;
  is_default: boolean;
}

export interface UserFavoriteDish {
  id: string;
  dish_id: string;
  name: string;
  slug: string;
  base_price: number;
  image_url?: string | null;
  category_name?: string;
}

export const userProfileApi = {
  async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>("/users/profile");
  },

  async updateProfile(dto: {
    full_name?: string;
    phone?: string;
  }): Promise<UserProfile> {
    return httpClient.patch<UserProfile>("/users/profile", dto);
  },

  async getAddresses(): Promise<UserAddress[]> {
    try {
      const res = await httpClient.get<any>("/addresses");
      return Array.isArray(res) ? res : res?.items || [];
    } catch {
      return [];
    }
  },

  async createAddress(dto: {
    recipient_name: string;
    phone: string;
    address_line: string;
    ward?: string;
    district?: string;
    city?: string;
    is_default?: boolean;
  }): Promise<UserAddress> {
    return httpClient.post<UserAddress>("/addresses", dto);
  },

  async setDefaultAddress(id: string): Promise<UserAddress> {
    return httpClient.post<UserAddress>(`/addresses/${id}/default`);
  },

  async deleteAddress(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/addresses/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  async getPreferences(): Promise<any> {
    try {
      return await httpClient.get("/users/preferences");
    } catch {
      return null;
    }
  },

  async updatePreferences(dto: {
    spicy_level?: number;
    dietary_flags?: string[];
    favorite_categories?: string[];
  }): Promise<any> {
    return httpClient.put("/users/preferences", dto);
  },

  async getFavorites(): Promise<UserFavoriteDish[]> {
    try {
      const res = await httpClient.get<any>("/users/favorites");
      const list = Array.isArray(res) ? res : res?.items || [];
      return list.map((f: any) => ({
        id: f.id?.toString() || f.dish_id?.toString() || "",
        dish_id: f.dish_id?.toString() || f.id?.toString() || "",
        name: f.name || f.dishes?.name || "",
        slug: f.slug || f.dishes?.slug || "",
        base_price: Number(f.starting_price ?? f.base_price ?? f.dishes?.starting_price ?? 0),
        image_url: f.cover_image || f.image_url || f.dishes?.cover_image || null,
        category_name: f.category_name || f.dishes?.categories?.name || "",
      }));
    } catch {
      return [];
    }
  },

  async addFavorite(dishId: string): Promise<void> {
    await httpClient.put(`/users/favorites/${dishId}`);
  },

  async removeFavorite(dishId: string): Promise<void> {
    await httpClient.delete(`/users/favorites/${dishId}`);
  },
};
