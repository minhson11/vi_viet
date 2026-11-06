-- CreateTable
CREATE TABLE `account_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `purpose` ENUM('VERIFY_EMAIL', 'RESET_PASSWORD') NOT NULL DEFAULT 'RESET_PASSWORD',
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_account_token`(`token_hash`),
    INDEX `fk_account_tokens_1`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `recipient_name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address_line` VARCHAR(500) NOT NULL,
    `delivery_note` VARCHAR(500) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_addresses_user`(`user_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_conversations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `guest_token_hash` VARCHAR(64) NULL,
    `title` VARCHAR(200) NULL,
    `expires_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_conversation_user`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` BIGINT UNSIGNED NOT NULL,
    `role` ENUM('USER', 'ASSISTANT', 'TOOL') NOT NULL DEFAULT 'USER',
    `content` TEXT NOT NULL,
    `structured_data` JSON NULL,
    `model_name` VARCHAR(100) NULL,
    `input_tokens` INTEGER UNSIGNED NULL,
    `output_tokens` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_messages_conversation`(`conversation_id`, `created_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `refresh_token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_sessions_token`(`refresh_token_hash`),
    INDEX `ix_sessions_user_expiry`(`user_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_item_options` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cart_item_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `option_value_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_cart_item_options_1`(`cart_item_id`, `dish_id`),
    INDEX `fk_cart_item_options_2`(`option_value_id`, `dish_id`),
    UNIQUE INDEX `uq_cart_option`(`cart_item_id`, `option_value_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cart_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `variant_id` BIGINT UNSIGNED NOT NULL,
    `quantity` SMALLINT UNSIGNED NOT NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_cart_items_1`(`cart_id`),
    INDEX `fk_cart_items_2`(`variant_id`, `dish_id`),
    UNIQUE INDEX `uq_cart_item_id_dish`(`id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_cart_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_categories_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_redemptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `coupon_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('RESERVED', 'CONSUMED', 'RELEASED') NOT NULL DEFAULT 'RESERVED',
    `discount_amount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `released_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_redemption_order`(`order_id`),
    INDEX `ix_redemption_limit`(`coupon_id`, `user_id`, `status`),
    UNIQUE INDEX `fk_coupon_redemptions_2`(`order_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `discount_type` ENUM('FIXED', 'PERCENT', 'FREE_SHIPPING') NOT NULL DEFAULT 'FIXED',
    `discount_value` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `min_subtotal` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `max_discount` DECIMAL(12, 0) NULL,
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `total_limit` INTEGER UNSIGNED NULL,
    `per_user_limit` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_coupon_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `asset_path` VARCHAR(500) NOT NULL,
    `kind` ENUM('COVER', 'GALLERY', 'CUTOUT') NOT NULL DEFAULT 'GALLERY',
    `alt_text` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ix_images_dish`(`dish_id`, `kind`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_ingredients` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `ingredient_id` BIGINT UNSIGNED NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_dish_ingredients_2`(`ingredient_id`),
    UNIQUE INDEX `uq_dish_ingredients`(`dish_id`, `ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_dish_tags_2`(`tag_id`),
    UNIQUE INDEX `uq_dish_tags`(`dish_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_variants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `price` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_variants_id_dish`(`id`, `dish_id`),
    UNIQUE INDEX `uq_variants_name`(`dish_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dishes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `story` TEXT NULL,
    `spicy_level` TINYINT UNSIGNED NULL,
    `ingredient_data_status` ENUM('UNKNOWN', 'PARTIAL', 'VERIFIED') NOT NULL DEFAULT 'UNKNOWN',
    `availability` ENUM('AVAILABLE', 'SOLD_OUT', 'HIDDEN') NOT NULL DEFAULT 'HIDDEN',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_dishes_slug`(`slug`),
    INDEX `ix_dishes_category_sale`(`category_id`, `availability`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_favorites_2`(`dish_id`),
    UNIQUE INDEX `uq_favorite`(`user_id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredients` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `is_allergen` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_ingredients_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `min_select` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `max_select` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_option_groups_1`(`dish_id`),
    UNIQUE INDEX `uq_groups_id_dish`(`id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `option_values` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `group_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `extra_price` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_option_values_1`(`group_id`, `dish_id`),
    UNIQUE INDEX `uq_options_group_name`(`group_id`, `name`),
    UNIQUE INDEX `uq_options_id_dish`(`id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `actor_user_id` BIGINT UNSIGNED NULL,
    `event_type` VARCHAR(60) NOT NULL,
    `from_status` VARCHAR(40) NULL,
    `to_status` VARCHAR(40) NULL,
    `note` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_order_events_2`(`actor_user_id`),
    INDEX `ix_order_events`(`order_id`, `created_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item_options` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `option_value_id` BIGINT UNSIGNED NOT NULL,
    `group_name` VARCHAR(100) NOT NULL,
    `option_name` VARCHAR(100) NOT NULL,
    `extra_price` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_order_item_options_1`(`order_item_id`, `dish_id`),
    INDEX `fk_order_item_options_2`(`option_value_id`, `dish_id`),
    UNIQUE INDEX `uq_order_option`(`order_item_id`, `option_value_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `variant_id` BIGINT UNSIGNED NOT NULL,
    `dish_name` VARCHAR(160) NOT NULL,
    `variant_name` VARCHAR(100) NOT NULL,
    `base_price` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `options_price` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `quantity` SMALLINT UNSIGNED NOT NULL,
    `line_total` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_order_items_1`(`order_id`),
    INDEX `fk_order_items_2`(`variant_id`, `dish_id`),
    INDEX `ix_order_items_dish`(`dish_id`),
    UNIQUE INDEX `uq_order_item_id_dish`(`id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(32) NOT NULL,
    `checkout_key` VARCHAR(64) NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `fulfillment_type` ENUM('DELIVERY', 'PICKUP') NOT NULL DEFAULT 'DELIVERY',
    `status` ENUM('PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED', 'DELIVERY_FAILED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `payment_method` ENUM('COD', 'VNPAY') NOT NULL DEFAULT 'COD',
    `payment_status` ENUM('UNPAID', 'PROCESSING', 'PAID', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `recipient_name` VARCHAR(120) NOT NULL,
    `recipient_phone` VARCHAR(20) NOT NULL,
    `delivery_address` VARCHAR(500) NULL,
    `delivery_note` VARCHAR(500) NULL,
    `customer_note` VARCHAR(500) NULL,
    `subtotal` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `food_discount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `delivery_fee` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `shipping_discount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `coupon_id` BIGINT UNSIGNED NULL,
    `coupon_snapshot` JSON NULL,
    `payment_deadline` DATETIME(3) NULL,
    `estimated_ready_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `cancel_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_order_code`(`order_code`),
    UNIQUE INDEX `uq_checkout_key`(`checkout_key`),
    INDEX `fk_orders_2`(`coupon_id`),
    INDEX `ix_orders_payment_expiry`(`status`, `payment_deadline`),
    INDEX `ix_orders_status_created`(`status`, `created_at`),
    INDEX `ix_orders_user_created`(`user_id`, `created_at`),
    UNIQUE INDEX `uq_orders_id_user`(`id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `payment_id` BIGINT UNSIGNED NULL,
    `provider` VARCHAR(30) NOT NULL,
    `event_key` VARCHAR(191) NOT NULL,
    `signature_valid` BOOLEAN NOT NULL DEFAULT false,
    `payload` JSON NOT NULL,
    `processing_status` ENUM('RECEIVED', 'PROCESSED', 'REJECTED', 'ERROR') NOT NULL DEFAULT 'RECEIVED',
    `processed_at` DATETIME(3) NULL,
    `error_note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_payment_events_1`(`payment_id`),
    UNIQUE INDEX `uq_payment_event`(`provider`, `event_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `provider` ENUM('COD', 'VNPAY') NOT NULL DEFAULT 'VNPAY',
    `merchant_reference` VARCHAR(100) NOT NULL,
    `provider_transaction_id` VARCHAR(150) NULL,
    `amount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `currency` CHAR(3) NOT NULL DEFAULT 'VND',
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_payment_reference`(`merchant_reference`),
    INDEX `ix_payment_order`(`order_id`, `status`),
    UNIQUE INDEX `uq_provider_transaction`(`provider`, `provider_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recommendation_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `message_id` BIGINT UNSIGNED NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `batch_key` VARCHAR(64) NOT NULL,
    `source` ENUM('AI_CHAT', 'PERSONALIZED') NOT NULL DEFAULT 'AI_CHAT',
    `rank_position` SMALLINT UNSIGNED NOT NULL,
    `score` DECIMAL(8, 4) NULL,
    `reason` VARCHAR(500) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_recommendation_items_2`(`message_id`),
    INDEX `fk_recommendation_items_3`(`dish_id`),
    INDEX `ix_recommendation_user`(`user_id`, `created_at`),
    UNIQUE INDEX `uq_recommendation_rank`(`batch_key`, `rank_position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `payment_id` BIGINT UNSIGNED NOT NULL,
    `refund_reference` VARCHAR(100) NOT NULL,
    `provider_refund_id` VARCHAR(150) NULL,
    `amount` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `reason` VARCHAR(500) NOT NULL,
    `status` ENUM('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED') NOT NULL DEFAULT 'REQUESTED',
    `requested_by` BIGINT UNSIGNED NOT NULL,
    `refunded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_refund_reference`(`refund_reference`),
    INDEX `fk_refunds_2`(`requested_by`),
    INDEX `ix_refunds_payment_status`(`payment_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_item_id` BIGINT UNSIGNED NOT NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `content` TEXT NULL,
    `visibility` ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
    `moderation_reason` VARCHAR(500) NULL,
    `reply` TEXT NULL,
    `replied_by` BIGINT UNSIGNED NULL,
    `replied_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_review_item`(`order_item_id`),
    INDEX `fk_reviews_2`(`replied_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_settings` (
    `id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `opening_hours` JSON NOT NULL,
    `delivery_rules` JSON NOT NULL,
    `accepting_orders` BOOLEAN NOT NULL DEFAULT true,
    `payment_timeout_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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
    `animation_preset` ENUM('ROLL_LEFT', 'SLIDE_RIGHT', 'RISE', 'STATIC') NOT NULL DEFAULT 'ROLL_LEFT',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `extra_assets` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_story_sections_1`(`dish_id`),
    INDEX `fk_story_sections_2`(`image_id`),
    INDEX `ix_story_public`(`is_published`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_tags_code`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_ingredient_restrictions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `ingredient_id` BIGINT UNSIGNED NOT NULL,
    `reason` ENUM('DISLIKE', 'ALLERGY', 'OTHER') NOT NULL DEFAULT 'DISLIKE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_user_ingredient_restrictions_2`(`ingredient_id`),
    UNIQUE INDEX `uq_user_ingredient`(`user_id`, `ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_interactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `dish_id` BIGINT UNSIGNED NOT NULL,
    `recommendation_id` BIGINT UNSIGNED NULL,
    `event_type` ENUM('VIEW', 'CLICK_RECOMMENDATION', 'ADD_TO_CART') NOT NULL DEFAULT 'VIEW',
    `event_key` VARCHAR(64) NOT NULL,
    `occurred_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_interaction_event`(`event_key`),
    INDEX `fk_user_interactions_3`(`recommendation_id`),
    INDEX `ix_interaction_dish_type`(`dish_id`, `event_type`, `occurred_at`),
    INDEX `ix_interaction_user_time`(`user_id`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `spicy_level` TINYINT UNSIGNED NULL,
    `budget_per_meal` DECIMAL(12, 0) NULL,
    `personalization_enabled` BOOLEAN NOT NULL DEFAULT false,
    `consented_at` DATETIME(3) NULL,
    `dietary_note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_preferences_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_tag_preferences` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,
    `preference` ENUM('LIKE', 'AVOID') NOT NULL DEFAULT 'LIKE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_user_tag_preferences_2`(`tag_id`),
    UNIQUE INDEX `uq_user_tag`(`user_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('CUSTOMER', 'OPERATOR', 'KITCHEN', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'LOCKED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
    `email_verified_at` DATETIME(3) NULL,
    `deactivated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_users_email`(`email`),
    INDEX `ix_users_role_status`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `account_tokens` ADD CONSTRAINT `fk_account_tokens_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `fk_addresses_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ai_conversations` ADD CONSTRAINT `fk_ai_conversations_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ai_messages` ADD CONSTRAINT `fk_ai_messages_1` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `fk_auth_sessions_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart_item_options` ADD CONSTRAINT `fk_cart_item_options_1` FOREIGN KEY (`cart_item_id`, `dish_id`) REFERENCES `cart_items`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart_item_options` ADD CONSTRAINT `fk_cart_item_options_2` FOREIGN KEY (`option_value_id`, `dish_id`) REFERENCES `option_values`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `fk_cart_items_1` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `fk_cart_items_2` FOREIGN KEY (`variant_id`, `dish_id`) REFERENCES `dish_variants`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `fk_carts_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `fk_coupon_redemptions_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `coupon_redemptions` ADD CONSTRAINT `fk_coupon_redemptions_2` FOREIGN KEY (`order_id`, `user_id`) REFERENCES `orders`(`id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_images` ADD CONSTRAINT `fk_dish_images_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_ingredients` ADD CONSTRAINT `fk_dish_ingredients_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_ingredients` ADD CONSTRAINT `fk_dish_ingredients_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_tags` ADD CONSTRAINT `fk_dish_tags_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_tags` ADD CONSTRAINT `fk_dish_tags_2` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dish_variants` ADD CONSTRAINT `fk_dish_variants_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dishes` ADD CONSTRAINT `fk_dishes_1` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `fk_favorites_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `fk_favorites_2` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `option_groups` ADD CONSTRAINT `fk_option_groups_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `option_values` ADD CONSTRAINT `fk_option_values_1` FOREIGN KEY (`group_id`, `dish_id`) REFERENCES `option_groups`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_events` ADD CONSTRAINT `fk_order_events_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_events` ADD CONSTRAINT `fk_order_events_2` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_item_options` ADD CONSTRAINT `fk_order_item_options_1` FOREIGN KEY (`order_item_id`, `dish_id`) REFERENCES `order_items`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_item_options` ADD CONSTRAINT `fk_order_item_options_2` FOREIGN KEY (`option_value_id`, `dish_id`) REFERENCES `option_values`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `fk_order_items_2` FOREIGN KEY (`variant_id`, `dish_id`) REFERENCES `dish_variants`(`id`, `dish_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `fk_orders_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `payment_events` ADD CONSTRAINT `fk_payment_events_1` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recommendation_items` ADD CONSTRAINT `fk_recommendation_items_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recommendation_items` ADD CONSTRAINT `fk_recommendation_items_2` FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recommendation_items` ADD CONSTRAINT `fk_recommendation_items_3` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `fk_refunds_1` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `fk_refunds_2` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `fk_reviews_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `fk_reviews_2` FOREIGN KEY (`replied_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `story_sections` ADD CONSTRAINT `fk_story_sections_1` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `story_sections` ADD CONSTRAINT `fk_story_sections_2` FOREIGN KEY (`image_id`) REFERENCES `dish_images`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_ingredient_restrictions` ADD CONSTRAINT `fk_user_ingredient_restrictions_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_ingredient_restrictions` ADD CONSTRAINT `fk_user_ingredient_restrictions_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_interactions` ADD CONSTRAINT `fk_user_interactions_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_interactions` ADD CONSTRAINT `fk_user_interactions_2` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_interactions` ADD CONSTRAINT `fk_user_interactions_3` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendation_items`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `fk_user_preferences_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_tag_preferences` ADD CONSTRAINT `fk_user_tag_preferences_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_tag_preferences` ADD CONSTRAINT `fk_user_tag_preferences_2` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
