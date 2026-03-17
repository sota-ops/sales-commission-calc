import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { salesMembers, teams } from "./schema";

// ── Enums ──────────────────────────────────────────
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
  "cancelled",
]);

// ── Roles ──────────────────────────────────────────
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Role Permissions ───────────────────────────────
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    scope: text("scope").default("all").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique().on(t.roleId, t.resource, t.action)]
);

// ── Invitations ────────────────────────────────────
export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  roleId: uuid("role_id")
    .references(() => roles.id)
    .notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  invitedBy: uuid("invited_by")
    .references(() => salesMembers.id)
    .notNull(),
  token: text("token").notNull().unique(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

// ── Relations ──────────────────────────────────────
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  members: many(salesMembers),
  invitations: many(invitations),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
  })
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  role: one(roles, {
    fields: [invitations.roleId],
    references: [roles.id],
  }),
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  inviter: one(salesMembers, {
    fields: [invitations.invitedBy],
    references: [salesMembers.id],
  }),
}));
