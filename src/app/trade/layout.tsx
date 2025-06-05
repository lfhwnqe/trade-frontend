import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen">
      <AppSidebar />
      <main className="p-4 w-full flex flex-col relative h-screen overflow-hidden">
        <SidebarTrigger className="absolute top-0 left-0" />
        <div className="flex-1 flex flex-col min-h-0 pt-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}
