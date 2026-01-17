"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Home,
  LineChart,
  Menu,
  Plus,
  ReceiptText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlert } from "@/components/common/alert";

const tradeNavItems = [
  {
    title: "主页",
    href: "/trade/home",
    icon: Home,
  },
  {
    title: "交易记录",
    href: "/trade/list",
    icon: ReceiptText,
  },
  {
    title: "交易总结",
    href: "/trade/summaries",
    icon: FileText,
  },
];

export default function TradeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorAlert] = useAlert();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("idToken");
      localStorage.removeItem("token");

      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      router.push("/auth/login");
    } catch (error) {
      console.error("登出过程中发生错误:", error);
      errorAlert("登出过程中发生错误，请重试");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const headerTitle =
    tradeNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.title ?? "Dashboard Overview";

  return (
    <div className="dark min-h-screen bg-black text-[#e5e7eb] antialiased selection:bg-emerald-500 selection:text-white flex">
      <aside className="w-64 bg-[#121212] border-r border-[#27272a] flex-shrink-0 fixed h-full z-20 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
          <Link
            className="text-lg font-bold text-white flex items-center gap-2"
            href="/"
          >
            <LineChart className="h-5 w-5 text-emerald-400" />
            Trading System
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {tradeNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.title}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-white"
                }`}
                href={item.href}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-emerald-400" : "text-[#9ca3af]"
                  }`}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#27272a]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-[#9ca3af] hover:bg-[#1e1e1e] transition-colors cursor-pointer group"
                type="button"
              >
                <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-xs font-bold text-white border border-[#27272a]">
                  JD
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">John Doe</p>
                  <p className="text-xs text-[#9ca3af]">Pro Plan</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#9ca3af] group-hover:text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem onClick={() => router.push("/")}>
                <span>首页</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <span>{isLoggingOut ? "退出中..." : "退出登录"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-black min-w-0">
        <header className="h-16 bg-[#121212] border-b border-[#27272a] flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-1 text-[#9ca3af] hover:text-white focus:outline-none">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {headerTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm rounded-md transition-colors shadow shadow-emerald-900/20"
              onClick={() => {
                router.push("/trade/add");
              }}
            >
              <Plus className="h-4 w-4" />
              新增交易
            </button>
          </div>
        </header>
        <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
