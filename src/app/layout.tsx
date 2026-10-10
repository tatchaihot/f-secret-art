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
  title: "F-Secret AI Art — บริการรับสร้างภาพ AI ระดับพรีเมียม 4K-8K",
  description: "บริการรับสร้างสรรค์ภาพ AI ภาพโมเดลเสมือนจริง สินค้า แฟชั่น โฆษณา และคอนเซ็ปต์อาร์ต 4K-8K พร้อมสิทธิ์เชิงพาณิชย์ ทักไลน์: tatchaihot",
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
