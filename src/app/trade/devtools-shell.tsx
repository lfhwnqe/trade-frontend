"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, KeyRound, Link2, Menu, Webhook, Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const isDevEnv = (() => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.includes("/dev/") || base.includes("localhost") || base.includes("127.0.0.1");
})();

const devtoolItems: NavItem[] = [
  { title: "API Token", href: "/trade/devtools/tokens", icon: KeyRound },
  { title: "Webhook", href: "/trade/devtools/webhook", icon: Webhook },
  { title: "币安合约同步", href: "/trade/devtools/binance-futures", icon: Link2 },
  ...(isDevEnv
    ? [{ title: "图片接口测试", href: "/trade/devtools/image-resolve-test", icon: ImageIcon }]
    : []),
];

export default function DevtoolsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
        <Link className="text-sm font-bold text-white flex items-center gap-2 tracking-wide" href="/trade/devtools" prefetch>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00c2b2]/10 border border-[#00c2b2]/30">
            <Wrench className="h-4 w-4 text-[#00c2b2]" />
          </div>
          开发者工具
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {devtoolItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              prefetch
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#00c2b2]/15 text-[#00c2b2]"
                  : "text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-[#00c2b2]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#27272a] p-4">
        <Link
          prefetch
          href="/trade/home"
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          返回交易模块
        </Link>
      </div>
    </>
  );

  return (
    <div className="dark min-h-screen bg-black text-[#e5e7eb] antialiased flex">
      <aside className="hidden lg:flex fixed z-20 h-full w-64 flex-shrink-0 flex-col border-r border-[#27272a] bg-[#121212]">
        {nav}
      </aside>

      <div className="min-h-screen min-w-0 flex-1 bg-black lg:ml-64">
        <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="bg-[#121212] border border-[#27272a]">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0b0b0b] border-r border-[#27272a] text-[#e5e7eb]">
                <SheetHeader>
                  <SheetTitle className="text-white">开发者工具</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-4 space-y-2">
                  {devtoolItems.map((item) => (
                    <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]">
                      {item.title}
                    </Link>
                  ))}
                  <div className="pt-2 border-t border-white/10">
                    <Link href="/trade/home" className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                      返回交易模块
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="text-sm font-semibold text-white">开发者工具</div>
            <div className="w-8" />
          </div>
        </div>

        <div className="lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
