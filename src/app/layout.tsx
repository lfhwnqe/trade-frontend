import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/common/alert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MMC Trading",
  description: "MMC Trading System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn" style={{ filter: "invert(0)" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AlertProvider>{children}</AlertProvider>
      </body>
    </html>
  );
}
