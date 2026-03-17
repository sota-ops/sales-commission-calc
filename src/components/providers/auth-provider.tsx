"use client";

import { createContext, useContext } from "react";
import type { Permission, Resource, Action, Scope } from "@/lib/auth/types";

type AuthContextValue = {
  memberId: string;
  memberName: string;
  roleName: string;
  teamId: string | null;
  permissions: Permission[];
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  value,
  children,
}: {
  value: AuthContextValue | null;
  children: React.ReactNode;
}) {
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue | null {
  return useContext(AuthCtx);
}

export function useHasPermission(resource: Resource, action: Action): boolean {
  const auth = useContext(AuthCtx);
  if (!auth) return false;
  return auth.permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

export function usePermissionScope(
  resource: Resource,
  action: Action
): Scope | null {
  const auth = useContext(AuthCtx);
  if (!auth) return null;
  const perm = auth.permissions.find(
    (p) => p.resource === resource && p.action === action
  );
  return perm?.scope ?? null;
}
