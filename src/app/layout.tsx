import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F-Secret AI Art — บริการรับสร้างภาพ AI ระดับพรีเมียม",
  description: "บริการรับสร้างสรรค์ภาพ AI ภาพโมเดลเสมือนจริง สินค้า แฟชั่น โฆษณา และคอนเซ็ปต์อาร์ต คุมมูดแอนด์โทนได้ตามบรีฟ พร้อมสิทธิ์เชิงพาณิชย์ ทักไลน์: tatchaihot",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "F-Secret AI Art — บริการรับสร้างภาพ AI ระดับพรีเมียม",
    description: "สร้างสรรค์ภาพโปรไฟล์โมเดลเสมือนจริง แฟชั่น โฆษณา คุมโทนและใบหน้าได้ตามสั่ง ทักคุยรายละเอียดทาง LINE: tatchaihot",
    siteName: "F-Secret AI Art",
    type: "website",
    locale: "th_TH",
    images: [
      {
        url: "/guides/lora-guide.jpg",
        width: 1200,
        height: 675,
        alt: "F-Secret AI Art Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "F-Secret AI Art — บริการรับสร้างภาพ AI ระดับพรีเมียม",
    description: "รับสร้างภาพ AI โปรไฟล์ สินค้า แฟชั่น คุมมูดแอนด์โทนตรงตามบรีฟ 100%",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
