"use server";

import { db } from "@/lib/db";
import { roles, rolePermissions } from "@/db/schema-rbac";
import { authorize } from "@/lib/auth/authorize";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getRoles() {
  return db.query.roles.findMany({
    with: { permissions: true },
    orderBy: (r, { asc }) => [asc(r.name)],
  });
}

export async function getRolesForSelect() {
  return db.query.roles.findMany({
    orderBy: (r, { asc }) => [asc(r.name)],
  });
}

const permissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  scope: z.enum(["all", "own", "team"]),
});

export async function updateRolePermissions(
  roleId: string,
  permissions: z.infer<typeof permissionSchema>[]
) {
  await authorize("roles", "edit");

  await db
    .delete(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  if (permissions.length > 0) {
    await db.insert(rolePermissions).values(
      permissions.map((p) => ({
        roleId,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
      }))
    );
  }

  revalidatePath("/settings");
}

export async function createRole(formData: FormData) {
  await authorize("roles", "create");

  const name = formData.get("name") as string;
  const displayName = formData.get("displayName") as string;
  const description = (formData.get("description") as string) || null;

  if (!name || !displayName) {
    throw new Error("名前と表示名は必須です");
  }

  await db.insert(roles).values({
    name,
    displayName,
    description,
    isSystem: false,
  });

  revalidatePath("/settings");
}

export async function deleteRole(roleId: string) {
  await authorize("roles", "delete");

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
  });

  if (!role) throw new Error("ロールが見つかりません");
  if (role.isSystem) throw new Error("システムロールは削除できません");

  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  await db.delete(roles).where(eq(roles.id, roleId));

  revalidatePath("/settings");
}
