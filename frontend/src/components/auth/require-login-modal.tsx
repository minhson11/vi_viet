"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, UserPlus } from "lucide-react";

export function RequireLoginModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/dang-nhap");
  const [customMsg, setCustomMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthRequired = (e: Event) => {
      const customEvent = e as CustomEvent;
      const target = customEvent.detail?.redirectUrl || pathname || "/";
      setRedirectPath(target);
      if (customEvent.detail?.message) {
        setCustomMsg(customEvent.detail.message);
      } else {
        setCustomMsg(null);
      }
      setIsOpen(true);
    };

    window.addEventListener("viviet_auth_required", handleAuthRequired);
    return () => {
      window.removeEventListener("viviet_auth_required", handleAuthRequired);
    };
  }, [pathname]);

  const loginUrl = `/dang-nhap?redirect=${encodeURIComponent(redirectPath)}`;
  const registerUrl = `/dang-ky?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title=""
      size="sm"
    >
      <div className="text-center space-y-5 py-2">
        {/* Biểu tượng thương hiệu */}
        <div className="w-16 h-16 rounded-full bg-[#fff1eb] border border-[#e2beba]/60 text-primary mx-auto flex items-center justify-center shadow-xs">
          <ShoppingBag className="w-8 h-8" />
        </div>

        {/* Tiêu đề & Thông điệp ẩm thực */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-turmeric block">
            Yêu Cầu Đăng Nhập
          </span>
          <h3 className="font-headline text-xl font-bold text-[#1c1917]">
            Đăng Nhập Để Thưởng Thức Mỹ Vị
          </h3>
          <p className="text-xs text-[#5a413d] max-w-xs mx-auto leading-relaxed pt-1">
            {customMsg ||
              "Quý khách vui lòng đăng nhập tài khoản Vị Việt để chọn món vào giỏ hàng, nhận ưu đãi hội viên và được bếp thắp lửa phục vụ."}
          </p>
        </div>

        {/* Các nút điều hướng */}
        <div className="space-y-2.5 pt-2">
          <Link href={loginUrl} onClick={() => setIsOpen(false)} className="block">
            <Button
              variant="primary"
              size="lg"
              className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href={registerUrl} onClick={() => setIsOpen(false)} className="block">
            <Button
              variant="outline"
              size="md"
              className="w-full py-2.5 rounded-full text-xs font-semibold text-[#5a413d] border-[#e2beba] hover:bg-[#fff8f6] cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              <span>Chưa có tài khoản? Đăng ký</span>
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-[#8e706c] hover:text-[#1c1917] transition-colors pt-1 cursor-pointer block mx-auto"
          >
            Để sau, tôi muốn tiếp tục xem món
          </button>
        </div>
      </div>
    </Modal>
  );
}
