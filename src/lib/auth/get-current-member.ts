import { cache } from "react";
import { getUser } from "@/actions/auth";
import { db } from "@/lib/db";
import { salesMembers } from "@/db/schema";
import { roles, rolePermissions } from "@/db/schema-rbac";
import { eq } from "drizzle-orm";
import type { AuthContext, Permission, Resource, Action, Scope } from "./types";

export const getCurrentMember = cache(
  async (): Promise<AuthContext | null> => {
    const user = await getUser();
    if (!user) return null;

    const member = await db.query.salesMembers.findFirst({
      where: eq(salesMembers.userId, user.id),
    });

    if (!member || !member.roleId) return null;

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, member.roleId),
      with: { permissions: true },
    });

    if (!role) return null;

    const permissions: Permission[] = role.permissions.map((p) => ({
      resource: p.resource as Resource,
      action: p.action as Action,
      scope: p.scope as Scope,
    }));

    return {
      userId: user.id,
      memberId: member.id,
      memberName: member.name,
      roleId: role.id,
      roleName: role.name,
      teamId: member.teamId,
      permissions,
    };
  }
);
