import { Home, ClipboardList, BotMessageSquare, CalendarClock, NotebookText, Users, CalendarPlus, Settings, Check, X } from "lucide-react";
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
import { ClientesModal } from "../app/features/clientes/components/clientes-modal";
import TratamientosModal from "../app/features/tratamientos/components/tratamientos-modal";
import { Button } from "./ui/button";
import { useWhatsappStatus } from "@render/hooks/use-whatsapp-status";

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
    icon: Users,
  },
  {
    title: "Calendario",
    url: "/calendario",
    icon: CalendarClock
  },
  {
    title: "Turnos",
    url: "/turno",
    icon: NotebookText,
  },
  {
    title: "Tratamientos",
    url: "/tratamientos",
    icon: ClipboardList
  },
  {
    title: "Whatsapp Bot",
    url: "/whatsapp",
    icon: BotMessageSquare
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings
  }
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isConnected } = useWhatsappStatus();

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
                const isWhatsapp = item.url === "/whatsapp";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {isWhatsapp && (
                          isConnected ? (
                            <Check className="ml-auto h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <X className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                          )
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Acciones rapidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <ClientesModal className="w-full" />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button asChild className="w-full">
                  <Link to="/turno/nuevo" className="flex gap-2">
                    <CalendarPlus />
                    <span>Agendar turno</span>
                  </Link>
                </Button>
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
