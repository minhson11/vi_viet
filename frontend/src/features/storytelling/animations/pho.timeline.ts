import gsap from "gsap";

export function createPhoTimeline(targetSelector: string) {
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.from(`${targetSelector} .steam`, { opacity: 0, y: 15, duration: 1.5, repeat: -1, yoyo: true })
    .from(`${targetSelector} .story-quote`, { opacity: 0, x: -30, duration: 1 }, 0);
  return tl;
}

