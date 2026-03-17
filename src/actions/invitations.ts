"use server";

import { db } from "@/lib/db";
import { invitations } from "@/db/schema-rbac";
import { salesMembers } from "@/db/schema";
import { authorize } from "@/lib/auth/authorize";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  roleId: z.string().uuid("ロールを選択してください"),
  teamId: z.string().uuid().optional(),
  memberName: z.string().min(1, "名前は必須です"),
});

export async function createInvitation(formData: FormData) {
  const ctx = await authorize("invitations", "create");

  const raw = Object.fromEntries(formData);
  const parsed = inviteSchema.parse({
    ...raw,
    teamId: raw.teamId === "" ? undefined : raw.teamId,
  });

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invitations).values({
    email: parsed.email,
    roleId: parsed.roleId,
    teamId: parsed.teamId ?? null,
    invitedBy: ctx.memberId,
    token,
    expiresAt,
  });

  // Also pre-create the sales member record (inactive until invitation accepted)
  await db.insert(salesMembers).values({
    name: parsed.memberName,
    email: parsed.email,
    role: "viewer",
    roleId: parsed.roleId,
    teamId: parsed.teamId ?? null,
    baseSalary: "0",
    joinDate: new Date().toISOString().slice(0, 10),
    isActive: false,
  });

  revalidatePath("/settings");

  return { token };
}

export async function getInvitations() {
  return db.query.invitations.findMany({
    with: { role: true, team: true, inviter: true },
    orderBy: (i, { desc }) => [desc(i.createdAt)],
  });
}

export async function cancelInvitation(id: string) {
  await authorize("invitations", "create");

  await db
    .update(invitations)
    .set({ status: "cancelled" })
    .where(eq(invitations.id, id));

  revalidatePath("/settings");
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.token, token),
      eq(invitations.status, "pending")
    ),
  });

  if (!invitation) {
    throw new Error("招待が見つかりません、または既に使用済みです");
  }

  if (new Date() > invitation.expiresAt) {
    await db
      .update(invitations)
      .set({ status: "expired" })
      .where(eq(invitations.id, invitation.id));
    throw new Error("招待の有効期限が切れています");
  }

  // Find the pre-created member and link to user
  const member = await db.query.salesMembers.findFirst({
    where: and(
      eq(salesMembers.email, invitation.email),
      eq(salesMembers.isActive, false)
    ),
  });

  if (member) {
    await db
      .update(salesMembers)
      .set({
        userId,
        isActive: true,
        roleId: invitation.roleId,
        teamId: invitation.teamId,
        updatedAt: new Date(),
      })
      .where(eq(salesMembers.id, member.id));
  } else {
    // Create member if not pre-created
    await db.insert(salesMembers).values({
      userId,
      name: invitation.email.split("@")[0],
      email: invitation.email,
      role: "viewer",
      roleId: invitation.roleId,
      teamId: invitation.teamId,
      baseSalary: "0",
      joinDate: new Date().toISOString().slice(0, 10),
      isActive: true,
    });
  }

  await db
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id));
}

export async function getInvitationByToken(token: string) {
  return db.query.invitations.findFirst({
    where: eq(invitations.token, token),
    with: { role: true, team: true },
  });
}
