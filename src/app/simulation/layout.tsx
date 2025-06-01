import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen">
      <AppSidebar menuType="simulation" />
      <main className="p-4 w-full flex flex-col relative overflow-y-hidden">
        <SidebarTrigger className="absolute top-0 left-0" />
        <div className="overflow-y-auto flex-1 flex">{children}</div>
      </main>
    </SidebarProvider>
  );
}
