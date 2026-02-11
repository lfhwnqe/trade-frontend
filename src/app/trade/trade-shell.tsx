"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Home,
  ReceiptText,
  Terminal,
  KeyRound,
  Webhook,
  Link2,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAlert } from "@/components/common/alert";
import { useAtomImmer } from "@/hooks/useAtomImmer";
import { userAtom } from "@/store/user";

const USER_STORAGE_KEY = "userProfile";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const tradeNavItems: NavItem[] = [
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

const integrationItems: NavItem[] = [
  {
    title: "API Token",
    href: "/trade/devtools/tokens",
    icon: KeyRound,
  },
  {
    title: "Webhook",
    href: "/trade/devtools/webhook",
    icon: Webhook,
  },
  {
    title: "币安合约同步",
    href: "/trade/devtools/binance-futures",
    icon: Link2,
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
  const [user, setUser] = useAtomImmer(userAtom);
  const displayName = user.username || "User";
  const userRole = user.role || "FreePlan";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      localStorage.removeItem(USER_STORAGE_KEY);
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!user.username && !user.email) {
      const cachedUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (!cachedUser) return;

      try {
        const parsed = JSON.parse(cachedUser) as {
          username?: string;
          email?: string;
          role?: string;
        };
        if (parsed.username || parsed.email) {
          setUser((draft) => {
            draft.username = parsed.username || "";
            draft.email = parsed.email || "";
            draft.role = parsed.role || "";
          });
        }
      } catch (error) {
        console.warn("无法解析缓存的用户信息:", error);
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
      return;
    }

    window.localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        username: user.username,
        email: user.email,
        role: user.role,
      }),
    );
  }, [setUser, user.email, user.username, user.role]);

  return (
    <div className="dark min-h-screen bg-black text-[#e5e7eb] antialiased selection:bg-[#00c2b2] selection:text-black flex">
      <aside className="w-64 bg-[#121212] border-r border-[#27272a] flex-shrink-0 fixed h-full z-20 hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
          <Link
            className="text-lg font-bold text-white flex items-center gap-2"
            href="/"
            prefetch
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00c2b2] to-white text-black">
              <Image
                src={`/favicon.png`}
                width={30}
                height={30}
                alt="Picture of the author"
              />
            </div>
            MMC Trading
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {tradeNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                prefetch
                key={item.title}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-[#00c2b2]/15 text-[#00c2b2]"
                    : "text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-[#00c2b2]"
                }`}
                href={item.href}
              >
                <item.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#00c2b2]" : "text-[#9ca3af]"
                  }`}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272a] space-y-2">
          <Link
            prefetch
            href="/trade/devtools"
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-white transition-colors"
          >
            <Terminal className="h-4 w-4" />
            <span>开发者工具</span>
          </Link>

          {/* user menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-[#9ca3af] hover:bg-[#1e1e1e] transition-colors cursor-pointer group"
                type="button"
              >
                <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center text-xs font-bold text-white border border-[#27272a]">
                  {initials}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#9ca3af]">{userRole}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#9ca3af] group-hover:text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuItem onClick={() => router.push("/")}>
                首页
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/trade/password")}>
                <span className="flex items-center gap-2">修改密码</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "退出中..." : "退出登录"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 min-h-screen bg-black min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="secondary"
                  className="bg-[#121212] border border-[#27272a]"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-[#0b0b0b] border-r border-[#27272a] text-[#e5e7eb]"
              >
                <SheetHeader>
                  <SheetTitle className="text-white">导航</SheetTitle>
                  <SheetDescription className="text-[#9ca3af]">
                    Trade 模块
                  </SheetDescription>
                </SheetHeader>

                <div className="px-4 pb-4 space-y-6">
                  <div>
                    <div className="text-xs font-semibold text-gray-400">
                      页面
                    </div>
                    <div className="mt-2 space-y-1">
                      {tradeNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-400">
                      集成中心
                    </div>
                    <div className="mt-2 space-y-1">
                      {integrationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <Link
                      href="/trade/password"
                      className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                    >
                      修改密码
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
                    >
                      {isLoggingOut ? "退出中..." : "退出登录"}
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="text-sm font-semibold text-white">MMC Trading</div>
            <div className="text-xs text-[#9ca3af]">{displayName}</div>
          </div>
        </div>

        <div className="lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
