"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  Flame,
  Leaf,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { cartApi } from "@/features/cart/api/cart.api";
import { Cart } from "@/features/cart/types";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { CatalogDish } from "@/features/catalog/types";
import { promotionsApi } from "@/features/promotions/api/promotions.api";
import { httpClient } from "@/lib/http/client";

const FREE_SHIPPING_THRESHOLD = 300000; // Miễn phí vận chuyển từ 300.000 đ
const BASE_SHIPPING_FEE = 20000; // Phí ship cơ bản 20.000 đ

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Khối gợi ý món dùng kèm (Cross-sell)
  const [recommendedDishes, setRecommendedDishes] = useState<CatalogDish[]>([]);
  const [addingRecId, setAddingRecId] = useState<string | null>(null);

  // Mã giảm giá (Coupon)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("viviet_page_ready"));
      }
    }
  };

  useEffect(() => {
    loadCart();

    // Nạp gợi ý món kèm từ thực đơn
    catalogApi
      .getDishes({ limit: 8 })
      .then((dishes) => {
        // Lấy các món tráng miệng, thức uống hoặc món đặc sắc
        setRecommendedDishes(dishes.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  // Xử lý cập nhật số lượng (Optimistic UI - 0ms)
  const handleUpdateQty = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    setIsUpdating(itemId);

    // Optimistic update ngay lập tức trên UI
    setCart((prev) => {
      if (!prev) return prev;
      if (newQty <= 0) {
        const nextItems = prev.items.filter((it) => it.id !== itemId);
        const subtotal = nextItems.reduce((s, it) => s + (it.unit_price || 0) * it.quantity, 0);
        return { ...prev, items: nextItems, subtotal, total: Math.max(0, subtotal - prev.discount) };
      }
      const nextItems = prev.items.map((it) =>
        it.id === itemId ? { ...it, quantity: newQty } : it
      );
      const subtotal = nextItems.reduce((s, it) => s + (it.unit_price || 0) * it.quantity, 0);
      return { ...prev, items: nextItems, subtotal, total: Math.max(0, subtotal - prev.discount) };
    });

    try {
      let updated: Cart | null;
      if (newQty <= 0) {
        updated = await cartApi.removeCartItem(itemId);
      } else {
        updated = await cartApi.updateCartItem(itemId, { quantity: newQty });
      }
      if (updated) {
        setCart(updated);
        if (appliedCoupon) {
          revalidateCoupon(appliedCoupon.code, updated.subtotal);
        }
      }
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
      // Nạp lại nếu lỗi
      loadCart();
    } finally {
      setIsUpdating(null);
    }
  };

  // Xử lý xóa món khỏi giỏ (Optimistic UI - 0ms)
  const handleRemove = async (itemId: string) => {
    setIsUpdating(itemId);

    // Optimistic update ngay lập tức
    setCart((prev) => {
      if (!prev) return prev;
      const nextItems = prev.items.filter((it) => it.id !== itemId);
      const subtotal = nextItems.reduce((s, it) => s + (it.unit_price || 0) * it.quantity, 0);
      return { ...prev, items: nextItems, subtotal, total: Math.max(0, subtotal - prev.discount) };
    });

    try {
      const updated = await cartApi.removeCartItem(itemId);
      if (updated) {
        setCart(updated);
        if (appliedCoupon) {
          revalidateCoupon(appliedCoupon.code, updated.subtotal);
        }
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
      loadCart();
    } finally {
      setIsUpdating(null);
    }
  };

  // Xử lý xóa toàn bộ giỏ hàng
  const handleClear = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng này?")) {
      return;
    }
    try {
      await cartApi.clearCart();
      setCart({ items: [], subtotal: 0, discount: 0, total: 0 });
      setAppliedCoupon(null);
      setCouponSuccess(null);
      setCouponError(null);
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  // Tái kiểm tra coupon khi số lượng món thay đổi
  const revalidateCoupon = async (code: string, currentSubtotal: number) => {
    try {
      const res = await promotionsApi.validateCoupon(code, currentSubtotal, BASE_SHIPPING_FEE);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discount: res.discount_amount,
          message: res.message,
        });
      } else {
        setAppliedCoupon(null);
        setCouponError("Mã giảm giá không còn đủ điều kiện áp dụng cho giá trị đơn hiện tại.");
      }
    } catch {
      setAppliedCoupon(null);
    }
  };

  // Xử lý áp dụng mã coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    const subtotal = cart?.subtotal || 0;
    try {
      const res = await promotionsApi.validateCoupon(
        couponCode.trim().toUpperCase(),
        subtotal,
        subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE
      );

      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discount: res.discount_amount,
          message: res.message,
        });
        setCouponSuccess(res.message || `Đã áp dụng mã "${res.code}" thành công!`);
      } else {
        setCouponError(res.message || "Mã ưu đãi không hợp lệ hoặc đã hết lượt sử dụng.");
      }
    } catch (err: any) {
      setCouponError(err.message || "Không thể xác thực mã giảm giá vào lúc này.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Hủy mã giảm giá
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess(null);
    setCouponError(null);
    setCouponCode("");
  };

  // Thêm nhanh món gợi ý vào giỏ hàng
  const handleAddRecommended = async (dish: CatalogDish) => {
    const token = httpClient.getToken();
    if (!token) {
      window.dispatchEvent(
        new CustomEvent("viviet_auth_required", {
          detail: {
            redirectUrl: "/gio-hang",
            message: `Vui lòng đăng nhập để thêm "${dish.name}" vào giỏ hàng.`,
          },
        })
      );
      return;
    }

    setAddingRecId(dish.id);
    try {
      const updated = await cartApi.addToCart({
        dish_id: dish.id,
        dish_name: dish.name,
        dish_slug: dish.slug,
        dish_image: dish.image_url,
        unit_price: dish.base_price,
        quantity: 1,
      });
      setCart(updated);
      window.dispatchEvent(new CustomEvent("viviet_cart_updated"));
    } catch (err) {
      console.error("Failed to add recommended dish:", err);
    } finally {
      setAddingRecId(null);
    }
  };

  const isLoggedIn = Boolean(httpClient.getToken());

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Khách chưa đăng nhập: Hiển thị màn hình yêu cầu đăng nhập theo Phương án 2
  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 bg-[#fff8f6]">
        <div className="max-w-md w-full bg-white border border-[#e2beba]/60 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl shadow-red-950/5">
          <div className="w-20 h-20 rounded-full bg-[#fff1eb] border border-[#e2beba]/60 text-primary mx-auto flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-turmeric block">
              Tài Khoản Thành Viên Vị Việt
            </span>
            <h1 className="font-headline text-2xl font-extrabold text-[#1c1917]">
              Đăng Nhập Để Xem Giỏ Mỹ Vị
            </h1>
            <p className="text-xs text-[#5a413d] leading-relaxed pt-1">
              Giỏ hàng, các món ăn bạn đã chọn và quyền lợi tích điểm hội viên được bảo mật theo tài khoản cá nhân của quý khách.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link href="/dang-nhap?redirect=/gio-hang" className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/dang-ky?redirect=/gio-hang" className="block">
              <Button
                variant="outline"
                size="md"
                className="w-full py-3 rounded-full text-xs font-semibold text-[#5a413d] border-[#e2beba] hover:bg-[#fff8f6] cursor-pointer"
              >
                <span>Chưa có tài khoản? Đăng ký</span>
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-[#e2beba]/30">
            <Link href="/thuc-don" className="text-xs font-semibold text-primary hover:underline">
              ← Khám phá thực đơn Vị Việt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;
  const subtotal = cart?.subtotal || 0;
  const isFreeShip = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = isEmpty ? 0 : isFreeShip ? 0 : BASE_SHIPPING_FEE;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : cart?.discount || 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  // Tiến trình đạt Freeship
  const freeShipPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const freeShipRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="min-h-screen bg-[#fff8f6] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ================= 1. BREADCRUMBS & TIÊU ĐỀ TRANG ================= */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#8e706c] mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold">Giỏ hàng ẩm thực</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2beba]/50 pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-turmeric block">
                Contemporary Dining Bag
              </span>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c1917] flex items-center gap-3 mt-0.5">
                <span>Giỏ Mỹ Vị Của Bạn</span>
                <span className="text-xs font-mono font-bold bg-[#fff1eb] text-primary border border-primary/20 px-3 py-1 rounded-full">
                  {items.reduce((s, it) => s + it.quantity, 0)} món
                </span>
              </h1>
            </div>

            {!isEmpty && (
              <button
                type="button"
                onClick={handleClear}
                className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Làm trống toàn bộ giỏ hàng"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ giỏ</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= 2. GIỎ HÀNG TRỐNG (EMPTY STATE) ================= */}
        {isEmpty ? (
          <div className="space-y-12">
            <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-10 sm:p-16 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#fff1eb] border border-[#e2beba]/60 mx-auto flex items-center justify-center text-primary mb-5 shadow-xs">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h2 className="font-headline text-2xl font-bold text-[#1c1917]">
                Giỏ Mỹ Vị Của Bạn Đang Trống
              </h2>
              <p className="text-xs sm:text-sm text-[#5a413d] max-w-md mx-auto mt-2 leading-relaxed">
                Hành trình ẩm thực di sản đương đại đang đón chờ. Hãy chọn những món ăn nóng sốt từ thực đơn Bếp Mẹ để bắt đầu trải nghiệm.
              </p>
              <div className="pt-6">
                <Link href="/thuc-don">
                  <Button
                    variant="primary"
                    size="lg"
                    className="rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                  >
                    <span>Khám phá thực đơn Vị Việt</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Gợi ý món ngon khi giỏ trống */}
            {recommendedDishes.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-turmeric block">
                    Tuyển Chọn Đặc Sắc
                  </span>
                  <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#1c1917] mt-0.5">
                    Mỹ Vị Khuyên Dùng Dành Cho Bạn
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
                  {recommendedDishes.map((rDish) => (
                    <div
                      key={rDish.id}
                      className="group bg-white rounded-2xl border border-[#e2beba]/50 p-3 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <Link href={`/mon/${rDish.slug}`} className="block relative aspect-square rounded-xl overflow-hidden bg-[#fff8f6] mb-3">
                          <Image
                            src={rDish.image_url || "/placeholder-dish.jpg"}
                            alt={rDish.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                        <span className="text-[10px] uppercase font-bold text-turmeric block">
                          {rDish.category?.name || "Di sản"}
                        </span>
                        <Link href={`/mon/${rDish.slug}`}>
                          <h4 className="font-headline text-sm font-bold text-[#1c1917] line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                            {rDish.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#e2beba]/40 flex items-center justify-between">
                        <span className="font-mono text-xs sm:text-sm font-bold text-primary">
                          {formatVND(rDish.base_price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddRecommended(rDish)}
                          disabled={addingRecId === rDish.id}
                          className="cursor-pointer text-xs font-bold bg-[#fff1eb] text-primary hover:bg-primary hover:text-white px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= 3. GIỎ HÀNG CÓ MÓN (ACTIVE CART) ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cột Trái: Danh sách các món ăn trong giỏ (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Danh sách thẻ món ăn */}
              <div className="divide-y divide-[#e2beba]/40 border border-[#e2beba]/60 rounded-3xl overflow-hidden bg-white shadow-xs">
                {items.map((it) => {
                  const itemTotal = it.unit_price * it.quantity;
                  const dishLink = it.dish_slug ? `/mon/${it.dish_slug}` : `/thuc-don`;

                  return (
                    <div
                      key={it.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#fffcfb] transition-colors"
                    >
                      {/* Ảnh & Thông tin món */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Thumbnail món ăn */}
                        <Link
                          href={dishLink}
                          className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-[#fff8f6] shrink-0 border border-[#e2beba]/40 group"
                        >
                          <img
                            src={it.dish_image || "/placeholder-dish.jpg"}
                            alt={it.dish_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Chi tiết tên, biến thể, topping, ghi chú */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <Link href={dishLink}>
                            <h3 className="font-headline font-bold text-sm sm:text-base text-[#1c1917] hover:text-primary transition-colors line-clamp-1">
                              {it.dish_name}
                            </h3>
                          </Link>

                          {/* Đơn giá */}
                          <div className="text-xs font-mono text-[#8e706c]">
                            Đơn giá: <span className="font-semibold text-[#1c1917]">{formatVND(it.unit_price)}</span>
                          </div>

                          {/* Biến thể */}
                          {it.variant_name && (
                            <div className="inline-flex items-center text-[11px] font-semibold text-turmeric bg-[#fff7ed] border border-amber-200/80 px-2 py-0.5 rounded-full">
                              Khẩu phần: {it.variant_name}
                            </div>
                          )}

                          {/* Topping tùy chọn */}
                          {it.options && it.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {it.options.map((opt, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] text-[#5a413d] bg-[#fbf5f2] border border-[#e2beba]/50 px-2 py-0.5 rounded-md"
                                >
                                  + {opt.name}{" "}
                                  {opt.price_adjustment > 0 && `(${formatVND(opt.price_adjustment)})`}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Ghi chú bếp */}
                          {it.notes && (
                            <p className="text-[11px] text-[#8e706c] bg-[#fff8f6] border border-[#e2beba]/50 px-2.5 py-1 rounded-lg inline-block">
                              💬 <span className="italic">Ghi chú: {it.notes}</span>
                            </p>
                          )}

                          {/* Hiển thị thành tiền trên Mobile */}
                          <div className="sm:hidden pt-2 flex items-center justify-between">
                            <span className="text-xs text-[#8e706c]">Thành tiền:</span>
                            <span className="font-mono font-bold text-primary text-base">
                              {formatVND(itemTotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bộ điều khiển số lượng & Nút Xóa (Bên phải) */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2beba]/30">
                        {/* Bộ tăng/giảm (+ / -) */}
                        <div className="flex items-center border border-[#e2beba] rounded-full bg-[#fff8f6] p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.id, it.quantity, -1)}
                            disabled={isUpdating === it.id}
                            className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#1c1917] hover:bg-white hover:text-primary transition-all disabled:opacity-40"
                            title="Giảm bớt 1 phần"
                            aria-label="Giảm"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 sm:w-9 text-center text-xs sm:text-sm font-bold font-mono text-[#1c1917]">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.id, it.quantity, 1)}
                            disabled={isUpdating === it.id}
                            className="cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#1c1917] hover:bg-white hover:text-primary transition-all disabled:opacity-40"
                            title="Thêm 1 phần"
                            aria-label="Tăng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Thành tiền trên Desktop */}
                        <div className="hidden sm:block text-right min-w-[110px]">
                          <span className="font-bold text-primary text-base font-mono block">
                            {formatVND(itemTotal)}
                          </span>
                        </div>

                        {/* Nút Xóa món */}
                        <button
                          type="button"
                          onClick={() => handleRemove(it.id)}
                          disabled={isUpdating === it.id}
                          className="cursor-pointer text-[#8e706c] hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Xóa món này khỏi giỏ"
                          aria-label="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nút tiếp tục chọn món */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/thuc-don"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#5a413d] hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tiếp tục chọn thêm món mỹ vị</span>
                </Link>
              </div>

              {/* Khối gợi ý món dùng kèm (Pairing Recommendations) */}
              {recommendedDishes.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#e2beba]/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-turmeric block">
                        Chef&apos;s Pairing
                      </span>
                      <h3 className="font-headline text-lg font-bold text-[#1c1917]">
                        Mỹ Vị Khuyên Dùng Kèm
                      </h3>
                    </div>
                    <Link
                      href="/thuc-don"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {recommendedDishes.map((rDish) => (
                      <div
                        key={rDish.id}
                        className="bg-white rounded-2xl border border-[#e2beba]/40 p-2.5 flex flex-col justify-between hover:border-primary/40 hover:shadow-xs transition-all group"
                      >
                        <div>
                          <Link
                            href={`/mon/${rDish.slug}`}
                            className="block relative aspect-square rounded-xl overflow-hidden bg-[#fff8f6] mb-2"
                          >
                            <img
                              src={rDish.image_url || "/placeholder-dish.jpg"}
                              alt={rDish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                          <Link href={`/mon/${rDish.slug}`}>
                            <h4 className="font-headline text-xs font-bold text-[#1c1917] line-clamp-1 group-hover:text-primary transition-colors">
                              {rDish.name}
                            </h4>
                          </Link>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#e2beba]/30 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">
                            {formatVND(rDish.base_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddRecommended(rDish)}
                            disabled={addingRecId === rDish.id}
                            className="cursor-pointer text-[11px] font-bold bg-[#fff1eb] text-primary hover:bg-primary hover:text-white px-2 py-1 rounded-full transition-colors flex items-center gap-0.5"
                            title="Thêm nhanh vào giỏ"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cột Phải: Tóm tắt đơn hàng & Thanh toán (4 cols - Sticky) */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-6 sm:p-7 shadow-lg shadow-red-950/5 space-y-5">
                <h2 className="font-headline text-lg font-bold text-[#1c1917] border-b border-[#e2beba]/40 pb-3 flex items-center justify-between">
                  <span>Tóm Tắt Bàn Tiệc</span>
                  <Sparkles className="w-4 h-4 text-turmeric" />
                </h2>

                {/* Thanh tiến trình Miễn phí vận chuyển */}
                <div className="bg-[#fff8f6] border border-[#e2beba]/50 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-[#5a413d]">
                      <Truck className="w-3.5 h-3.5 text-primary" />
                      <span>Giao hàng tận nơi:</span>
                    </span>
                    <span className={isFreeShip ? "text-emerald-700 font-bold" : "text-primary font-bold"}>
                      {isFreeShip ? "Đạt chuẩn Freeship 🎉" : `Còn ${formatVND(freeShipRemaining)}`}
                    </span>
                  </div>

                  <div className="w-full bg-[#e2beba]/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-turmeric to-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${freeShipPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#8e706c]">
                    {isFreeShip
                      ? "Chúc mừng! Đơn hàng của bạn được MIỄN PHÍ VẬN CHUYỂN thố nhiệt."
                      : `Thêm món để nhận Miễn phí vận chuyển cho đơn từ ${formatVND(FREE_SHIPPING_THRESHOLD)}.`}
                  </p>
                </div>

                {/* Bảng chi tiết giá */}
                <div className="space-y-2.5 text-xs text-[#5a413d]">
                  <div className="flex justify-between items-center">
                    <span>Tạm tính tiền món:</span>
                    <span className="font-mono font-semibold text-[#1c1917] text-sm">
                      {formatVND(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Phí vận chuyển giao nóng:</span>
                    <span className="font-mono font-semibold text-[#1c1917]">
                      {isFreeShip ? (
                        <span className="text-emerald-700 font-bold">Miễn phí</span>
                      ) : (
                        formatVND(shippingFee)
                      )}
                    </span>
                  </div>

                  {/* Giảm giá từ Coupon */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Ưu đãi ({appliedCoupon.code}):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">-{formatVND(discountAmount)}</span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="cursor-pointer text-[10px] text-red-600 hover:underline"
                          title="Gỡ mã giảm giá"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phân cách */}
                  <div className="pt-3 border-t border-[#e2beba]/40">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-headline font-bold text-[#1c1917] text-sm block">
                          Tổng thanh toán:
                        </span>
                        <span className="text-[10px] text-[#8e706c] block">
                          (Đã bao gồm VAT &amp; thố nhiệt bảo quản)
                        </span>
                      </div>
                      <span className="font-headline font-black text-primary text-2xl font-mono">
                        {formatVND(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ô nhập mã giảm giá (Coupon Input) */}
                <form onSubmit={handleApplyCoupon} className="pt-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 text-[#8e706c] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Mã ưu đãi (VIVET...)"
                        disabled={couponLoading || !!appliedCoupon}
                        className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-[#fff8f6] border border-[#e2beba] rounded-xl focus:outline-none focus:border-primary disabled:opacity-60 text-[#1c1917]"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={couponLoading || !couponCode.trim() || !!appliedCoupon}
                      className="rounded-xl px-4 text-xs font-bold cursor-pointer"
                    >
                      {couponLoading ? "Kiểm tra..." : "Áp dụng"}
                    </Button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                  {couponSuccess && (
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{couponSuccess}</span>
                    </p>
                  )}
                </form>

                {/* Nút Tiến hành thanh toán */}
                <Link href="/thanh-toan" className="block pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Tiến Hành Đặt Món &amp; Thanh Toán</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* 3 Cam Kết Vàng của Vị Việt */}
              <div className="bg-[#fff8f6] border border-[#e2beba]/50 rounded-3xl p-5 space-y-3.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-turmeric block">
                  Tiêu Chuẩn Phục Vụ
                </span>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#fff1eb] text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1c1917]">Giao Nóng Thố Nhiệt 88°C</h4>
                    <p className="text-[11px] text-[#8e706c] leading-relaxed">
                      Thùng giữ nhiệt đa tầng giữ nguyên độ thơm giòn và hương vị như dùng tại nhà hàng.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#fff1eb] text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1c1917]">Bảo Hiểm Mỹ Vị 100%</h4>
                    <p className="text-[11px] text-[#8e706c] leading-relaxed">
                      Đổi mới ngay lập tức hoặc hoàn tiền nếu món ăn không đúng chất lượng cam kết.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#fff1eb] text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1c1917]">Đóng Gói Sinh Học Tự Nhiên</h4>
                    <p className="text-[11px] text-[#8e706c] leading-relaxed">
                      Khay bã mía hữu cơ phân hủy sinh học cùng bộ đũa thìa gỗ bảo vệ môi trường.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
