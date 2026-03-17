"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Handshake,
  FileText,
  Calculator,
  Settings,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useHasPermission } from "@/components/providers/auth-provider";
import type { Resource } from "@/lib/auth/types";

const navItems: {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  resource: Resource;
}[] = [
  { title: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard, resource: "dashboard" },
  { title: "メンバー", href: "/members", icon: Users, resource: "members" },
  { title: "チーム", href: "/teams", icon: Building2, resource: "teams" },
  { title: "商品", href: "/products", icon: Package, resource: "products" },
  { title: "顧客", href: "/customers", icon: Handshake, resource: "customers" },
  { title: "契約", href: "/contracts", icon: FileText, resource: "contracts" },
  { title: "報酬計算", href: "/commissions", icon: Calculator, resource: "commissions" },
  { title: "設定", href: "/settings", icon: Settings, resource: "settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Calculator className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold">営業報酬計算</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            メニュー
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarNavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const hasView = useHasPermission(item.resource, "view");

  // If no auth context (not linked yet), show all items
  // If auth context exists, respect permissions
  if (hasView === false) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={item.href} />}
        isActive={pathname === item.href}
        className={`group/btn relative rounded-md px-3 py-2.5 transition-colors ${
          pathname === item.href
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <item.icon
          className={`h-4 w-4 ${
            pathname === item.href
              ? "text-primary"
              : "text-muted-foreground group-hover/btn:text-foreground"
          }`}
        />
        <span>{item.title}</span>
        {pathname === item.href && (
          <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
