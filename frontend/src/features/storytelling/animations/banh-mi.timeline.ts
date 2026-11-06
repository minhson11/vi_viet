import gsap from "gsap";

export function createBanhMiTimeline(targetSelector: string) {
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.from(`${targetSelector} .crisp-effect`, { scale: 0.95, opacity: 0, duration: 0.8 });
  return tl;
}

