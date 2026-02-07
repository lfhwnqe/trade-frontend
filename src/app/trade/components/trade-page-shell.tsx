"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";

type TradePageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showAddButton?: boolean;
};

export default function TradePageShell({
  title,
  subtitle,
  children,
  showAddButton = true,
}: TradePageShellProps) {
  return (
    <div className="flex h-screen flex-col bg-black min-w-0 overflow-hidden">
      <header className="h-16 bg-[#121212] border-b border-[#27272a] flex items-center justify-between px-6 shrink-0 z-30 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-1 text-[#9ca3af] hover:text-white focus:outline-none">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-[#9ca3af]">{subtitle}</div>
            ) : null}
          </div>
        </div>
        {showAddButton ? (
          <div className="flex items-center gap-4">
            <Link
              prefetch
              className="flex items-center gap-2 px-4 py-2 bg-[#00c2b2] hover:bg-[#009e91] text-black font-semibold text-sm rounded-md transition-colors shadow shadow-black/40"
              href={`/trade/add`}
            >
              <Plus className="h-4 w-4" />
              新增交易
            </Link>
          </div>
        ) : null}
      </header>
      <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0 emerald-scrollbar">
        {children}
      </div>
    </div>
  );
}
