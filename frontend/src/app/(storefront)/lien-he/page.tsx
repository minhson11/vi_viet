"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    requestType: "DAT_BAN",
    branch: "HANOI",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.fullName.trim()) {
      setErrorMsg("Vui lòng nhập Họ và tên của Quý khách.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 9) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ để chúng tôi liên hệ.");
      return;
    }

    setIsSubmitting(true);

    // Mô phỏng gửi liên hệ thành công (hoàn tất tức thì)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        requestType: "DAT_BAN",
        branch: "HANOI",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] text-ink pb-20">
      {/* 1. HERO HEADER */}
      <section className="bg-gradient-to-b from-[#fdeae3] to-[#fff8f6] py-14 sm:py-20 border-b border-[#e2beba]/40 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-gold/40 text-brand-red text-xs font-bold uppercase tracking-widest shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Trung Tâm Dịch Vụ Khách Hàng &amp; Sự Kiện</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-5xl font-extrabold text-ink tracking-tight">
            Liên Hệ Vị Việt
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-ink-muted max-w-xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn lòng lắng nghe, hỗ trợ đặt bàn tiệc riêng tư, phục vụ thực đơn giao nóng 
            hoặc tiếp nhận những ý kiến đóng góp quý báu từ Quý khách.
          </p>
        </div>
      </section>

      {/* 2. NỘI DUNG CHÍNH: THÔNG TIN CHI NHÁNH & FORM GỬI LIÊN HỆ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CỘT TRÁI (5 Cột): Hệ thống Bếp & Thông tin liên lạc */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                Hệ Thống Trực Thuộc
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
                Atelier Ẩm Thực &amp; Bếp Trung Tâm
              </h2>
            </div>

            {/* Chi nhánh Hà Nội */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-brand-red font-bold text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Hà Nội Atelier · Hoàn Kiếm</span>
              </div>
              <p className="text-xs text-ink-muted">
                Số 12 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội
              </p>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span>07:00 – 22:30 (Cả tuần)</span>
                </span>
                <a
                  href="tel:19008888"
                  className="font-bold text-brand-red hover:underline"
                >
                  Hotline Nhánh 1
                </a>
              </div>
            </div>

            {/* Chi nhánh Sài Gòn */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-brand-red font-bold text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Sài Gòn Atelier · Quận 1</span>
              </div>
              <p className="text-xs text-ink-muted">
                Số 88 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
              </p>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span>07:00 – 23:00 (Cả tuần)</span>
                </span>
                <a
                  href="tel:19008888"
                  className="font-bold text-brand-red hover:underline"
                >
                  Hotline Nhánh 2
                </a>
              </div>
            </div>

            {/* Tổng Đài & Kênh Tiếp Nhận */}
            <div className="bg-[#fff1eb] border border-gold/40 rounded-2xl p-6 space-y-3 text-xs text-ink">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-ink-muted font-medium">Tổng đài tiếp nhận 24/7</p>
                  <a href="tel:19008888" className="text-base font-extrabold text-brand-red hover:underline">
                    1900 8888
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-gold/20 flex flex-col gap-1.5 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Đặt tiệc &amp; Sự kiện: catering@viviet.vn</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-red shrink-0" />
                  <span>Chăm sóc khách hàng: cskh@viviet.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7 Cột): Form gửi lời nhắn / Đặt bàn trực tiếp */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-red">
              Gửi Thông Điệp Trực Tuyến
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink mt-1 mb-2">
              Để Lại Thông Tin Đặt Bàn Hoặc Lời Nhắn
            </h2>
            <p className="text-xs text-ink-muted mb-6">
              Đội ngũ chăm sóc khách hàng của Vị Việt sẽ liên hệ lại qua điện thoại trong vòng 15 phút.
            </p>

            {isSubmitted ? (
              <div className="p-8 bg-[#fdf2f0] border border-brand-red/30 rounded-2xl text-center space-y-3 animate-in fade-in duration-300">
                <div className="w-14 h-14 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Gửi Thông Tin Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                  Cảm ơn Quý khách. Đội ngũ tiếp đón của Vị Việt đã nhận được yêu cầu và sẽ gọi điện xác nhận trong ít phút.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="px-5 py-2 rounded-full bg-brand-red text-white text-xs font-semibold hover:bg-brand-red-hover transition-colors cursor-pointer"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">
                      Họ và tên Quý khách <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="0912 345 678"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                  </div>

                  {/* Loại yêu cầu */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-ink">
                      Nhu cầu hỗ trợ
                    </label>
                    <select
                      value={formData.requestType}
                      onChange={(e) =>
                        setFormData({ ...formData, requestType: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-xs text-ink focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red cursor-pointer"
                    >
                      <option value="DAT_BAN">Đặt bàn tiệc gia đình / VIP</option>
                      <option value="CATERING">Đặt tiệc văn phòng / Công ty</option>
                      <option value="MON_GIAO_NONG">Tư vấn thực đơn giao nóng</option>
                      <option value="HOP_TAC">Hợp tác kinh doanh / Đối tác</option>
                      <option value="GOP_Y">Góp ý chất lượng phục vụ</option>
                    </select>
                  </div>
                </div>

                {/* Chi nhánh mong muốn */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">
                    Chi nhánh phục vụ ưu tiên
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        formData.branch === "HANOI"
                          ? "bg-brand-red/10 border-brand-red text-brand-red"
                          : "bg-white border-border text-ink hover:bg-[#fff1eb]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch"
                        value="HANOI"
                        checked={formData.branch === "HANOI"}
                        onChange={() => setFormData({ ...formData, branch: "HANOI" })}
                        className="sr-only"
                      />
                      <span>Hà Nội Atelier (Tràng Tiền)</span>
                    </label>

                    <label
                      className={`flex items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        formData.branch === "SAIGON"
                          ? "bg-brand-red/10 border-brand-red text-brand-red"
                          : "bg-white border-border text-ink hover:bg-[#fff1eb]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch"
                        value="SAIGON"
                        checked={formData.branch === "SAIGON"}
                        onChange={() => setFormData({ ...formData, branch: "SAIGON" })}
                        className="sr-only"
                      />
                      <span>Sài Gòn Atelier (Nguyễn Huệ)</span>
                    </label>
                  </div>
                </div>

                {/* Nội dung lời nhắn */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink">
                    Nội dung yêu cầu / Số lượng khách / Thời gian
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Ví dụ: Đặt bàn 6 người lúc 19:00 tối thứ Bảy, hoặc cần giao 20 suất cơm niêu lúc 11:30 trưa mai..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-brand-red to-brand-red-hover hover:from-brand-red-hover hover:to-brand-red text-cream font-bold text-xs uppercase tracking-wider shadow-md shadow-brand-red/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Đang gửi thông tin..." : "Gửi Thông Tin Ngay"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
