"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  TicketPercent,
  AlertCircle,
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  User,
} from "lucide-react";
import { formatVND } from "@/lib/utils/currency";
import { cartApi } from "@/features/cart/api/cart.api";
import { Cart } from "@/features/cart/types";
import { ordersApi } from "@/features/orders/api/orders.api";
import { paymentsApi } from "@/features/admin-payments/api/admin-payments.api";
import { promotionsApi } from "@/features/promotions/api/promotions.api";
import { userProfileApi, UserAddress } from "@/features/auth/api/user-profile.api";
import { storeSettingsApi } from "@/features/admin-settings/api/store-settings.api";
import { httpClient } from "@/lib/http/client";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "COD">("VNPAY");

  // Thông tin người nhận
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  // Sổ địa chỉ đã lưu của thành viên
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Cấu hình cửa hàng & mã giảm giá
  const [storeAddress, setStoreAddress] = useState("123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh");
  const storeOpeningHours = "07:00 - 22:00";
  const [shippingFee, setShippingFee] = useState(20000);
  const [freeShipThreshold, setFreeShipThreshold] = useState(300000);

  // Trạng thái Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    message?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Trạng thái trang
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function initCheckout() {
      const token = httpClient.getToken();
      if (!token) {
        router.push("/dang-nhap?redirect=/thanh-toan");
        return;
      }

      setIsLoading(true);
      setIsLoggedIn(true);

      try {
        const [c, storeSettings, profile, addresses] = await Promise.allSettled([
          cartApi.getCart(),
          storeSettingsApi.getPublicSettings(),
          userProfileApi.getProfile(),
          userProfileApi.getAddresses(),
        ]);

        if (c.status === "fulfilled" && c.value) {
          setCart(c.value);
        }

        if (storeSettings.status === "fulfilled" && storeSettings.value) {
          const rules: any = storeSettings.value.delivery_rules || {};
          const fee = Number(rules.base_fee || 20000);
          const threshold = Number(rules.free_shipping_threshold || 300000);
          setShippingFee(fee);
          setFreeShipThreshold(threshold);
          if (storeSettings.value.address) {
            setStoreAddress(storeSettings.value.address);
          }
        }

        if (profile.status === "fulfilled" && profile.value) {
          if (!recipientName) setRecipientName(profile.value.full_name || "");
          if (!recipientPhone) setRecipientPhone(profile.value.phone || "");
        }

        if (addresses.status === "fulfilled" && Array.isArray(addresses.value)) {
          setSavedAddresses(addresses.value);
          const defaultAddr = addresses.value.find((a) => a.is_default) || addresses.value[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setDeliveryAddress(defaultAddr.address_line);
            if (defaultAddr.recipient_name) setRecipientName(defaultAddr.recipient_name);
            if (defaultAddr.phone) setRecipientPhone(defaultAddr.phone);
          }
        }
      } catch (err) {
        console.error("Failed to initialize checkout:", err);
      } finally {
        setIsLoading(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("viviet_page_ready"));
        }
      }
    }
    initCheckout();
  }, []);

  // Xử lý khi chọn một địa chỉ đã lưu
  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setDeliveryAddress(addr.address_line);
    if (addr.recipient_name) setRecipientName(addr.recipient_name);
    if (addr.phone) setRecipientPhone(addr.phone);
  };

  // Áp dụng mã giảm giá
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const isFreeShip =
        fulfillmentType === "PICKUP" || (freeShipThreshold > 0 && (cart?.subtotal || 0) >= freeShipThreshold);
      const feeToValidate = isFreeShip ? 0 : shippingFee;

      const res = await promotionsApi.validateCoupon(
        couponCode.trim().toUpperCase(),
        cart?.subtotal || 0,
        feeToValidate
      );

      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discount: res.discount_amount,
          message: res.message,
        });
      } else {
        setCouponError(res.message || "Mã giảm giá không hợp lệ hoặc đã hết lượt.");
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err.message || "Không thể kiểm tra mã giảm giá vào lúc này.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Xác nhận đặt hàng
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = httpClient.getToken();
    if (!token) {
      router.push("/dang-nhap?redirect=/thanh-toan");
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên và số điện thoại người nhận.");
      return;
    }

    if (fulfillmentType === "DELIVERY" && !deliveryAddress.trim()) {
      setErrorMessage("Vui lòng cung cấp địa chỉ nhận món để nhân viên giao hàng nóng thố nhiệt.");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setErrorMessage("Giỏ hàng của bạn đang trống, vui lòng chọn món trước khi đặt.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const checkoutKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const order = await ordersApi.checkout({
        checkout_key: checkoutKey,
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        delivery_address: fulfillmentType === "DELIVERY" ? deliveryAddress.trim() : undefined,
        delivery_note: fulfillmentType === "DELIVERY" && deliveryNote ? deliveryNote.trim() : undefined,
        customer_note: customerNote ? customerNote.trim() : undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      });

      // Dọn sạch giỏ hàng địa phương và cập nhật badge ngay lập tức (0ms)
      if (typeof window !== "undefined") {
        localStorage.removeItem("viviet_guest_cart");
        window.dispatchEvent(new CustomEvent("viviet_cart_updated", { detail: { count: 0 } }));
      }

      // Nếu chọn thanh toán VNPAY
      if (paymentMethod === "VNPAY") {
        try {
          const paymentRes: any = await paymentsApi.createPaymentAttempt(order.id, {
            provider: "VNPAY",
          });

          const redirectUrl = paymentRes?.redirectUrl || paymentRes?.payment_url;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        } catch (payErr: any) {
          console.error("VNPAY creation failed:", payErr);
          // Nếu tạo link VNPAY thất bại, chuyển tới trang kết quả để khách thanh toán lại
          router.push(
            `/thanh-toan/ket-qua?status=failed&orderCode=${order.order_code}&message=${encodeURIComponent(
              payErr.message || "Lỗi khởi tạo cổng VNPAY"
            )}`
          );
          return;
        }
      }

      // Thanh toán tiền mặt (COD) hoặc Đến quán lấy món thành công
      router.push(
        `/thanh-toan/ket-qua?status=success&orderCode=${order.order_code}&amount=${
          Number(order.total_amount) * 100
        }&vnp_ResponseCode=00&vnp_TxnRef=${order.order_code}&vnp_Amount=${
          Number(order.total_amount) * 100
        }&payment_method=${paymentMethod}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#fff1eb] text-primary mx-auto flex items-center justify-center">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="font-headline text-2xl font-bold text-[#1c1917]">Giỏ Mỹ Vị Của Bạn Đang Trống</h2>
        <p className="text-xs text-[#5a413d]">
          Vui lòng chọn các món ăn di sản nóng sốt trước khi tiến hành thanh toán.
        </p>
        <Link href="/thuc-don">
          <Button variant="primary" size="lg" className="rounded-full px-8 mt-2">
            Khám phá thực đơn Vị Việt
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = Number(cart?.subtotal || 0);
  const isFreeShip =
    fulfillmentType === "PICKUP" || (freeShipThreshold > 0 && subtotal >= freeShipThreshold);
  const effectiveShippingFee = isFreeShip ? 0 : shippingFee;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal + effectiveShippingFee - discountAmount);

  return (
    <div className="min-h-screen bg-[#fff8f6] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumb & Tiêu đề */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#8e706c] mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/gio-hang" className="hover:text-primary transition-colors">
              Giỏ hàng
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold">Thanh toán</span>
          </nav>

          <div className="flex items-center justify-between border-b border-[#e2beba]/50 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-turmeric block">
                Contemporary Checkout
              </span>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c1917] mt-0.5">
                Hoàn Tất Đặt Bàn Tiệc
              </h1>
            </div>
            <Link
              href="/gio-hang"
              className="text-xs font-semibold text-[#8e706c] hover:text-primary flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại giỏ hàng</span>
            </Link>
          </div>
        </div>

        {/* Cảnh báo dành cho khách vãng lai chưa đăng nhập */}
        {!isLoggedIn && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="font-bold text-amber-950">
                  Bạn đang thao tác với tư cách Khách vãng lai
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Đăng nhập tài khoản để tự động lưu địa chỉ, theo dõi lộ trình đơn hàng và nhận điểm thưởng di sản.
                </p>
              </div>
            </div>
            <Link
              href="/dang-nhap?redirect=/thanh-toan"
              className="text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 px-4 py-2.5 rounded-xl text-center shrink-0 transition-colors shadow-xs"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Khối Form Đặt Hàng */}
        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Lựa chọn hình thức nhận hàng (Fulfillment Type) */}
            <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="font-headline text-base font-bold text-[#1c1917] border-b border-[#e2beba]/40 pb-3 flex items-center justify-between">
                <span>1. Hình Thức Nhận Món</span>
                <Sparkles className="w-4 h-4 text-turmeric" />
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lựa chọn 1: Giao tận nơi */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    fulfillmentType === "DELIVERY"
                      ? "border-primary bg-[#fff1eb] shadow-xs ring-1 ring-primary/40"
                      : "border-[#e2beba]/60 hover:bg-[#fffcfb]"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === "DELIVERY"}
                    onChange={() => setFulfillmentType("DELIVERY")}
                    className="mt-1 text-primary"
                  />
                  <div>
                    <span className="font-headline font-bold text-sm text-[#1c1917] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Giao Hàng Tận Nơi</span>
                    </span>
                    <span className="text-[11px] text-[#5a413d] block mt-1 leading-relaxed">
                      Thùng bảo ôn thố nhiệt 88°C giao tận cửa trong 30-45 phút.
                    </span>
                  </div>
                </label>

                {/* Lựa chọn 2: Nhận tại quán */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    fulfillmentType === "PICKUP"
                      ? "border-primary bg-[#fff1eb] shadow-xs ring-1 ring-primary/40"
                      : "border-[#e2beba]/60 hover:bg-[#fffcfb]"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    checked={fulfillmentType === "PICKUP"}
                    onChange={() => setFulfillmentType("PICKUP")}
                    className="mt-1 text-primary"
                  />
                  <div>
                    <span className="font-headline font-bold text-sm text-[#1c1917] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-turmeric" />
                      <span>Nhận Tại Nhà Hàng</span>
                    </span>
                    <span className="text-[11px] text-[#5a413d] block mt-1 leading-relaxed">
                      Đến trực tiếp bếp Vị Việt nhận món nóng hổi (Miễn phí 100%).
                    </span>
                  </div>
                </label>
              </div>

              {/* Thông tin nhà hàng nếu chọn PICKUP */}
              {fulfillmentType === "PICKUP" && (
                <div className="p-4 bg-[#fff8f6] rounded-2xl border border-[#e2beba]/60 space-y-2 text-xs text-[#5a413d]">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1c1917]">Địa chỉ nhà hàng:</strong> {storeAddress}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-turmeric shrink-0" />
                    <div>
                      <strong className="text-[#1c1917]">Giờ phục vụ đón khách:</strong> {storeOpeningHours}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8e706c] italic pt-1 border-t border-[#e2beba]/30">
                    * Bếp sẽ thắp lửa chuẩn bị sau khi xác nhận đơn. Quý khách vui lòng đến nhận sau 20-30 phút.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Thông tin người nhận & Địa chỉ */}
            <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="font-headline text-base font-bold text-[#1c1917] border-b border-[#e2beba]/40 pb-3 flex items-center justify-between">
                <span>2. Thông Tin Người Nhận</span>
                <User className="w-4 h-4 text-turmeric" />
              </h2>

              {/* Sổ địa chỉ đã lưu (nếu đã đăng nhập & có địa chỉ) */}
              {isLoggedIn && savedAddresses.length > 0 && fulfillmentType === "DELIVERY" && (
                <div className="space-y-2 pb-2">
                  <label className="text-xs font-semibold text-[#5a413d] block">
                    Chọn nhanh từ sổ địa chỉ đã lưu:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          selectedAddressId === addr.id
                            ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                            : "bg-[#fff8f6] text-[#5a413d] border-[#e2beba]/60 hover:border-primary/40"
                        }`}
                      >
                        📍 {addr.recipient_name || "Địa chỉ"} - {addr.address_line.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên người nhận"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
                <Input
                  label="Số điện thoại liên lạc"
                  placeholder="Ví dụ: 0901234567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  required
                />
              </div>

              {fulfillmentType === "DELIVERY" && (
                <>
                  <Input
                    label="Địa chỉ chi tiết nhận món"
                    placeholder="Số nhà, tên tòa nhà/ngõ, phường/xã, quận/huyện..."
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setSelectedAddressId(null);
                    }}
                    required
                  />

                  <Input
                    label="Ghi chú giao hàng (Tùy chọn)"
                    placeholder="Ví dụ: Tòa TechHub, bấm chuông số 4, gọi trước 5 phút..."
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                  />
                </>
              )}

              <Input
                label="Lời dặn dò riêng cho Bếp Mẹ (Tùy chọn)"
                placeholder="Ví dụ: Nêm gia vị vừa phải, ít cay, thố tách riêng nước dùng..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </div>

            {/* 3. Phương thức thanh toán */}
            <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="font-headline text-base font-bold text-[#1c1917] border-b border-[#e2beba]/40 pb-3 flex items-center justify-between">
                <span>3. Phương Thức Thanh Toán</span>
                <CreditCard className="w-4 h-4 text-turmeric" />
              </h2>

              <div className="space-y-3">
                {/* VNPAY */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "VNPAY"
                      ? "border-primary bg-[#fff1eb] shadow-xs ring-1 ring-primary/40"
                      : "border-[#e2beba]/60 hover:bg-[#fffcfb]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "VNPAY"}
                    onChange={() => setPaymentMethod("VNPAY")}
                    className="mt-1 text-primary"
                  />
                  <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-headline font-bold text-sm text-[#1c1917] block">
                      Thanh toán qua VNPAY (QR Pay / Thẻ ATM Nội Địa &amp; Quốc Tế)
                    </span>
                    <span className="text-[11px] text-[#5a413d] block mt-0.5 leading-relaxed">
                      Đơn hàng được xác nhận tức thì, nhà bếp ưu tiên thắp lửa và chuẩn bị nguyên liệu ngay.
                    </span>
                  </div>
                </label>

                {/* COD */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-primary bg-[#fff1eb] shadow-xs ring-1 ring-primary/40"
                      : "border-[#e2beba]/60 hover:bg-[#fffcfb]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="mt-1 text-primary"
                  />
                  <Truck className="w-5 h-5 text-turmeric shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-headline font-bold text-sm text-[#1c1917] block">
                      Thanh toán khi nhận món (Tiền mặt / Chuyển khoản lúc giao)
                    </span>
                    <span className="text-[11px] text-[#5a413d] block mt-0.5 leading-relaxed">
                      Nhân viên nhà hàng sẽ gọi điện xác nhận thực đơn trước khi thắp lửa chế biến.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT BÀN TIỆC & MÃ ƯU ĐÃI (5 Cols - Sticky) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-white border border-[#e2beba]/60 rounded-3xl p-6 sm:p-7 shadow-lg shadow-red-950/5 space-y-5">
              <h2 className="font-headline text-lg font-bold text-[#1c1917] border-b border-[#e2beba]/40 pb-3 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <span className="text-xs font-mono font-bold text-primary bg-[#fff1eb] px-2.5 py-0.5 rounded-full border border-primary/20">
                  {items.length} món
                </span>
              </h2>

              {/* Danh sách món ăn rút gọn */}
              <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-[#e2beba]/30 pr-1">
                {items.map((it) => (
                  <div key={it.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#1c1917] block truncate">
                        {it.quantity}x {it.dish_name}
                      </span>
                      {it.variant_name && (
                        <p className="text-[11px] text-turmeric font-medium">Khẩu phần: {it.variant_name}</p>
                      )}
                      {it.options && it.options.length > 0 && (
                        <p className="text-[10px] text-[#8e706c] truncate">
                          + {it.options.map((o) => o.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-primary font-bold shrink-0">
                      {formatVND(it.unit_price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ô Nhập Voucher Giảm Giá */}
              <div className="pt-3 border-t border-[#e2beba]/40 space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TicketPercent className="w-4 h-4 text-[#8e706c] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Mã voucher ưu đãi..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={isValidatingCoupon || !!appliedCoupon}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#fff8f6] border border-[#e2beba] rounded-xl uppercase font-mono text-[#1c1917] focus:outline-none focus:border-primary disabled:opacity-60"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim() || !!appliedCoupon}
                    className="rounded-xl px-4 text-xs font-bold cursor-pointer"
                  >
                    {isValidatingCoupon ? "Đang xét..." : "Áp dụng"}
                  </Button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                    <span className="flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mã {appliedCoupon.code} (-{formatVND(appliedCoupon.discount)})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="cursor-pointer text-[10px] text-red-600 hover:underline"
                    >
                      Gỡ mã
                    </button>
                  </div>
                )}
              </div>

              {/* Bảng Chi Tiết Giá Thanh Toán */}
              <div className="pt-3 border-t border-[#e2beba]/40 space-y-2.5 text-xs text-[#5a413d]">
                <div className="flex justify-between items-center">
                  <span>Tạm tính tiền món:</span>
                  <span className="font-mono font-semibold text-[#1c1917] text-sm">
                    {formatVND(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    {fulfillmentType === "PICKUP" ? "Hình thức nhận tại quán:" : "Phí giao hàng thố nhiệt:"}
                  </span>
                  <span className="font-mono font-semibold text-[#1c1917]">
                    {isFreeShip ? (
                      <span className="text-emerald-700 font-bold">Miễn phí</span>
                    ) : (
                      formatVND(effectiveShippingFee)
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Ưu đãi ẩm thực ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-{formatVND(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#e2beba]/40 flex justify-between items-baseline">
                  <div>
                    <span className="font-headline font-bold text-[#1c1917] text-sm block">
                      Tổng thanh toán:
                    </span>
                    <span className="text-[10px] text-[#8e706c] block">
                      (Đã bao gồm VAT &amp; bảo hiểm thố nhiệt)
                    </span>
                  </div>
                  <span className="font-headline font-black text-primary text-2xl font-mono">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Nút Đặt Hàng Chính Thức */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-4 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Đang kết nối nhà bếp...</span>
                ) : paymentMethod === "VNPAY" ? (
                  <span>Tiến Hành Thanh Toán VNPAY →</span>
                ) : (
                  <span>Xác Nhận Đặt Bàn Tiệc (COD) →</span>
                )}
              </Button>

              <div className="text-[11px] text-center text-[#8e706c] space-y-1 pt-1">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cam kết bảo hiểm món ăn 100% khi nhận hàng</span>
                </p>
                <p className="text-[10px] text-[#b39591]">
                  Hotline hỗ trợ bếp trưởng: <strong className="text-primary font-mono">1900 6868</strong>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
