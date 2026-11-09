"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Dish, DishVariant, OptionGroup } from "@/features/admin-catalog/types";
import { cartApi } from "@/features/cart/api/cart.api";
import { CartItemOption } from "@/features/cart/types";
import { httpClient } from "@/lib/http/client";

interface UseDishCustomizerProps {
  dish: Dish | null;
  currentImageUrl: string;
}

export function useDishCustomizer({ dish, currentImageUrl }: UseDishCustomizerProps) {
  const [selectedVariant, setSelectedVariant] = useState<DishVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Khởi tạo variant và options mặc định khi dish thay đổi
  useEffect(() => {
    if (!dish) return;

    const defaultVar =
      dish.variants?.find((v) => v.is_default) || dish.variants?.[0] || null;
    setSelectedVariant(defaultVar);

    if (dish.option_groups) {
      const initialOptions: Record<string, string[]> = {};
      dish.option_groups.forEach((g) => {
        if (g.id) {
          const def =
            g.items
              ?.filter((it) => it.is_default && Boolean(it.id))
              .map((it) => it.id as string) || [];
          if (def.length > 0) initialOptions[g.id] = def;
        }
      });
      setSelectedOptions(initialOptions);
    } else {
      setSelectedOptions({});
    }

    setQuantity(1);
    setSpecialNotes("");
  }, [dish]);

  // Tính toán đơn giá và tổng giá tiền
  const { unitPrice, totalPrice, selectedOptionIdsList, selectedOptionsDetail } =
    useMemo(() => {
      if (!dish) {
        return {
          unitPrice: 0,
          totalPrice: 0,
          selectedOptionIdsList: [],
          selectedOptionsDetail: [],
        };
      }

      const basePrice = Number(dish.base_price || 0);
      const variantAdj = Number(selectedVariant?.price_adjustment || 0);

      let optionsAdj = 0;
      const optionIds: string[] = [];
      const optionsDetail: CartItemOption[] = [];

      if (dish.option_groups) {
        dish.option_groups.forEach((group) => {
          const gId = group.id;
          if (!gId) return;
          const selectedForGroup = selectedOptions[gId] || [];
          group.items?.forEach((item) => {
            if (item.id && selectedForGroup.includes(item.id)) {
              const extra = Number(item.price_adjustment || 0);
              optionsAdj += extra;
              optionIds.push(item.id);
              optionsDetail.push({
                option_id: item.id,
                name: item.name,
                price_adjustment: extra,
              });
            }
          });
        });
      }

      const calculatedUnitPrice = basePrice + variantAdj + optionsAdj;
      const calculatedTotalPrice = calculatedUnitPrice * quantity;

      return {
        unitPrice: calculatedUnitPrice,
        totalPrice: calculatedTotalPrice,
        selectedOptionIdsList: optionIds,
        selectedOptionsDetail: optionsDetail,
      };
    }, [dish, selectedVariant, selectedOptions, quantity]);

  // Bật/tắt topping hoặc tùy chọn
  const handleToggleOption = useCallback((group: OptionGroup, itemId: string) => {
    const gId = group.id;
    if (!gId) return;

    setSelectedOptions((prev) => {
      const current = prev[gId] || [];
      const isAlreadySelected = current.includes(itemId);

      if (group.max_choices === 1) {
        // Radio: Chọn 1 lựa chọn duy nhất
        return {
          ...prev,
          [gId]: isAlreadySelected && !group.is_required ? [] : [itemId],
        };
      }

      // Checkbox: Chọn nhiều
      if (isAlreadySelected) {
        return {
          ...prev,
          [gId]: current.filter((id) => id !== itemId),
        };
      }

      if (group.max_choices && current.length >= group.max_choices) {
        return prev; // Đã đạt giới hạn tối đa
      }

      return {
        ...prev,
        [gId]: [...current, itemId],
      };
    });
  }, []);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = useCallback(async () => {
    if (!dish) return;

    const token = httpClient.getToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("viviet_auth_required", {
          detail: {
            redirectUrl: `/mon/${dish.slug}`,
            message: `Quý khách vui lòng đăng nhập tài khoản để thêm "${dish.name}" vào giỏ hàng và đặt món.`,
          },
        })
      );
      return;
    }

    setIsAdding(true);
    try {
      // Optimistic feedback
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 4000);

      await cartApi.addToCart({
        dish_id: dish.id,
        dish_name: dish.name,
        dish_slug: dish.slug,
        dish_image: currentImageUrl,
        variant_id: selectedVariant?.id,
        variant_name: selectedVariant?.name,
        unit_price: unitPrice,
        quantity,
        note: specialNotes || undefined,
        option_ids: selectedOptionIdsList.length > 0 ? selectedOptionIdsList : undefined,
        options: selectedOptionsDetail,
      });
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddedSuccess(false);
    } finally {
      setIsAdding(false);
    }
  }, [
    dish,
    currentImageUrl,
    selectedVariant,
    unitPrice,
    quantity,
    specialNotes,
    selectedOptionIdsList,
    selectedOptionsDetail,
  ]);

  return {
    selectedVariant,
    setSelectedVariant,
    selectedOptions,
    handleToggleOption,
    quantity,
    setQuantity,
    specialNotes,
    setSpecialNotes,
    unitPrice,
    totalPrice,
    isAdding,
    addedSuccess,
    handleAddToCart,
  };
}
