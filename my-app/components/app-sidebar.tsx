"use client";

import type { NavItem, NavKey } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Plus, Sparkles } from "lucide-react";

type AppSidebarProps = {
  activeView: NavKey;
  navItems: NavItem[];
  onViewChange: (view: NavKey) => void;
};

const recentChats = [
  "Botanical product set",
  "Archive import cleanup",
  "Editorial portrait ideas",
  "Generated gallery review",
];

export function AppSidebar({
  activeView,
  navItems,
  onViewChange,
}: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  function handleViewChange(view: NavKey) {
    onViewChange(view);
    setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-12">
              <span className="flex size-9 items-center justify-center rounded-[8px] bg-emerald-100 text-emerald-700">
                <Sparkles className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  Archive Chat
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button className="w-full justify-start bg-foreground text-background hover:bg-foreground/90">
          <Plus className="size-4" />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.key;

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="h-10 rounded-[8px]"
                      onClick={() => handleViewChange(item.key)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.count ? (
                      <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.map((chat) => (
                <SidebarMenuItem key={chat}>
                  <SidebarMenuButton className="h-9 rounded-[8px] font-normal">
                    <span>{chat}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <Card size="sm" className="gap-1 rounded-[8px] bg-white py-3 shadow-xs">
          <CardHeader className="px-3">
            <CardTitle className="text-sm">Mock workspace</CardTitle>
            <CardDescription className="text-xs leading-5">
              Frontend-only prototype with sample image data.
            </CardDescription>
          </CardHeader>
        </Card>
      </SidebarFooter>
    </Sidebar>
  );
}
