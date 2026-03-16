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

const navItems = [
  { title: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { title: "メンバー", href: "/members", icon: Users },
  { title: "チーム", href: "/teams", icon: Building2 },
  { title: "商品", href: "/products", icon: Package },
  { title: "顧客", href: "/customers", icon: Handshake },
  { title: "契約", href: "/contracts", icon: FileText },
  { title: "報酬計算", href: "/commissions", icon: Calculator },
  { title: "設定", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border/50">
      <SidebarHeader className="border-b border-sidebar-border/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0176D3] to-[#1B96FF] glow-blue-sm">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gradient-sf">営業報酬計算</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            メニュー
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    className={`group/btn relative rounded-lg px-3 py-2.5 transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-[#0176D3]/15 text-[#1B96FF] glow-blue-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 transition-colors duration-200 ${
                        pathname === item.href
                          ? "text-[#1B96FF]"
                          : "text-muted-foreground group-hover/btn:text-foreground"
                      }`}
                    />
                    <span className="font-medium">{item.title}</span>
                    {pathname === item.href && (
                      <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[#1B96FF]" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
