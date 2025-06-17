"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
import { ErrorBoundary } from "@/components/rag";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Database, Search } from "lucide-react";
import Link from "next/link";

// 面包屑导航配置
const getBreadcrumbConfig = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = [
    { label: '首页', href: '/', icon: Home }
  ];

  if (segments.includes('rag')) {
    breadcrumbs.push({ label: 'RAG 知识库', href: '/rag', icon: Database });
    
    if (segments.includes('manage')) {
      breadcrumbs.push({ label: '数据管理', href: '/rag/manage', icon: Database });
    } else if (segments.includes('test')) {
      breadcrumbs.push({ label: 'RAG 测试', href: '/rag/test', icon: Search });
    }
  }

  return breadcrumbs;
};

export default function RAGLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbConfig(pathname);

  return (
    <ErrorBoundary>
      <SidebarProvider className="h-screen">
        <AppSidebar />
        <main className="p-4 w-full flex flex-col relative h-screen overflow-hidden">
          <SidebarTrigger className="absolute top-0 left-0 z-10" />
          
          <div className="flex-1 flex flex-col min-h-0 pt-8">
            {/* 面包屑导航 */}
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 px-1">
              {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const Icon = breadcrumb.icon;
                
                return (
                  <div key={breadcrumb.href} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 mx-2" />
                    )}
                    
                    {isLast ? (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        {Icon && <Icon className="h-4 w-4" />}
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {breadcrumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* 主要内容区域 */}
            <div className="flex-1 min-h-0 overflow-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </ErrorBoundary>
  );
}