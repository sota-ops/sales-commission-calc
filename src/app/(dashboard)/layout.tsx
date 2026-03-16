import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { getUser } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <SidebarTrigger />
          {user && <UserMenu email={user.email ?? ""} />}
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
