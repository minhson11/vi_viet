"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Waves,
  Trees,
  ArrowRight,
  Check,
  Compass,
  RotateCcw,
} from "lucide-react";
import {
  CategoryStoryShowcase,
  SatelliteDish,
  FlavorProfile,
} from "../types";
import { storyCategoriesService } from "../services/story-categories.service";

// Helper render an toàn cho tầng hương vị (hỗ trợ cả string lẫn object { note, title })
const renderFlavorText = (val: unknown, fallback: string = ""): string => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as { note?: string; title?: string };
    return obj.note || obj.title || fallback;
  }
  return String(val);
};

const renderFlavorTitle = (val: unknown, fallback: string): string => {
  if (typeof val === "object" && val !== null) {
    const obj = val as { title?: string };
    if (obj.title) return obj.title;
  }
  return fallback;
};

interface HeritageStoryDishesProps {
  onAddToCart?: (name: string, price: number) => void;
}

// Cấu hình vị trí và animation riêng biệt, cân đối cho từng danh mục
interface CategoryLayoutConfig {
  name: string;
  orbitClass: string;
  badgeTopPos: string;
  badgeBottomPos?: string;
  satellites: Array<{ pos: string; anim: string }>;
  hintText: string;
}

const getCategoryLayoutConfig = (categoryIndex: number): CategoryLayoutConfig => {
  const typeIndex = categoryIndex % 3;

  if (typeIndex === 0) {
    // ================= DANH MỤC 1: MÓN NƯỚC DI SẢN =================
    // Bố cục: 5 đĩa con bay lơ lửng xung quanh đĩa lớn (Ngũ Hành Thủy Lửa)
    return {
      name: "omni-wave-5",
      orbitClass: "border-primary/20",
      badgeTopPos: "top-2 left-6 sm:top-3 sm:left-8",
      badgeBottomPos: "-bottom-3 left-6 sm:left-10",
      satellites: [
        {
          // Đĩa 1: Góc Trên Bên Phải (~1h30)
          pos: "-top-3 -right-2 sm:-top-5 sm:-right-4 lg:-top-6 lg:-right-6",
          anim: "cat1-float-1",
        },
        {
          // Đĩa 2: Góc Dưới Phía Phải (~4h30)
          pos: "-bottom-5 right-6 sm:-bottom-7 sm:right-10 lg:-bottom-8 lg:right-12",
          anim: "cat1-float-2",
        },
        {
          // Đĩa 3: Góc Dưới Phía Trái (~7h00)
          pos: "-bottom-5 -left-2 sm:-bottom-7 sm:-left-4 lg:-bottom-8 lg:-left-6",
          anim: "cat1-float-3",
        },
        {
          // Đĩa 4: Ngang Hông Bên Trái (~9h30)
          pos: "top-1/3 -left-5 sm:top-1/3 sm:-left-8 lg:top-1/3 lg:-left-10",
          anim: "cat1-float-4",
        },
        {
          // Đĩa 5: Góc Trên Lệch Trái (~11h30)
          pos: "-top-6 left-1/4 sm:-top-8 sm:left-1/4 lg:-top-9 lg:left-1/4",
          anim: "cat1-float-5",
        },
      ],
      hintText: "Hương vị vây quanh: Bấm vào các đĩa con để đổi món trên thố lớn",
    };
  } else if (typeIndex === 1) {
    // ================= DANH MỤC 2: CƠM & MÓN CHÍNH DI SẢN =================
    // Bố cục: 5 đĩa con bay lơ lửng xung quanh đĩa lớn (Ngũ Tinh Gió Biển xoay đối xứng)
    return {
      name: "omni-glide-5",
      orbitClass: "border-secondary/25",
      badgeTopPos: "top-2 right-6 sm:top-3 sm:right-8",
      badgeBottomPos: "-bottom-3 right-6 sm:right-10",
      satellites: [
        {
          // Đĩa 1: Góc Trên Bên Trái (~10h30)
          pos: "-top-3 -left-2 sm:-top-5 sm:-left-4 lg:-top-6 lg:-left-6",
          anim: "cat2-float-1",
        },
        {
          // Đĩa 2: Góc Trên Lệch Phải (~1h00)
          pos: "-top-6 right-1/4 sm:-top-8 sm:right-1/4 lg:-top-9 lg:right-1/4",
          anim: "cat2-float-2",
        },
        {
          // Đĩa 3: Ngang Hông Bên Phải (~3h30)
          pos: "top-1/2 -right-5 sm:top-1/2 sm:-right-8 lg:top-1/2 lg:-right-10 -translate-y-1/2",
          anim: "cat2-float-3",
        },
        {
          // Đĩa 4: Góc Dưới Phía Phải (~5h30)
          pos: "-bottom-5 -right-2 sm:-bottom-7 sm:-right-4 lg:-bottom-8 lg:-right-6",
          anim: "cat2-float-4",
        },
        {
          // Đĩa 5: Góc Dưới Phía Trái (~7h30)
          pos: "-bottom-5 left-6 sm:-bottom-7 sm:left-10 lg:-bottom-8 lg:left-12",
          anim: "cat2-float-5",
        },
      ],
      hintText: "Mỹ vị bốn bề: Khám phá từng phong vị biển sâu & đồng bằng",
    };
  } else {
    // ================= DANH MỤC 3: BÁNH MÌ & THỨC QUÀ ĂN NHẸ =================
    // Bố cục: 5 đĩa con bay lơ lửng xung quanh đĩa lớn (Ngũ Giác Hoàng Kim Constellation)
    return {
      name: "omni-tristar-5",
      orbitClass: "border-gold/30",
      badgeTopPos: "top-3 right-4 sm:top-4 sm:right-6",
      badgeBottomPos: "-bottom-3 left-1/2 -translate-x-1/2",
      satellites: [
        {
          // Đĩa 1: Đỉnh Cao Nhất (~12h00)
          pos: "-top-7 left-1/2 -translate-x-1/2 sm:-top-10 lg:-top-12",
          anim: "cat3-float-1",
        },
        {
          // Đĩa 2: Sườn Phải Phía Trên (~2h30)
          pos: "top-1/4 -right-4 sm:top-1/4 sm:-right-7 lg:top-1/4 lg:-right-9",
          anim: "cat3-float-2",
        },
        {
          // Đĩa 3: Góc Dưới Phía Phải (~5h00)
          pos: "bottom-1 -right-3 sm:bottom-3 sm:-right-6 lg:bottom-4 lg:-right-8",
          anim: "cat3-float-3",
        },
        {
          // Đĩa 4: Góc Dưới Phía Trái (~7h00)
          pos: "bottom-1 -left-3 sm:bottom-3 sm:-left-6 lg:bottom-4 lg:-left-8",
          anim: "cat3-float-4",
        },
        {
          // Đĩa 5: Sườn Trái Phía Trên (~9h30)
          pos: "top-1/4 -left-4 sm:top-1/4 sm:-left-7 lg:top-1/4 lg:-left-9",
          anim: "cat3-float-5",
        },
      ],
      hintText: "Hương hoa tỏa ngát: Bấm vào đĩa con để thưởng thức đặc sản ba miền",
    };
  }
};

export const HeritageStoryDishes: React.FC<HeritageStoryDishesProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<CategoryStoryShowcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lưu món ăn đang được chọn hiển thị trọng tâm cho mỗi danh mục (mặc định là mainDish)
  const [activeDishMap, setActiveDishMap] = useState<
    Record<string, SatelliteDish | CategoryStoryShowcase["mainDish"]>
  >({});

  // Nạp danh mục trực tiếp 100% từ backend API TiDB Cloud
  useEffect(() => {
    let isMounted = true;
    storyCategoriesService
      .fetchStoryCategories()
      .then((liveData) => {
        if (isMounted) {
          setCategories(Array.isArray(liveData) ? liveData : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories([]);
          setIsLoading(false);
        }
      });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CategoryStoryShowcase[]>;
      if (customEvent.detail) {
        setCategories(customEvent.detail);
      }
    };

    window.addEventListener("viviet_story_categories_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener(
        "viviet_story_categories_updated",
        handleUpdate
      );
    };
  }, []);

  // Thiết lập IntersectionObserver cho các hiệu ứng physics khi cuộn
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.18 }
    );

    const blocks = containerRef.current?.querySelectorAll(".story-block");
    blocks?.forEach((block) => observer.observe(block));

    return () => observer.disconnect();
  }, [categories]);

  // Chọn món vệ tinh để hiển thị lên đĩa lớn (bấm lại món đang chọn sẽ quay về món chính)
  const handleSelectDish = (
    categoryId: string,
    dish: SatelliteDish | CategoryStoryShowcase["mainDish"],
    mainDish: CategoryStoryShowcase["mainDish"]
  ) => {
    setActiveDishMap((prev) => {
      const current = prev[categoryId] || mainDish;
      if (current.id === dish.id) {
        // Toggle quay về món chính
        return { ...prev, [categoryId]: mainDish };
      }
      return { ...prev, [categoryId]: dish };
    });
  };

  const activeCategories = categories.filter((c) => c.isActive !== false);

  // Nếu không có câu chuyện nào trong cơ sở dữ liệu thật, không hiển thị section này (tránh hiện dữ liệu giả)
  if (isLoading || activeCategories.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="story"
      className="relative w-full bg-[#fff8f6] text-[#1c1917] overflow-hidden py-20 sm:py-28"
    >
      {/* Tiêu đề dẫn lối câu chuyện ẩm thực */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16 sm:mb-20">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#fdeae3] text-primary text-xs font-bold uppercase tracking-widest border border-[#e2beba] mb-3">
          Tuyển Tập Danh Mục Di Sản · Vị Việt Trứ Danh
        </span>
        <h2 className="font-headline text-3xl sm:text-5xl font-bold text-[#1c1917] leading-tight">
          Hành Trình Thưởng Thức{" "}
          <span className="italic text-primary font-normal">
            Theo Từng Danh Mục
          </span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#5a413d] max-w-2xl mx-auto">
          Mỗi danh mục là một tinh hoa ẩm thực ba miền độc bản. Chiêm ngưỡng các
          món ăn trứ danh trong từng chương ẩm thực và khám phá trọn vẹn thực đơn
          nấu mới mỗi ngày.
        </p>
        <div className="w-20 h-1 bg-gold mx-auto mt-5 rounded-full" />
      </div>

      {/* Lặp qua từng khối Danh Mục đặc sắc */}
      <div className="space-y-16 sm:space-y-24">
        {activeCategories.map((cat, index) => {
          const isEven = index % 2 === 1;
          const currentDish = activeDishMap[cat.id] || cat.mainDish;
          const currentFlavors: FlavorProfile =
            ("flavors" in currentDish && currentDish.flavors) || cat.flavors;

          // Cấu hình layout và animation vệ tinh riêng biệt, cân đối cho từng danh mục
          const layoutConfig = getCategoryLayoutConfig(index);

          // Theme styling helper
          const isPrimary = cat.themeColor === "primary";
          const isSecondary = cat.themeColor === "secondary";
          const themeTextColor = isPrimary
            ? "text-primary"
            : isSecondary
            ? "text-secondary"
            : "text-[#b45309]";
          const themeBadgeBg = isPrimary
            ? "bg-[#fdeae3] text-primary border-primary/20"
            : isSecondary
            ? "bg-[#cbebca]/50 text-secondary border-secondary/30"
            : "bg-[#ffdea7]/60 text-[#854d0e] border-gold/30";
          const haloGradient = isPrimary
            ? "from-amber-400/25 via-primary/20 to-amber-300/25"
            : isSecondary
            ? "from-emerald-400/25 via-teal-300/20 to-emerald-200/25"
            : "from-amber-400/30 via-orange-300/25 to-yellow-300/30";
          const platterBg = isPrimary
            ? "from-[#fdeae3] to-white border-gold shadow-[0_20px_50px_rgba(183,46,36,0.15)]"
            : isSecondary
            ? "from-[#cbebca]/40 to-white border-secondary/60 shadow-[0_20px_50px_rgba(74,101,75,0.18)]"
            : "from-[#ffdea7]/50 to-white border-gold shadow-[0_20px_50px_rgba(217,119,6,0.2)]";

          // Physics animation classes của khối lớn
          const dishAnimClass =
            cat.animationType === "roll"
              ? "dish-anim-roll"
              : cat.animationType === "3dflip"
              ? "dish-anim-3dflip"
              : "dish-anim-spiral";

          const textAnimClass =
            cat.animationType === "roll"
              ? "dish-anim-reveal-up"
              : cat.animationType === "3dflip"
              ? "dish-anim-reveal-left"
              : "dish-anim-reveal-bloom";

          // Icon tương ứng với theme
          const CategoryIcon = isPrimary
            ? Sparkles
            : isSecondary
            ? Waves
            : Trees;

          const isViewingSatellite = currentDish.id !== cat.mainDish.id;

          return (
            <section
              key={cat.id}
              id={`category-story-${index + 1}`}
              className={`story-block relative min-h-[80vh] flex items-center py-12 sm:py-16 ${
                index < activeCategories.length - 1
                  ? "border-b border-[#e2beba]/40"
                  : ""
              }`}
            >
              <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* ================= CỘT ẢNH ĐĨA TRUNG TÂM & VỆ TINH ẢNH NHỎ ================= */}
                <div
                  className={`lg:col-span-6 flex flex-col items-center justify-center relative ${
                    isEven ? "order-1 lg:order-2" : "order-1"
                  } ${dishAnimClass}`}
                >
                  <div className="relative p-6 sm:p-8 lg:p-8 xl:p-12">
                    {/* Đường viền quỹ đạo thiên văn học mảnh dẻ bằng vàng kim */}
                    <div
                      className={`absolute -inset-4 sm:-inset-6 lg:-inset-6 xl:-inset-10 rounded-full border border-dashed ${layoutConfig.orbitClass} pointer-events-none -z-5 opacity-70`}
                    />

                    {/* Steam Line nhiệt độ nghi ngút khói (hiển thị cho Món Nước) */}
                    {isPrimary && (
                      <div className="absolute -top-6 inset-x-0 flex justify-center gap-4 pointer-events-none z-20">
                        <span className="w-1.5 h-10 rounded-full bg-primary/30 steam-line" />
                        <span
                          className="w-2 h-14 rounded-full bg-gold/40 steam-line"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <span
                          className="w-1.5 h-8 rounded-full bg-primary/30 steam-line"
                          style={{ animationDelay: "1.4s" }}
                        />
                      </div>
                    )}

                    {/* Glowing Halo ánh hào quang nhiệt ấm */}
                    <div
                      className={`absolute -inset-6 rounded-full bg-gradient-to-r ${haloGradient} blur-2xl glow-halo -z-10`}
                    />

                    {/* ĐĨA LỚN TRUNG TÂM (Central Main Platter) */}
                    <div
                      className={`relative w-64 sm:w-80 lg:w-[350px] xl:w-[410px] aspect-square rounded-full p-3 sm:p-4 bg-gradient-to-br ${platterBg} border-4 transition-all duration-500`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-gold/50 relative shadow-inner group">
                        {(() => {
                          const imgSrc = typeof currentDish.image === "string" ? currentDish.image : (currentDish.image as any)?.asset_path || (currentDish.image as any)?.image_url;
                          return imgSrc ? (
                            <img
                              alt={currentDish.name}
                              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                              src={imgSrc}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#2a1e1b] flex flex-col items-center justify-center text-gold/80 p-6 text-center">
                              <span className="text-4xl mb-2">🍲</span>
                              <span className="text-xs font-bold uppercase tracking-wider">{currentDish.name}</span>
                            </div>
                          );
                        })()}

                        {/* Overlay tên món đang xem */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                          <span className="text-white text-xs font-bold tracking-wider uppercase bg-black/60 px-3.5 py-1.5 rounded-full border border-gold/40 backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            Món tiêu biểu: {currentDish.name}
                          </span>
                        </div>
                      </div>

                      {/* Tag huy hiệu góc trên (Vị trí tránh va chạm đĩa con) */}
                      <div
                        className={`absolute ${layoutConfig.badgeTopPos} bg-primary text-white px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border border-gold/40 shadow-md whitespace-nowrap z-10`}
                      >
                        {cat.badgeTop || "Món Nấu Tươi Mỗi Ngày"}
                      </div>

                      {/* Tag huy hiệu góc dưới (nếu bố cục cho phép) */}
                      {layoutConfig.badgeBottomPos && (
                        <div
                          className={`absolute ${layoutConfig.badgeBottomPos} bg-white text-primary px-4 sm:px-5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase border border-gold shadow-lg whitespace-nowrap z-10`}
                        >
                          {cat.badgeBottom || "⚡ Nóng Hổi Giao Trong 30 Phút"}
                        </div>
                      )}
                    </div>

                    {/* ================= CÁC ĐĨA CON VỆ TINH BAY LƠ LỬNG BAO QUANH 360° ================= */}
                    {cat.satelliteDishes?.map((satDish, satIdx) => {
                      const isSelected = currentDish.id === satDish.id;
                      const satConfig =
                        layoutConfig.satellites[
                          satIdx % layoutConfig.satellites.length
                        ];

                      return (
                        <div
                          key={satDish.id}
                          onClick={() =>
                            handleSelectDish(cat.id, satDish, cat.mainDish)
                          }
                          title={`Xem món: ${satDish.name}`}
                          className={`absolute z-20 w-14 h-14 sm:w-16 sm:h-16 lg:w-[76px] lg:h-[76px] rounded-full p-1 bg-white cursor-pointer transition-all duration-300 hover:scale-115 shadow-md group/sat ${satConfig.pos} ${satConfig.anim} ${
                            isSelected
                              ? "border-2 border-primary ring-3 ring-primary ring-offset-2 scale-110 shadow-[0_0_20px_rgba(183,46,36,0.35)]"
                              : "border-2 border-gold/70 hover:border-gold hover:shadow-lg"
                          }`}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden relative">
                            {(() => {
                              const imgSrc = typeof satDish.image === "string" ? satDish.image : (satDish.image as any)?.asset_path || (satDish.image as any)?.image_url;
                              return imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={satDish.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/sat:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-cream flex items-center justify-center text-xs">
                                  🍲
                                </div>
                              );
                            })()}
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/25 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>

                          {/* Huy hiệu nhỏ góc (ví dụ: Cố Đô, Hà Thành, Đất Cảng) */}
                          {satDish.badge && (
                            <span className="absolute -top-1 -right-1 bg-gold text-[#1c1917] text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border border-white shadow-xs z-10">
                              {satDish.badge}
                            </span>
                          )}

                          {/* Nhãn tên món mini trang trọng ngay dưới đĩa con */}
                          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 text-[9px] sm:text-[10px] font-bold text-ink px-2 py-0.5 rounded-full border border-gold/40 shadow-xs max-w-[85px] sm:max-w-[95px] truncate text-center pointer-events-none z-10">
                            {satDish.name}
                          </div>
                        </div>
                      );
                    })}

                    {/* Gợi ý tương tác & Nút quay lại món chủ đạo ban đầu */}
                    <div className="mt-9 sm:mt-12 text-center flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8e706c] bg-white/80 px-3.5 py-1 rounded-full border border-[#e2beba]/50 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-gold" />
                        {layoutConfig.hintText}
                      </span>

                      {/* Nút quay lại món chủ đạo nếu người dùng đang xem đĩa con */}
                      {isViewingSatellite && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectDish(cat.id, cat.mainDish, cat.mainDish)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover underline underline-offset-2 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            Quay lại món chủ đạo: {cat.mainDish.name}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ================= CỘT THÔNG TIN DANH MỤC & NỐT HƯƠNG VỊ ================= */}
                <div
                  className={`lg:col-span-6 flex flex-col gap-6 text-left ${
                    isEven ? "order-2 lg:order-1" : "order-2"
                  } ${textAnimClass}`}
                >
                  <div>
                    <span
                      className={`inline-block px-3.5 py-1 rounded-full ${themeBadgeBg} text-[11px] font-bold uppercase tracking-wider mb-2.5`}
                    >
                      {cat.badgeTag || `Danh Mục Di Sản · ${cat.categoryName}`}
                    </span>
                    <h3 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1c1917] leading-tight">
                      {cat.headlineTitle} <br />
                      <span className={`italic font-normal ${themeTextColor}`}>
                        {cat.headlineHighlight}
                      </span>
                    </h3>
                    <div
                      className={`w-16 h-1 mt-3 rounded-full ${
                        isPrimary
                          ? "bg-gold"
                          : isSecondary
                          ? "bg-secondary"
                          : "bg-gold"
                      }`}
                    />
                  </div>

                  <p className="text-sm sm:text-base text-[#5a413d] leading-relaxed font-normal">
                    {cat.description}
                  </p>

                  {/* 3 Tầng Cấu Trúc Hương Vị (Phản ánh theo món đang xem) */}
                  <div className="bg-white rounded-2xl p-5 border border-[#e2beba]/60 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs font-bold uppercase tracking-widest ${themeTextColor} flex items-center gap-1.5`}
                      >
                        <CategoryIcon className="w-4 h-4 text-gold" />
                        <span>Cấu Trúc 3 Tầng Hương Vị</span>
                      </p>
                      <span className="text-[11px] text-[#8e706c] font-medium">
                        Món đang xem:{" "}
                        <strong className="text-primary font-bold">
                          {currentDish.name}
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 rounded-xl bg-[#fff8f6] border border-[#e2beba]/50">
                        <span className="text-[10px] uppercase font-bold text-gold block">
                          {renderFlavorTitle(currentFlavors?.top, "Hương Đầu (Top)")}
                        </span>
                        <strong className="text-xs font-bold text-[#1c1917] mt-1 block">
                          {renderFlavorText(currentFlavors?.top, "Hương thơm thanh tao dịu nhẹ")}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#fff8f6] border border-[#e2beba]/50">
                        <span
                          className={`text-[10px] uppercase font-bold ${themeTextColor} block`}
                        >
                          {renderFlavorTitle(currentFlavors?.heart, "Hương Giữa (Heart)")}
                        </span>
                        <strong
                          className={`text-xs font-bold ${themeTextColor} mt-1 block`}
                        >
                          {renderFlavorText(currentFlavors?.heart, "Vị ngọt sâu lắng ninh chậm")}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#fff8f6] border border-[#e2beba]/50">
                        <span className="text-[10px] uppercase font-bold text-[#5a413d] block">
                          {renderFlavorTitle(currentFlavors?.base, "Hậu Vị (Base)")}
                        </span>
                        <strong className="text-xs font-bold text-[#1c1917] mt-1 block">
                          {renderFlavorText(currentFlavors?.base, "Hậu vị đậm đà ấm áp lưu luyến")}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* ================= KHU VỰC KHÁM PHÁ DANH MỤC ================= */}
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-start xl:items-center justify-between gap-4 p-5 sm:p-6 bg-white/95 backdrop-blur-xs rounded-2xl border border-[#e2beba]/70 shadow-sm relative z-10 w-full hover:border-gold/50 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-0 xl:pr-3">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Bộ Sưu Tập Thực Đơn · {cat.categoryName}
                        </span>
                      </div>
                      <p className="text-xs text-[#5a413d] font-normal leading-relaxed">
                        Khám phá trọn vẹn các thức quà tinh hoa trong danh mục{" "}
                        <strong className="text-ink font-semibold">{cat.categoryName}</strong> được nấu tươi nóng
                        hổi mỗi ngày.
                      </p>
                    </div>

                    {/* NÚT DUY NHẤT: KHÁM PHÁ DANH MỤC */}
                    <Link
                      href={`/thuc-don?category=${
                        cat.categorySlug || cat.categoryId
                      }`}
                      className="w-full sm:w-auto lg:w-full xl:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-white border border-gold/40 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all group shrink-0 whitespace-nowrap"
                    >
                      <span>Khám Phá Danh Mục</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-gold shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
