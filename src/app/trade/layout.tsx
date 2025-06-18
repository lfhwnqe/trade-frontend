"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/common";

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <SidebarProvider className="h-screen">
      <AppSidebar />
      <main className="p-4 w-full flex flex-col relative h-screen overflow-hidden">
        <SidebarTrigger className="absolute top-0 left-0 z-10" />
        
        <div className="flex-1 flex flex-col min-h-0 pt-8">
          {/* 面包屑导航 */}
          <Breadcrumb 
            currentPath={pathname}
            searchParams={searchParams}
            className="mb-4 px-1"
          />

          {/* 主要内容区域 */}
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
