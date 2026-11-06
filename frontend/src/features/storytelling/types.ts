export interface StoryScene {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  dishName: string;
  region: "Bac" | "Trung" | "Nam";
  audioUrl?: string;
  videoUrl?: string;
  backgroundAsset: string;
}

