import type { Metadata } from "next";
import "./globals.css";
import { AlertProvider } from "@/components/common/alert";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="zh-cn" style={{ filter: "invert(0)" }} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AlertProvider>{children}</AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
