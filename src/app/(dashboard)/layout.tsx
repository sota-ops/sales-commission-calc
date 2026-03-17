import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getUser } from "@/actions/auth";
import { getAuthContext } from "@/lib/auth/authorize";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const authCtx = await getAuthContext();

  const authValue = authCtx
    ? {
        memberId: authCtx.memberId,
        memberName: authCtx.memberName,
        roleName: authCtx.roleName,
        teamId: authCtx.teamId,
        permissions: authCtx.permissions,
      }
    : null;

  return (
    <AuthProvider value={authValue}>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b bg-card px-6 py-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            {user && <UserMenu email={user.email ?? ""} />}
          </div>
          <div className="p-6 min-h-[calc(100vh-57px)] bg-muted/30">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </AuthProvider>
  );
}
