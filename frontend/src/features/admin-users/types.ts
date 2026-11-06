import { User } from "../auth/types";

export interface AdminUserListItem extends User {
  orders_count?: number;
  total_spent?: number;
}

