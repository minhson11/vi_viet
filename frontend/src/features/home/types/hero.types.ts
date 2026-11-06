export interface HeroAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
}

export interface HeroMetric {
  value: string;
  label: string;
  sub?: string;
}

export interface HeroVisualData {
  mainImage: string;
  fallbackImage?: string;
  alt: string;
  dishName: string;
  origin?: string;
  heatTag?: string;
  coordinates?: string;
}

export interface HeroContentData {
  eyebrow: string;
  eyebrowTag: string;
  titleLine1: string;
  titleLine2: string;
  subTitle?: string;
  description: string;
  primaryCta: HeroAction;
  secondaryCta: HeroAction;
  aiAdvisorCta?: HeroAction;
  stampText: string;
  metrics: HeroMetric[];
  visual: HeroVisualData;
}
