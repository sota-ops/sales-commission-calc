import { getCurrentMember } from "./get-current-member";
import type { Resource, Action, AuthContext, Permission, Scope } from "./types";

export class AuthorizationError extends Error {
  constructor(message = "権限がありません") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function checkPermission(
  permissions: Permission[],
  resource: Resource,
  action: Action
): Permission | null {
  return (
    permissions.find((p) => p.resource === resource && p.action === action) ??
    null
  );
}

export function hasPermissionInContext(
  ctx: AuthContext,
  resource: Resource,
  action: Action
): boolean {
  return checkPermission(ctx.permissions, resource, action) !== null;
}

export function getScope(
  ctx: AuthContext,
  resource: Resource,
  action: Action
): Scope | null {
  const perm = checkPermission(ctx.permissions, resource, action);
  return perm?.scope ?? null;
}

export async function authorize(
  resource: Resource,
  action: Action,
  opts?: { targetMemberId?: string; targetTeamId?: string }
): Promise<AuthContext> {
  const ctx = await getCurrentMember();
  if (!ctx) {
    throw new AuthorizationError("ログインが必要です");
  }

  const perm = checkPermission(ctx.permissions, resource, action);
  if (!perm) {
    throw new AuthorizationError();
  }

  if (perm.scope === "all") {
    return ctx;
  }

  if (perm.scope === "own") {
    if (opts?.targetMemberId && opts.targetMemberId !== ctx.memberId) {
      throw new AuthorizationError();
    }
    return ctx;
  }

  if (perm.scope === "team") {
    if (opts?.targetTeamId && ctx.teamId && opts.targetTeamId !== ctx.teamId) {
      throw new AuthorizationError();
    }
    return ctx;
  }

  throw new AuthorizationError();
}

export async function getAuthContext(): Promise<AuthContext | null> {
  return getCurrentMember();
}
