"use server";

import { db } from "@/lib/db";
import { salesMembers } from "@/db/schema";
import { salesMemberSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMembers() {
  try {
    return await db.query.salesMembers.findMany({
      with: { team: true },
      orderBy: (members, { asc }) => [asc(members.name)],
    });
  } catch {
    return [];
  }
}

export async function getMember(id: string) {
  return db.query.salesMembers.findFirst({
    where: eq(salesMembers.id, id),
    with: { team: true },
  });
}

export async function createMember(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = salesMemberSchema.parse({
    ...raw,
    teamId: raw.teamId === "" ? null : raw.teamId,
  });

  await db.insert(salesMembers).values({
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    teamId: parsed.teamId,
    baseSalary: String(parsed.baseSalary),
    joinDate: parsed.joinDate,
  });

  revalidatePath("/members");
}

export async function updateMember(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = salesMemberSchema.parse({
    ...raw,
    teamId: raw.teamId === "" ? null : raw.teamId,
  });

  await db
    .update(salesMembers)
    .set({
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      teamId: parsed.teamId,
      baseSalary: String(parsed.baseSalary),
      joinDate: parsed.joinDate,
      updatedAt: new Date(),
    })
    .where(eq(salesMembers.id, id));

  revalidatePath("/members");
}

export async function deleteMember(id: string) {
  await db
    .update(salesMembers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(salesMembers.id, id));

  revalidatePath("/members");
}
