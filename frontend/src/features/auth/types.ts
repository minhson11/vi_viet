export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: "CUSTOMER" | "STAFF" | "KITCHEN" | "ADMIN" | "SUPER_ADMIN";
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
}

