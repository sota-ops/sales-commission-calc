"use server";

import { db } from "@/lib/db";
import { teams } from "@/db/schema";
import { teamSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTeams() {
  try {
    return await db.query.teams.findMany({
      with: { members: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  } catch {
    return [];
  }
}

export async function createTeam(formData: FormData) {
  const parsed = teamSchema.parse(Object.fromEntries(formData));
  await db.insert(teams).values({ name: parsed.name });
  revalidatePath("/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  const parsed = teamSchema.parse(Object.fromEntries(formData));
  await db
    .update(teams)
    .set({ name: parsed.name, updatedAt: new Date() })
    .where(eq(teams.id, id));
  revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
  await db.delete(teams).where(eq(teams.id, id));
  revalidatePath("/teams");
}
