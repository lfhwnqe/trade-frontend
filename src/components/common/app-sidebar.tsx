"use client";

import { ChevronUp, Home, Inbox, User2, Database, Search, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAlert } from "./alert";

// Menu items.
const tradeItems = [
  {
    title: "首页",
    url: "/trade/home",
    icon: Home,
  },
  {
    title: "交易记录",
    url: "/trade/list",
    icon: Inbox,
  },
];

// RAG 模块菜单项
const ragItems = [
  {
    title: "RAG 首页",
    url: "/rag",
    icon: Home,
    description: "RAG 系统总览"
  },
  {
    title: "文档列表",
    url: "/rag/documents",
    icon: FileText,
    description: "浏览和查看文档"
  },
  {
    title: "数据管理",
    url: "/rag/manage",
    icon: Database,
    description: "文档上传与管理"
  },
  {
    title: "RAG 测试",
    url: "/rag/test",
    icon: Search,
    description: "智能搜索测试"
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorAlert] = useAlert();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      // 清除本地存储的token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("idToken");
      localStorage.removeItem("token");

      // 使用登出接口清除 HTTP-only cookie
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // 跳转到登录页面
      router.push("/auth/login");
    } catch (error) {
      console.error("登出过程中发生错误:", error);
      errorAlert("登出过程中发生错误，请重试");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>交易系统</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tradeItems.map(
                (item) => (
                  <SidebarMenuItem key={item.title}>
                    {/* 重点：将 isActive 属性传给 SidebarMenuButton */}
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>RAG 知识库</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ragItems.map(
                (item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <a href={item.url} title={item.description}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <span>首页</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <span>{isLoggingOut ? "退出中..." : "退出登录"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
