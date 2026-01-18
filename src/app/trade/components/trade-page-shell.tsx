"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";

type TradePageShellProps = {
  title: string;
  children: React.ReactNode;
  showAddButton?: boolean;
};

export default function TradePageShell({
  title,
  children,
  showAddButton = true,
}: TradePageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black min-w-0">
      <header className="h-16 bg-[#121212] border-b border-[#27272a] flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-1 text-[#9ca3af] hover:text-white focus:outline-none">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {title}
          </h1>
        </div>
        {showAddButton ? (
          <div className="flex items-center gap-4">
            <Link
              prefetch
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm rounded-md transition-colors shadow shadow-emerald-900/20"
              href={`/trade/add`}
            >
              <Plus className="h-4 w-4" />
              新增交易
            </Link>
          </div>
        ) : null}
      </header>
      <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0">
        {children}
      </div>
    </div>
  );
}
