"use client";

import React from "react";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-[#1c1917] text-white border-t border-[#e2beba]/20 overflow-hidden">
      {/* ================= LƯỚI THÔNG TIN CHÍNH (4 KHỐI) ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Cột 1: Thông tin thương hiệu (4 Cột) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-block group">
              <img
                src="/logo.svg"
                alt="Vị Việt - Contemporary Culinary"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-white/70 leading-relaxed pr-4 font-normal">
              Vị Việt là thương hiệu ẩm thực đương đại tiên phong kết hợp mỹ vị di sản Việt Nam cùng nghệ thuật chế tác Fine-Dining và giải pháp giao món nóng hổi thố sứ chuẩn Michelin.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-[10px] font-bold text-gold uppercase tracking-wider">
                Michelin Selected 2024
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-bold text-white uppercase tracking-wider">
                Giao Nhanh 30P
              </span>
            </div>
          </div>

          {/* Cột 2: Thực đơn giao nóng (2 Cột) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-3 border-b border-gold/20 pb-2">
              Thực Đơn Giao Nóng
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/mon/pho-bo-tai-lan-gia-truyen" className="hover:text-gold transition-colors">
                  Phở bò tái lăn gia truyền
                </Link>
              </li>
              <li>
                <Link href="/mon/bun-cha-ha-noi-nuong-than-hoa" className="hover:text-gold transition-colors">
                  Bún chả Hà Nội nướng than hoa
                </Link>
              </li>
              <li>
                <Link href="/mon/com-tam-suon-bi-cha-sai-gon" className="hover:text-gold transition-colors">
                  Cơm tấm sườn bì chả Sài Gòn
                </Link>
              </li>
              <li>
                <Link href="/mon/banh-mi-thit-xa-xiu-gion-tan" className="hover:text-gold transition-colors">
                  Bánh mì thịt xá xíu giòn tan
                </Link>
              </li>
              <li>
                <Link href="/mon/tra-sen-vang-long-nhan" className="hover:text-gold transition-colors">
                  Trà sen vàng long nhãn
                </Link>
              </li>
              <li>
                <Link href="/mon/goi-cuon-tom-thit-nam-bo-1793791342464" className="hover:text-gold transition-colors">
                  Gỏi cuốn tôm thịt Nam Bộ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Trải nghiệm số & Hỗ trợ (2 Cột) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-3 border-b border-gold/20 pb-2">
              Dịch Vụ &amp; Hỗ Trợ
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="/tu-van" className="hover:text-gold transition-colors flex items-center gap-1">
                  <span>Tư vấn Khẩu vị AI</span>
                  <span className="text-[9px] bg-primary px-1.5 py-0.2 rounded-full text-white font-bold">Mới</span>
                </Link>
              </li>
              <li>
                <Link href="/gio-hang" className="hover:text-gold transition-colors">
                  Giỏ món &amp; Đặt hàng
                </Link>
              </li>
              <li>
                <Link href="/tai-khoan/don-hang" className="hover:text-gold transition-colors">
                  Theo dõi đơn giao nóng
                </Link>
              </li>
              <li>
                <Link href="/tai-khoan" className="hover:text-gold transition-colors">
                  Tài khoản thành viên
                </Link>
              </li>
              <li>
                <Link href="/#story" className="hover:text-gold transition-colors">
                  Hành trình di sản 3 miền
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hệ thống Bếp & Liên hệ (4 Cột) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-3 border-b border-gold/20 pb-2">
              Hệ Thống Bếp Trung Tâm &amp; Hotline
            </h4>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Hà Nội Atelier:</strong>
                  <span>Số 12 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Sài Gòn Atelier:</strong>
                  <span>Số 88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-white/60">Hotline Đặt Món Giao Nhanh: </span>
                  <a href="tel:19008888" className="font-bold text-white hover:text-gold">
                    1900 8888 (24/7)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-white/60">Email Concierge: </span>
                  <a href="mailto:concierge@vivietculinary.vn" className="text-white hover:text-gold font-medium">
                    concierge@vivietculinary.vn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BẢN QUYỀN & PHƯƠNG THỨC THANH TOÁN ================= */}
      <div className="border-t border-white/10 bg-black/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
          <div>
            © {new Date().getFullYear()} VỊ VIỆT CONTEMPORARY CULINARY. Bảo lưu mọi quyền. Đã đăng ký bản quyền thương hiệu ẩm thực.
          </div>

          {/* Phương thức thanh toán online */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/70">
            <span className="text-white/40 mr-1">Thanh toán bảo mật:</span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-[10px] font-bold text-white">
              VNPAY QR
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-[10px] font-bold text-white">
              VISA / MASTER
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-[10px] font-bold text-white">
              NAPAS 247
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-[10px] font-bold text-white">
              COD TIỀN MẶT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
