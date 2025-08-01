import { AppSidebar } from "@render/components/app-sidebar";
import { SidebarProvider } from "@render/components/ui/sidebar";
import { Outlet } from "react-router";

function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}

export default Layout;
