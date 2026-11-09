-- Vi Viet / MySQL 8.4 / InnoDB / UTF-8 / VND whole dong
-- Run once in an EMPTY database; no DROP or credential creation.
-- Select your database before importing. All application sessions use UTC.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

-- Khách hàng và nhân viên; một tài khoản có một vai trò chính trong phạm vi đồ án.
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('CUSTOMER','OPERATOR','KITCHEN','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `status` ENUM('ACTIVE','LOCKED','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
  `email_verified_at` DATETIME(3) NULL,
  `deactivated_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role_status (role,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Phiên đăng nhập với refresh token đã băm.
CREATE TABLE `auth_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `refresh_token_hash` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `user_agent` VARCHAR(512) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_sessions_token (refresh_token_hash),
  KEY ix_sessions_user_expiry (user_id,expires_at),
  CONSTRAINT fk_auth_sessions_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Token một lần cho xác minh email hoặc đặt lại mật khẩu.
CREATE TABLE `account_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `purpose` ENUM('VERIFY_EMAIL','RESET_PASSWORD') NOT NULL DEFAULT 'RESET_PASSWORD',
  `token_hash` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_account_token (token_hash),
  CONSTRAINT fk_account_tokens_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sổ địa chỉ khách hàng; địa chỉ trên đơn được chụp riêng.
CREATE TABLE `addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `recipient_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address_line` VARCHAR(500) NOT NULL,
  `delivery_note` VARCHAR(500) NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_addresses_user (user_id,deleted_at),
  CONSTRAINT ck_addresses_1 CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT ck_addresses_2 CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT fk_addresses_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Cấu hình cá nhân hóa do người dùng chủ động chọn.
CREATE TABLE `user_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `spicy_level` TINYINT UNSIGNED NULL,
  `budget_per_meal` DECIMAL(12,0) NULL,
  `personalization_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `consented_at` DATETIME(3) NULL,
  `dietary_note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_preferences_user (user_id),
  CONSTRAINT ck_user_preferences_1 CHECK (spicy_level IS NULL OR spicy_level <= 3),
  CONSTRAINT ck_user_preferences_2 CHECK (budget_per_meal IS NULL OR budget_per_meal >= 0),
  CONSTRAINT fk_user_preferences_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Danh mục thực đơn.
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(140) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Thông tin món ăn dùng chung cho bán hàng, AI và nội dung.
CREATE TABLE `dishes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `story` TEXT NULL,
  `spicy_level` TINYINT UNSIGNED NULL,
  `ingredient_data_status` ENUM('UNKNOWN','PARTIAL','VERIFIED') NOT NULL DEFAULT 'UNKNOWN',
  `availability` ENUM('AVAILABLE','SOLD_OUT','HIDDEN') NOT NULL DEFAULT 'HIDDEN',
  `sort_order` INT NOT NULL DEFAULT 0,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_dishes_slug (slug),
  KEY ix_dishes_category_sale (category_id,availability,deleted_at),
  CONSTRAINT ck_dishes_1 CHECK (spicy_level IS NULL OR spicy_level <= 3),
  CONSTRAINT fk_dishes_1 FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Ảnh thường và ảnh tách nền cho món.
CREATE TABLE `dish_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `asset_path` VARCHAR(500) NOT NULL,
  `kind` ENUM('COVER','GALLERY','CUTOUT') NOT NULL DEFAULT 'GALLERY',
  `alt_text` VARCHAR(255) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_images_dish (dish_id,kind,sort_order),
  CONSTRAINT fk_dish_images_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Mỗi món luôn có ít nhất một biến thể, kể cả phần tiêu chuẩn.
CREATE TABLE `dish_variants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_variants_name (dish_id,name),
  UNIQUE KEY uq_variants_id_dish (id,dish_id),
  CONSTRAINT ck_dish_variants_1 CHECK (price >= 0),
  CONSTRAINT fk_dish_variants_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Nhóm tùy chọn riêng của món: độ cay, topping, đường/đá.
CREATE TABLE `option_groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `min_select` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `max_select` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_groups_id_dish (id,dish_id),
  CONSTRAINT ck_option_groups_1 CHECK (max_select >= min_select AND max_select >= 1),
  CONSTRAINT fk_option_groups_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Giá trị lựa chọn và giá cộng thêm.
CREATE TABLE `option_values` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `extra_price` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_options_group_name (group_id,name),
  UNIQUE KEY uq_options_id_dish (id,dish_id),
  CONSTRAINT ck_option_values_1 CHECK (extra_price >= 0),
  CONSTRAINT fk_option_values_1 FOREIGN KEY (`group_id`,`dish_id`) REFERENCES `option_groups` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Danh mục thành phần để tìm món và ghi nhận thành phần muốn tránh; chưa phải kho.
CREATE TABLE `ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `is_allergen` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_ingredients_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Thành phần được khai báo của món; không suy luận rằng danh sách đã đầy đủ.
CREATE TABLE `dish_ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `ingredient_id` BIGINT UNSIGNED NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_dish_ingredients (dish_id,ingredient_id),
  CONSTRAINT fk_dish_ingredients_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_dish_ingredients_2 FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đặc điểm món có cấu trúc: ít cay, món chay, bữa sáng…
CREATE TABLE `tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_tags_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Gắn các đặc điểm đã xác minh cho món.
CREATE TABLE `dish_tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_dish_tags (dish_id,tag_id),
  CONSTRAINT fk_dish_tags_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_dish_tags_2 FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đặc điểm khách khai báo thích hoặc muốn tránh.
CREATE TABLE `user_tag_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  `preference` ENUM('LIKE','AVOID') NOT NULL DEFAULT 'LIKE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_user_tag (user_id,tag_id),
  CONSTRAINT fk_user_tag_preferences_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_tag_preferences_2 FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Thành phần khách chủ động yêu cầu tránh.
CREATE TABLE `user_ingredient_restrictions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `ingredient_id` BIGINT UNSIGNED NOT NULL,
  `reason` ENUM('DISLIKE','ALLERGY','OTHER') NOT NULL DEFAULT 'DISLIKE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_user_ingredient (user_id,ingredient_id),
  CONSTRAINT fk_user_ingredient_restrictions_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_ingredient_restrictions_2 FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Danh sách món yêu thích.
CREATE TABLE `favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_favorite (user_id,dish_id),
  CONSTRAINT fk_favorites_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_favorites_2 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Một giỏ hiện tại cho mỗi khách đã đăng nhập; khách vãng lai dùng giỏ cục bộ.
CREATE TABLE `carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_cart_user (user_id),
  CONSTRAINT fk_carts_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dòng giỏ; giá không được tin cậy từ trình duyệt.
CREATE TABLE `cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity` SMALLINT UNSIGNED NOT NULL,
  `note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_cart_item_id_dish (id,dish_id),
  CONSTRAINT ck_cart_items_1 CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT fk_cart_items_1 FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_cart_items_2 FOREIGN KEY (`variant_id`,`dish_id`) REFERENCES `dish_variants` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Lựa chọn của một dòng giỏ, không được thuộc món khác.
CREATE TABLE `cart_item_options` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_item_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `option_value_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_cart_option (cart_item_id,option_value_id),
  CONSTRAINT fk_cart_item_options_1 FOREIGN KEY (`cart_item_id`,`dish_id`) REFERENCES `cart_items` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_cart_item_options_2 FOREIGN KEY (`option_value_id`,`dish_id`) REFERENCES `option_values` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Mã ưu đãi toàn đơn: mỗi đơn tối đa một mã; chưa áp theo danh mục.
CREATE TABLE `coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `discount_type` ENUM('FIXED','PERCENT','FREE_SHIPPING') NOT NULL DEFAULT 'FIXED',
  `discount_value` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `min_subtotal` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `max_discount` DECIMAL(12,0) NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `total_limit` INT UNSIGNED NULL,
  `per_user_limit` INT UNSIGNED NOT NULL DEFAULT 1,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_coupon_code (code),
  CONSTRAINT ck_coupons_1 CHECK (ends_at > starts_at),
  CONSTRAINT ck_coupons_2 CHECK (min_subtotal >= 0),
  CONSTRAINT ck_coupons_3 CHECK (max_discount IS NULL OR max_discount >= 0),
  CONSTRAINT ck_coupons_4 CHECK (total_limit IS NULL OR total_limit > 0),
  CONSTRAINT ck_coupons_5 CHECK (per_user_limit > 0),
  CONSTRAINT ck_coupons_6 CHECK ((discount_type = 'FIXED' AND discount_value > 0) OR (discount_type = 'PERCENT' AND discount_value BETWEEN 1 AND 100 AND max_discount IS NOT NULL) OR (discount_type = 'FREE_SHIPPING' AND discount_value = 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đơn hàng với giá, địa chỉ và ưu đãi được chụp tại thời điểm đặt.
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_code` VARCHAR(32) COLLATE utf8mb4_bin NOT NULL,
  `checkout_key` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `fulfillment_type` ENUM('DELIVERY','PICKUP') NOT NULL DEFAULT 'DELIVERY',
  `status` ENUM('PENDING_PAYMENT','PENDING_CONFIRMATION','CONFIRMED','PREPARING','READY','DELIVERING','COMPLETED','CANCELLED','DELIVERY_FAILED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  `payment_method` ENUM('COD','VNPAY') NOT NULL DEFAULT 'COD',
  `payment_status` ENUM('UNPAID','PROCESSING','PAID','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `recipient_name` VARCHAR(120) NOT NULL,
  `recipient_phone` VARCHAR(20) NOT NULL,
  `delivery_address` VARCHAR(500) NULL,
  `delivery_note` VARCHAR(500) NULL,
  `customer_note` VARCHAR(500) NULL,
  `subtotal` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `food_discount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `delivery_fee` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `shipping_discount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `coupon_id` BIGINT UNSIGNED NULL,
  `coupon_snapshot` JSON NULL,
  `payment_deadline` DATETIME(3) NULL,
  `estimated_ready_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancel_reason` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_order_code (order_code),
  UNIQUE KEY uq_checkout_key (checkout_key),
  UNIQUE KEY uq_orders_id_user (id,user_id),
  KEY ix_orders_user_created (user_id,created_at),
  KEY ix_orders_status_created (status,created_at),
  KEY ix_orders_payment_expiry (status,payment_deadline),
  CONSTRAINT ck_orders_1 CHECK (subtotal >= 0 AND food_discount BETWEEN 0 AND subtotal),
  CONSTRAINT ck_orders_2 CHECK (delivery_fee >= 0 AND shipping_discount BETWEEN 0 AND delivery_fee),
  CONSTRAINT ck_orders_3 CHECK (total_amount = subtotal - food_discount + delivery_fee - shipping_discount),
  CONSTRAINT ck_orders_4 CHECK ((fulfillment_type = 'DELIVERY' AND delivery_address IS NOT NULL) OR (fulfillment_type = 'PICKUP' AND delivery_fee = 0 AND shipping_discount = 0)),
  CONSTRAINT fk_orders_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_orders_2 FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Bản chụp từng món: lịch sử không phụ thuộc giá thực đơn hiện tại.
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `dish_name` VARCHAR(160) NOT NULL,
  `variant_name` VARCHAR(100) NOT NULL,
  `base_price` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `options_price` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `quantity` SMALLINT UNSIGNED NOT NULL,
  `line_total` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_order_item_id_dish (id,dish_id),
  KEY ix_order_items_dish (dish_id),
  CONSTRAINT ck_order_items_1 CHECK (base_price >= 0 AND options_price >= 0),
  CONSTRAINT ck_order_items_2 CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT ck_order_items_3 CHECK (line_total = (base_price + options_price) * quantity),
  CONSTRAINT fk_order_items_1 FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_order_items_2 FOREIGN KEY (`variant_id`,`dish_id`) REFERENCES `dish_variants` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Chụp tên và giá từng tùy chọn trên một phần ăn.
CREATE TABLE `order_item_options` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `option_value_id` BIGINT UNSIGNED NOT NULL,
  `group_name` VARCHAR(100) NOT NULL,
  `option_name` VARCHAR(100) NOT NULL,
  `extra_price` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_order_option (order_item_id,option_value_id),
  CONSTRAINT ck_order_item_options_1 CHECK (extra_price >= 0),
  CONSTRAINT fk_order_item_options_1 FOREIGN KEY (`order_item_id`,`dish_id`) REFERENCES `order_items` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_order_item_options_2 FOREIGN KEY (`option_value_id`,`dish_id`) REFERENCES `option_values` (`id`,`dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Giữ lượt mã khi tạo đơn; backend khóa hàng coupon để kiểm tra giới hạn.
CREATE TABLE `coupon_redemptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `coupon_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('RESERVED','CONSUMED','RELEASED') NOT NULL DEFAULT 'RESERVED',
  `discount_amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `released_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_redemption_order (order_id),
  KEY ix_redemption_limit (coupon_id,user_id,status),
  CONSTRAINT ck_coupon_redemptions_1 CHECK (discount_amount >= 0),
  CONSTRAINT fk_coupon_redemptions_1 FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_coupon_redemptions_2 FOREIGN KEY (`order_id`,`user_id`) REFERENCES `orders` (`id`,`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Lịch sử chuyển trạng thái, yêu cầu hủy và sự cố.
CREATE TABLE `order_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `event_type` VARCHAR(60) NOT NULL,
  `from_status` VARCHAR(40) NULL,
  `to_status` VARCHAR(40) NULL,
  `note` VARCHAR(1000) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_order_events (order_id,created_at,id),
  CONSTRAINT fk_order_events_1 FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_order_events_2 FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Mỗi đơn có nhiều lần thử thanh toán; mỗi lần có mã tham chiếu riêng.
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `provider` ENUM('COD','VNPAY') NOT NULL DEFAULT 'VNPAY',
  `merchant_reference` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `provider_transaction_id` VARCHAR(150) COLLATE utf8mb4_bin NULL,
  `amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `currency` CHAR(3) NOT NULL DEFAULT 'VND',
  `status` ENUM('PENDING','SUCCEEDED','FAILED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `paid_at` DATETIME(3) NULL,
  `expires_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_payment_reference (merchant_reference),
  UNIQUE KEY uq_provider_transaction (provider,provider_transaction_id),
  KEY ix_payment_order (order_id,status),
  CONSTRAINT ck_payments_1 CHECK (amount > 0),
  CONSTRAINT ck_payments_2 CHECK (currency = 'VND'),
  CONSTRAINT fk_payments_1 FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sổ tiếp nhận callback để chống xử lý lặp và đối soát.
CREATE TABLE `payment_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NULL,
  `provider` VARCHAR(30) NOT NULL,
  `event_key` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `signature_valid` BOOLEAN NOT NULL DEFAULT FALSE,
  `payload` JSON NOT NULL,
  `processing_status` ENUM('RECEIVED','PROCESSED','REJECTED','ERROR') NOT NULL DEFAULT 'RECEIVED',
  `processed_at` DATETIME(3) NULL,
  `error_note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_payment_event (provider,event_key),
  CONSTRAINT fk_payment_events_1 FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Theo dõi hoàn tiền riêng, cho phép nhiều lần hoàn một phần.
CREATE TABLE `refunds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `refund_reference` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `provider_refund_id` VARCHAR(150) COLLATE utf8mb4_bin NULL,
  `amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `reason` VARCHAR(500) NOT NULL,
  `status` ENUM('REQUESTED','PROCESSING','SUCCEEDED','FAILED') NOT NULL DEFAULT 'REQUESTED',
  `requested_by` BIGINT UNSIGNED NOT NULL,
  `refunded_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_refund_reference (refund_reference),
  KEY ix_refunds_payment_status (payment_id,status),
  CONSTRAINT ck_refunds_1 CHECK (amount > 0),
  CONSTRAINT fk_refunds_1 FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_refunds_2 FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Một đánh giá trên mỗi dòng món đã mua; chủ đánh giá suy ra từ đơn.
CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `content` TEXT NULL,
  `visibility` ENUM('VISIBLE','HIDDEN') NOT NULL DEFAULT 'VISIBLE',
  `moderation_reason` VARCHAR(500) NULL,
  `reply` TEXT NULL,
  `replied_by` BIGINT UNSIGNED NULL,
  `replied_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_review_item (order_item_id),
  CONSTRAINT ck_reviews_1 CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_1 FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_reviews_2 FOREIGN KEY (`replied_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Phiên tư vấn; cho phép khách chưa đăng nhập bằng secret đã băm.
CREATE TABLE `ai_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `guest_token_hash` VARCHAR(64) COLLATE utf8mb4_bin NULL,
  `title` VARCHAR(200) NULL,
  `expires_at` DATETIME(3) NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_conversation_user (user_id,created_at),
  CONSTRAINT ck_ai_conversations_1 CHECK ((user_id IS NOT NULL AND guest_token_hash IS NULL) OR (user_id IS NULL AND guest_token_hash IS NOT NULL)),
  CONSTRAINT fk_ai_conversations_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tin nhắn và kết quả công cụ đã giảm thiểu dữ liệu.
CREATE TABLE `ai_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('USER','ASSISTANT','TOOL') NOT NULL DEFAULT 'USER',
  `content` TEXT NOT NULL,
  `structured_data` JSON NULL,
  `model_name` VARCHAR(100) NULL,
  `input_tokens` INT UNSIGNED NULL,
  `output_tokens` INT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_messages_conversation (conversation_id,created_at,id),
  CONSTRAINT fk_ai_messages_1 FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Các món thực sự được gợi ý; dùng cho AI hoặc khu cá nhân hóa.
CREATE TABLE `recommendation_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `message_id` BIGINT UNSIGNED NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `batch_key` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `source` ENUM('AI_CHAT','PERSONALIZED') NOT NULL DEFAULT 'AI_CHAT',
  `rank_position` SMALLINT UNSIGNED NOT NULL,
  `score` DECIMAL(8,4) NULL,
  `reason` VARCHAR(500) NULL,
  `expires_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_recommendation_rank (batch_key,rank_position),
  KEY ix_recommendation_user (user_id,created_at),
  CONSTRAINT ck_recommendation_items_1 CHECK (rank_position > 0),
  CONSTRAINT ck_recommendation_items_2 CHECK ((source = 'AI_CHAT' AND message_id IS NOT NULL) OR (source = 'PERSONALIZED' AND user_id IS NOT NULL)),
  CONSTRAINT fk_recommendation_items_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_recommendation_items_2 FOREIGN KEY (`message_id`) REFERENCES `ai_messages` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_recommendation_items_3 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sự kiện hỗ trợ gợi ý và đo hiệu quả; chỉ lưu hành vi khi khách đồng ý.
CREATE TABLE `user_interactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `recommendation_id` BIGINT UNSIGNED NULL,
  `event_type` ENUM('VIEW','CLICK_RECOMMENDATION','ADD_TO_CART') NOT NULL DEFAULT 'VIEW',
  `event_key` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY uq_interaction_event (event_key),
  KEY ix_interaction_user_time (user_id,occurred_at),
  KEY ix_interaction_dish_type (dish_id,event_type,occurred_at),
  CONSTRAINT fk_user_interactions_1 FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_interactions_2 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_user_interactions_3 FOREIGN KEY (`recommendation_id`) REFERENCES `recommendation_items` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Nội dung phân cảnh cuộn; cấu hình an toàn, animation code nằm frontend.
CREATE TABLE `story_sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dish_id` BIGINT UNSIGNED NOT NULL,
  `image_id` BIGINT UNSIGNED NULL,
  `chapter_label` VARCHAR(100) NOT NULL,
  `headline` VARCHAR(200) NOT NULL,
  `body` TEXT NOT NULL,
  `cta_label` VARCHAR(100) NOT NULL,
  `background_color` VARCHAR(7) NOT NULL,
  `text_color` VARCHAR(7) NOT NULL,
  `animation_preset` ENUM('ROLL_LEFT','SLIDE_RIGHT','RISE','STATIC') NOT NULL DEFAULT 'ROLL_LEFT',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `extra_assets` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY ix_story_public (is_published,sort_order),
  CONSTRAINT fk_story_sections_1 FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_story_sections_2 FOREIGN KEY (`image_id`) REFERENCES `dish_images` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Một cửa hàng; không lưu secret trong bảng cài đặt.
CREATE TABLE `store_settings` (
  `id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `address` VARCHAR(500) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `opening_hours` JSON NOT NULL,
  `delivery_rules` JSON NOT NULL,
  `accepting_orders` BOOLEAN NOT NULL DEFAULT TRUE,
  `payment_timeout_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT ck_store_settings_1 CHECK (id = 1),
  CONSTRAINT ck_store_settings_2 CHECK (payment_timeout_minutes BETWEEN 1 AND 120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;