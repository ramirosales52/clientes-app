import { User, Calendar, Home, ClipboardList } from "lucide-react";
import Logo from "../assets/logo2.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@render/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import { ClientesModal } from "./clientes-modal";
import TurnosModal from "./turnos-modal";
import TratamientosModal from "./tratamientos-modal";

// Menu items.
const items = [
  {
    title: "Principal",
    url: "/principal",
    icon: Home
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: User,
  },
  {
    title: "Turnos",
    url: "/turnos",
    icon: Calendar,
  },
  {
    title: "Tratamientos",
    url: "/tratamientos",
    icon: ClipboardList
  }
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex items-center">
        <img src={Logo} className="w-28 select-none" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = currentPath.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Acciones rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <ClientesModal className="w-full" />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <TurnosModal className="w-full" />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <TratamientosModal className="w-full" />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
