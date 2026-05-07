import { AppSidebar } from "@render/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@render/components/ui/sidebar";
import { Toaster } from "@render/components/ui/sonner";
import { Outlet } from "react-router";

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="border h-dvh min-h-0 overflow-hidden md:h-[calc(100dvh-1rem)] md:m-2 md:rounded-xl">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
        <Toaster position="top-right" richColors />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
