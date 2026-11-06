import { HeroContentData } from "../types/hero.types";

export const defaultHeroContent: HeroContentData = {
  eyebrow: "ẨM THỰC ĐƯƠNG ĐẠI · DI SẢN NGÀN NĂM",
  eyebrowTag: "Michelin Selected 2024",
  titleLine1: "CHẠM VỊ",
  titleLine2: "VIỆT NAM",
  subTitle: "Nơi Ký Ức Hương Vị Tái Sinh Trong Nghệ Thuật Ẩm Thực Mới",
  description:
    "Mỗi món ăn là một miền ký ức, được kể lại bằng hương vị, con người và những câu chuyện Việt.",
  primaryCta: {
    label: "Khám phá câu chuyện",
    href: "#story",
    variant: "primary",
  },
  secondaryCta: {
    label: "Xem thực đơn ngay",
    href: "#menu",
    variant: "secondary",
  },
  aiAdvisorCta: {
    label: "Tư Vấn Khẩu Vị AI",
    href: "/tu-van",
    variant: "outline",
  },
  stampText: "BẾP MẸ DI SẢN · VỊ VIỆT",
  metrics: [
    {
      value: "48h+",
      label: "Ninh thảo quả & tủy bò",
      sub: "Nước dùng nguyên bản",
    },
    {
      value: "100%",
      label: "Nông sản bản địa hữu cơ",
      sub: "Thảo mộc tươi trong ngày",
    },
    {
      value: "03 Miền",
      label: "Hành trình vị giác di sản",
      sub: "Bắc - Trung - Nam tụ hội",
    },
    {
      value: "88°C",
      label: "Giao nóng thố giữ nhiệt",
      sub: "Chuẩn vị nhà hàng tại gia",
    },
  ],
  visual: {
    // Ảnh đĩa ẩm thực truyền thống Việt Nam đương đại chất lượng cao, màu sắc tinh tế
    mainImage:
      "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=1200&q=85",
    fallbackImage:
      "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=85",
    alt: "Kiệt tác ẩm thực đương đại Vị Việt - Tinh hoa gia truyền Việt Nam",
    dishName: "Phở Bò Tái Lăn Hoàng Gia",
    origin: "Hà Thành Cổ Truyền",
    heatTag: "Thố Nhiệt 88°C",
    coordinates: "21.0285° N, 105.8542° E",
  },
};
