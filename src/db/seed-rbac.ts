import { db } from "@/lib/db";
import { roles, rolePermissions } from "./schema-rbac";
import { eq } from "drizzle-orm";

type PermDef = { resource: string; action: string; scope: string };

const ownerPerms: PermDef[] = [
  "dashboard",
  "members",
  "salaries",
  "customers",
  "products",
  "contracts",
  "commissions",
  "settings",
  "teams",
  "roles",
  "invitations",
].flatMap((resource) =>
  ["view", "create", "edit", "delete"].map((action) => ({
    resource,
    action,
    scope: "all",
  }))
);

const managerPerms: PermDef[] = [
  { resource: "dashboard", action: "view", scope: "all" },
  { resource: "members", action: "view", scope: "team" },
  { resource: "salaries", action: "view", scope: "own" },
  { resource: "customers", action: "view", scope: "team" },
  { resource: "customers", action: "create", scope: "all" },
  { resource: "customers", action: "edit", scope: "team" },
  { resource: "products", action: "view", scope: "all" },
  { resource: "contracts", action: "view", scope: "team" },
  { resource: "contracts", action: "create", scope: "all" },
  { resource: "contracts", action: "edit", scope: "team" },
  { resource: "commissions", action: "view", scope: "team" },
  { resource: "settings", action: "view", scope: "all" },
  { resource: "teams", action: "view", scope: "all" },
];

const memberPerms: PermDef[] = [
  { resource: "dashboard", action: "view", scope: "own" },
  { resource: "members", action: "view", scope: "own" },
  { resource: "salaries", action: "view", scope: "own" },
  { resource: "customers", action: "view", scope: "own" },
  { resource: "products", action: "view", scope: "all" },
  { resource: "contracts", action: "view", scope: "own" },
  { resource: "contracts", action: "create", scope: "own" },
  { resource: "commissions", action: "view", scope: "own" },
  { resource: "settings", action: "view", scope: "all" },
  { resource: "teams", action: "view", scope: "all" },
];

const defaultRoles = [
  {
    name: "owner",
    displayName: "オーナー",
    description: "全権限を持つ管理者",
    perms: ownerPerms,
  },
  {
    name: "manager",
    displayName: "マネージャー",
    description: "チーム範囲の閲覧・一部編集権限",
    perms: managerPerms,
  },
  {
    name: "member",
    displayName: "メンバー",
    description: "自分のデータのみ閲覧",
    perms: memberPerms,
  },
];

export async function seedRbac() {
  for (const roleDef of defaultRoles) {
    // Upsert role
    const existing = await db.query.roles.findFirst({
      where: eq(roles.name, roleDef.name),
    });

    let roleId: string;
    if (existing) {
      roleId = existing.id;
    } else {
      const [inserted] = await db
        .insert(roles)
        .values({
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          isSystem: true,
        })
        .returning();
      roleId = inserted.id;
    }

    // Delete existing permissions and re-insert
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (roleDef.perms.length > 0) {
      await db.insert(rolePermissions).values(
        roleDef.perms.map((p) => ({
          roleId,
          resource: p.resource,
          action: p.action,
          scope: p.scope,
        }))
      );
    }
  }

  console.log("RBAC seed complete.");
}
