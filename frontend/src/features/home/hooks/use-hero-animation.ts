"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface HeroAnimationRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  eyebrowRef: React.RefObject<HTMLDivElement | null>;
  titleLine1Ref: React.RefObject<HTMLDivElement | null>;
  titleLine2Ref: React.RefObject<HTMLDivElement | null>;
  subTitleRef: React.RefObject<HTMLParagraphElement | null>;
  descRef: React.RefObject<HTMLParagraphElement | null>;
  ctaGroupRef: React.RefObject<HTMLDivElement | null>;
  metricsRef: React.RefObject<HTMLDivElement | null>;
  visualContainerRef: React.RefObject<HTMLDivElement | null>;
  mainImageRef: React.RefObject<HTMLDivElement | null>;
  bgTypoRef: React.RefObject<HTMLDivElement | null>;
  foregroundBadgesRef: React.RefObject<HTMLDivElement | null>;
}

export function useHeroAnimation(): HeroAnimationRefs {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const titleLine1Ref = useRef<HTMLDivElement | null>(null);
  const titleLine2Ref = useRef<HTMLDivElement | null>(null);
  const subTitleRef = useRef<HTMLParagraphElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const ctaGroupRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const visualContainerRef = useRef<HTMLDivElement | null>(null);
  const mainImageRef = useRef<HTMLDivElement | null>(null);
  const bgTypoRef = useRef<HTMLDivElement | null>(null);
  const foregroundBadgesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Đăng ký plugin GSAP nếu có trên client
    gsap.registerPlugin(ScrollTrigger);

    // 1. Kiểm tra Reduced Motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Nếu người dùng chọn reduced motion: hiển thị trực tiếp tất cả thành phần không hiệu ứng
    if (prefersReducedMotion) {
      const allElements = [
        eyebrowRef.current,
        titleLine1Ref.current,
        titleLine2Ref.current,
        subTitleRef.current,
        descRef.current,
        ctaGroupRef.current,
        metricsRef.current,
        visualContainerRef.current,
        mainImageRef.current,
        bgTypoRef.current,
        foregroundBadgesRef.current,
      ];
      allElements.forEach((el) => {
        if (el) {
          gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, clearProps: "all" });
        }
      });
      return;
    }

    // 2. Thiết lập trạng thái ban đầu an toàn (không giật nháy, không khóa giao diện)
    const ctx = gsap.context(() => {
      // Setup initial styles
      if (eyebrowRef.current) gsap.set(eyebrowRef.current, { opacity: 0, y: 16 });
      if (titleLine1Ref.current) gsap.set(titleLine1Ref.current, { yPercent: 110, opacity: 0 });
      if (titleLine2Ref.current) gsap.set(titleLine2Ref.current, { yPercent: 110, opacity: 0 });
      if (subTitleRef.current) gsap.set(subTitleRef.current, { opacity: 0, y: 12 });
      if (descRef.current) gsap.set(descRef.current, { opacity: 0, y: 12 });
      if (ctaGroupRef.current) gsap.set(ctaGroupRef.current, { opacity: 0, y: 12 });
      if (metricsRef.current) gsap.set(metricsRef.current, { opacity: 0, y: 16 });
      if (bgTypoRef.current) gsap.set(bgTypoRef.current, { opacity: 0, scale: 0.96 });
      if (mainImageRef.current) {
        gsap.set(mainImageRef.current, {
          opacity: 0,
          scale: 0.92,
          y: 36,
          rotation: 5,
        });
      }
      if (foregroundBadgesRef.current) {
        gsap.set(foregroundBadgesRef.current, { opacity: 0, scale: 0.9, y: 14 });
      }

      // 3. Xây dựng Intro Master Timeline (Thời lượng ~1.1s - 1.3s mượt mà)
      const playIntroTimeline = () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          delay: 0.05,
        });

        // Giai đoạn 2: Eyebrow xuất hiện
        if (eyebrowRef.current) {
          tl.to(
            eyebrowRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out",
            },
            0.05
          );
        }

        // Giai đoạn 3: Tiêu đề split-line reveal (từng dòng trượt lên mượt, offset 100ms)
        if (titleLine1Ref.current) {
          tl.to(
            titleLine1Ref.current,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
            },
            0.12
          );
        }
        if (titleLine2Ref.current) {
          tl.to(
            titleLine2Ref.current,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.65,
              ease: "power3.out",
            },
            0.22
          );
        }

        // Giai đoạn 4: Hình ảnh chính có sức nặng ẩm thực, xoay nhẹ về 0
        if (mainImageRef.current) {
          tl.to(
            mainImageRef.current,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              rotation: 0,
              duration: 0.85,
              ease: "power2.out",
            },
            0.2
          );
        }

        // Giai đoạn 5: Background Typography Watermark & Lớp trang trí con triện
        if (bgTypoRef.current) {
          tl.to(
            bgTypoRef.current,
            {
              opacity: 1,
              scale: 1,
              duration: 0.9,
              ease: "power2.out",
            },
            0.3
          );
        }
        if (foregroundBadgesRef.current) {
          tl.to(
            foregroundBadgesRef.current,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.5,
              ease: "back.out(1.4)",
            },
            0.45
          );
        }

        // Giai đoạn 6: Subtitle, Mô tả, CTA Group và Metrics
        if (subTitleRef.current) {
          tl.to(
            subTitleRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
            },
            0.42
          );
        }
        if (descRef.current) {
          tl.to(
            descRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
            },
            0.48
          );
        }
        if (ctaGroupRef.current) {
          tl.to(
            ctaGroupRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              clearProps: "transform",
            },
            0.54
          );
        }
        if (metricsRef.current) {
          tl.to(
            metricsRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
            },
            0.62
          );
        }
      };

      // Kiểm tra sự hiện diện của màn rèm Cinematic Intro
      const introElement = document.getElementById("cinematic-intro");
      if (introElement && !introElement.classList.contains("dismissed")) {
        let hasTriggered = false;
        const onIntroDismiss = () => {
          if (!hasTriggered) {
            hasTriggered = true;
            window.removeEventListener("viviet_intro_dismissed", onIntroDismiss);
            playIntroTimeline();
          }
        };
        window.addEventListener("viviet_intro_dismissed", onIntroDismiss);
        // Fallback sau tối đa 2s nếu sự kiện không đến
        setTimeout(onIntroDismiss, 2000);
      } else {
        // Chạy ngay sau 150ms nếu không có intro rèm
        setTimeout(playIntroTimeline, 150);
      }

      // 4. Parallax khi cuộn trang (Scroll Transition nhẹ nhàng bàn giao cho section dưới)
      if (containerRef.current) {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            if (bgTypoRef.current) {
              gsap.set(bgTypoRef.current, { y: p * 90, opacity: Math.max(0, 1 - p * 1.4) });
            }
            if (mainImageRef.current) {
              gsap.set(mainImageRef.current, { y: p * 60, scale: 1 - p * 0.08 });
            }
            if (titleLine1Ref.current && titleLine2Ref.current) {
              gsap.set([titleLine1Ref.current, titleLine2Ref.current], {
                y: p * 40,
                opacity: Math.max(0, 1 - p * 1.2),
              });
            }
          },
        });
      }
    }, containerRef);

    // 5. Parallax theo chuột (Chỉ bật trên Desktop có con trỏ chính xác: pointer: fine)
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    let isIntersecting = true;
    let rafId: number | null = null;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    if (hasFinePointer && !prefersReducedMotion) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isIntersecting) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Chuẩn hóa tọa độ chuột từ -1 đến 1
        targetMouseX = (e.clientX / width - 0.5) * 2;
        targetMouseY = (e.clientY / height - 0.5) * 2;
      };

      const updateParallax = () => {
        if (isIntersecting) {
          // LERP mượt mà 0.07
          currentMouseX += (targetMouseX - currentMouseX) * 0.07;
          currentMouseY += (targetMouseY - currentMouseY) * 0.07;

          // Background Typo di chuyển chậm nhất (~4px)
          if (bgTypoRef.current) {
            gsap.set(bgTypoRef.current, {
              x: -currentMouseX * 5,
              y: -currentMouseY * 5,
            });
          }

          // Hình ảnh chính di chuyển ~10px
          if (mainImageRef.current) {
            gsap.set(mainImageRef.current, {
              x: currentMouseX * 10,
              y: currentMouseY * 10,
            });
          }

          // Chi tiết Foreground di chuyển ~14px
          if (foregroundBadgesRef.current) {
            gsap.set(foregroundBadgesRef.current, {
              x: currentMouseX * 15,
              y: currentMouseY * 15,
            });
          }
        }
        rafId = requestAnimationFrame(updateParallax);
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      rafId = requestAnimationFrame(updateParallax);

      // Cleanup mouse listener & RAF
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
        ctx.revert();
      };
    }

    // Cleanup khi không có fine pointer
    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, []);

  return {
    containerRef,
    eyebrowRef,
    titleLine1Ref,
    titleLine2Ref,
    subTitleRef,
    descRef,
    ctaGroupRef,
    metricsRef,
    visualContainerRef,
    mainImageRef,
    bgTypoRef,
    foregroundBadgesRef,
  };
}
