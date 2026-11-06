import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  variable: "--font-headline",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VỊ VIỆT | Ẩm Thực Đương Đại · Contemporary Vietnamese Culinary",
  description: "Trải nghiệm ẩm thực truyền thống Việt Nam kết hợp nghệ thuật đương đại và công nghệ đặt tiệc đẳng cấp Michelin.",
  icons: {
    icon: "/logo-emblem.svg",
    apple: "/logo-emblem.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`scroll-smooth ${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#fff8f6] text-[#1c1917] font-body antialiased selection:bg-[#b72e24] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
