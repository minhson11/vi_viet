import gsap from "gsap";

export function createHeroTimeline(targetSelector: string) {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(`${targetSelector} h1`, { y: 40, opacity: 0, duration: 1 })
    .from(`${targetSelector} p`, { y: 20, opacity: 0, duration: 0.8 }, "-=0.6")
    .from(`${targetSelector} .hero-actions`, { y: 20, opacity: 0, duration: 0.6 }, "-=0.4");
  return tl;
}

