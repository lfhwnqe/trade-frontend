"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Home,
  Layers,
  ReceiptText,
  Repeat2,
  ScrollText,
  Terminal,
  Trophy,
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
  activePaths?: string[];
};

type NavSection = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  isActive?: (pathname: string | null) => boolean;
};

const isPathActive = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));

const isFlashcardDetailPath = (pathname: string | null) => {
  if (!pathname) return false;
  const match = pathname.match(/^\/trade\/flashcard\/([^/]+)$/);
  if (!match) return false;

  return !new Set([
    "create",
    "manage",
    "review",
    "drill",
    "simulation",
    "mistakes",
  ]).has(match[1]);
};

const homeNavItem: NavItem = {
  title: "主页",
  href: "/trade/home",
  icon: Home,
};

const priorityPrefetchRoutes = [
  "/trade/home",
  "/trade/list",
  "/trade/flashcard/drill/setup",
  "/trade/flashcard/simulation/setup",
];

const tradeNavSections: NavSection[] = [
  {
    title: "交易模块",
    icon: ReceiptText,
    items: [
      {
        title: "交易记录",
        href: "/trade/list",
        icon: ClipboardList,
        activePaths: ["/trade/add", "/trade/detail"],
      },
      {
        title: "交易总结",
        href: "/trade/summaries",
        icon: FileText,
      },
    ],
  },
  {
    title: "闪卡模块",
    icon: Layers,
    items: [
      {
        title: "闪卡录入",
        href: "/trade/flashcard/create",
        icon: Layers,
      },
      {
        title: "闪卡练习",
        href: "/trade/flashcard/drill/setup",
        icon: Repeat2,
        activePaths: ["/trade/flashcard/drill/play"],
      },
      {
        title: "闪卡复盘",
        href: "/trade/flashcard/review",
        icon: ScrollText,
      },
      {
        title: "训练成绩",
        href: "/trade/flashcard/drill/history",
        icon: Trophy,
      },
      {
        title: "闪卡管理",
        href: "/trade/flashcard/manage",
        icon: ClipboardList,
      },
    ],
    isActive: (pathname) => isFlashcardDetailPath(pathname),
  },
  {
    title: "交易闪卡",
    icon: FileText,
    items: [
      {
        title: "交易闪卡录入",
        href: "/trade/trade-flashcard/create",
        icon: FileText,
      },
      {
        title: "交易闪卡管理",
        href: "/trade/trade-flashcard/manage",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "模拟盘训练",
    icon: Repeat2,
    items: [
      {
        title: "模拟盘训练",
        href: "/trade/flashcard/simulation/setup",
        icon: Repeat2,
        activePaths: ["/trade/flashcard/simulation/play"],
      },
      {
        title: "模拟盘历史",
        href: "/trade/flashcard/simulation/history",
        icon: Trophy,
      },
      {
        title: "训练记录管理",
        href: "/trade/flashcard/simulation/attempts",
        icon: ClipboardList,
      },
      {
        title: "Mistake Records",
        href: "/trade/flashcard/mistakes/records",
        icon: ScrollText,
      },
    ],
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

const isNavItemActive = (pathname: string | null, item: NavItem) =>
  isPathActive(pathname, item.href) ||
  Boolean(item.activePaths?.some((path) => isPathActive(pathname, path)));

const isNavSectionActive = (pathname: string | null, section: NavSection) =>
  Boolean(section.isActive?.(pathname)) ||
  section.items.some((item) => isNavItemActive(pathname, item));

export default function TradeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(
    () =>
      tradeNavSections.find((section) => isNavSectionActive(pathname, section))
        ?.title ?? null,
  );
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

  const toggleSection = (title: string) => {
    setOpenSection((current) => (current === title ? null : title));
  };

  useEffect(() => {
    const activeSection = tradeNavSections.find((section) =>
      isNavSectionActive(pathname, section),
    );

    setOpenSection(activeSection?.title ?? null);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const browserWindow = window;
    const requestIdleCallback = browserWindow.requestIdleCallback?.bind(browserWindow);
    const cancelIdleCallback = browserWindow.cancelIdleCallback?.bind(browserWindow);

    const prefetchRoutes = () => {
      priorityPrefetchRoutes.forEach((href) => {
        router.prefetch(href);
      });
    };

    if (requestIdleCallback && cancelIdleCallback) {
      const idleCallbackId = requestIdleCallback(prefetchRoutes, {
        timeout: 2000,
      });
      return () => cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = browserWindow.setTimeout(prefetchRoutes, 800);
    return () => browserWindow.clearTimeout(timeoutId);
  }, [router]);

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

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {(() => {
            const isActive = isNavItemActive(pathname, homeNavItem);
            return (
              <Link
                prefetch={false}
                key={homeNavItem.title}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-[#00c2b2]/15 text-[#00c2b2]"
                    : "text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-[#00c2b2]"
                }`}
                href={homeNavItem.href}
              >
                <homeNavItem.icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#00c2b2]" : "text-[#9ca3af]"
                  }`}
                />
                {homeNavItem.title}
              </Link>
            );
          })()}

          {tradeNavSections.map((section) => {
            const isOpen = openSection === section.title;
            const isActive = isNavSectionActive(pathname, section);
            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#00c2b2]/10 text-[#00c2b2]"
                      : "text-[#9ca3af] hover:bg-[#1e1e1e] hover:text-[#00c2b2]"
                  }`}
                >
                  <section.icon
                    className={`h-4 w-4 ${
                      isActive ? "text-[#00c2b2]" : "text-[#9ca3af]"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    } ${isActive ? "text-[#00c2b2]" : "text-[#71717a]"}`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="ml-5 space-y-1 border-l border-[#27272a] pl-3 pt-1">
                      {section.items.map((item) => {
                        const itemActive = isNavItemActive(pathname, item);
                        return (
                          <Link
                            prefetch={false}
                            key={item.href}
                            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                              itemActive
                                ? "bg-[#00c2b2]/15 text-[#00c2b2]"
                                : "text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-[#00c2b2]"
                            }`}
                            href={item.href}
                          >
                            <item.icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                itemActive
                                  ? "text-[#00c2b2]"
                                  : "text-[#71717a]"
                              }`}
                            />
                            <span className="min-w-0 truncate">
                              {item.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#27272a] space-y-2">
          <Link
            prefetch={false}
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
                      主入口
                    </div>
                    <div className="mt-2 space-y-1">
                      <Link
                        prefetch={false}
                        href={homeNavItem.href}
                        className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                      >
                        {homeNavItem.title}
                      </Link>
                    </div>
                  </div>

                  {tradeNavSections.map((section) => (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                        <section.icon className="h-3.5 w-3.5" />
                        <span>{section.title}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {section.items.map((item) => (
                          <Link
                            prefetch={false}
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-[#00c2b2]"
                          >
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <div className="text-xs font-semibold text-gray-400">
                      集成中心
                    </div>
                    <div className="mt-2 space-y-1">
                      {integrationItems.map((item) => (
                        <Link
                          prefetch={false}
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
                      prefetch={false}
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
