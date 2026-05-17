"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ArrowDownUp,
  AlertTriangle,
  MessageSquareText,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/",           label: "Dashboard",     icon: LayoutDashboard },
  { href: "/inventory",  label: "Inventory",     icon: Boxes },
  { href: "/operations", label: "Operations",    icon: ArrowDownUp },
  { href: "/low-stock",  label: "Low Stock",     icon: AlertTriangle },
  { href: "/chat",       label: "AI Assistant",  icon: MessageSquareText },
] as const;

export function NavSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Warehouse className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">warehouseIQ</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Inventory orchestrator
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-[11px] leading-relaxed text-muted-foreground">
        GlobalLogistics Corp.
        <br />
        <span className="opacity-70">Internal use only.</span>
      </div>
    </aside>
  );
}

export function MobileNavBar() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden grid grid-cols-5 border-b bg-card/80 backdrop-blur-sm">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="leading-tight">{label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
