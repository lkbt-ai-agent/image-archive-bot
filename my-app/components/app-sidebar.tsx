"use client";

import type { NavItem, NavKey } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

type AppSidebarProps = {
  activeView: NavKey;
  navItems: NavItem[];
  onViewChange: (view: NavKey) => void;
  compact?: boolean;
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
  compact = false,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-r border-border bg-sidebar text-sidebar-foreground",
        !compact && "hidden md:flex md:w-[280px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-9 items-center justify-center rounded-[8px] bg-emerald-100 text-emerald-700">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Archive Chat</p>
          <p className="truncate text-xs text-muted-foreground">
            Images and generation
          </p>
        </div>
      </div>

      <div className="px-3">
        <Button className="w-full justify-start bg-foreground text-background hover:bg-foreground/90">
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;

          return (
            <Button
              key={item.key}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "h-10 w-full justify-start gap-2 rounded-[8px] px-3",
                isActive && "bg-white shadow-xs"
              )}
              onClick={() => onViewChange(item.key)}
            >
              <Icon className="size-4" />
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>
              {item.count ? (
                <Badge variant="secondary" className="h-5 rounded-[6px] px-1.5">
                  {item.count}
                </Badge>
              ) : null}
            </Button>
          );
        })}
      </nav>

      <Separator className="my-4" />

      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">
            Recent
          </p>
          {recentChats.map((chat) => (
            <Button
              key={chat}
              variant="ghost"
              className="h-9 w-full justify-start rounded-[8px] px-3 text-sm font-normal"
            >
              <span className="truncate">{chat}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="rounded-[8px] bg-white p-3 shadow-xs">
          <p className="text-sm font-medium">Mock workspace</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Frontend-only prototype with sample image data.
          </p>
        </div>
      </div>
    </aside>
  );
}
