"use client";

import React, { useState } from "react";
import { Phone, Mail, CheckCircle2 } from "lucide-react";

export const MichelinBooking: React.FC = () => {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Tối: 18:00 - 20:30");
  const [guests, setGuests] = useState("4 Khách (Gia đình)");
  const [location, setLocation] = useState("Hà Nội Heritage Atelier");
  const [isBooked, setIsBooked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
    }, 6000);
  };

  return (
    <section id="booking" className="py-24 bg-[#1c1917] text-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Cột Trái: Tuyên ngôn & Liên hệ */}
        <div className="lg:col-span-7 text-left">
          <span className="text-xs uppercase tracking-widest font-bold text-gold block mb-2">
            Dành Riêng Bàn Tiệc Độc Bản
          </span>
          <h2 className="font-headline text-3xl sm:text-5xl font-bold leading-tight mb-4 text-white">
            Khoảnh Khắc Đẳng Cấp <br />
            <span className="italic font-normal text-gold">
              Cho Bữa Tiệc Của Bạn
            </span>
          </h2>
          <p className="text-sm text-white/70 max-w-xl leading-relaxed mb-6 font-normal">
            Không gian Vị Việt giới hạn số lượng khách mỗi tối nhằm đảm bảo từng
            đĩa món ăn và cung cách phục vụ đạt tiêu chuẩn hoàn mỹ nhất.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gold font-bold">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold" />
              <span>Hotline: +84 (0) 24 3828 9999</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              <span>concierge@vivietculinary.vn</span>
            </div>
          </div>
        </div>

        {/* Cột Phải: Biểu mẫu đặt chỗ */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-gold/30 shadow-2xl">
          <h3 className="font-headline text-xl font-bold text-white mb-4">
            Giữ Chỗ Trực Tuyến Nhanh
          </h3>

          {isBooked ? (
            <div className="p-6 bg-secondary/30 border border-secondary rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-base text-white">
                Đã tiếp nhận yêu cầu đặt bàn!
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Đội ngũ Concierge của Vị Việt sẽ gọi điện xác nhận trong vòng 15
                phút. Xin chân thành cảm ơn Quý khách!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">
                    Ngày dùng tiệc
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">
                    Ca tiệc
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#1c1917] border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="Tối: 18:00 - 20:30">Tối: 18:00 - 20:30</option>
                    <option value="Trưa: 11:30 - 14:00">Trưa: 11:30 - 14:00</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">
                    Số lượng khách
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-[#1c1917] border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="2 Khách (Bàn đôi)">2 Khách (Bàn đôi)</option>
                    <option value="4 Khách (Gia đình)">4 Khách (Gia đình)</option>
                    <option value="6 - 10 Khách (VIP)">6 - 10 Khách (VIP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">
                    Không gian Atelier
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#1c1917] border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="Hà Nội Heritage Atelier">
                      Hà Nội Heritage Atelier
                    </option>
                    <option value="Sài Gòn Modern Sensory">
                      Sài Gòn Modern Sensory
                    </option>
                    <option value="Đà Nẵng Pavilion">Đà Nẵng Pavilion</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-2"
              >
                Xác Nhận Giữ Bàn
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

