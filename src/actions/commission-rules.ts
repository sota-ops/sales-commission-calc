"use server";

import { db } from "@/lib/db";
import { commissionRules } from "@/db/schema";
import { commissionRuleSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCommissionRules() {
  try {
    return await db.query.commissionRules.findMany({
      orderBy: (r, { asc }) => [asc(r.type), asc(r.tierMin)],
    });
  } catch {
    return [];
  }
}

export async function createCommissionRule(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = commissionRuleSchema.parse({
    ...raw,
    tierMax: raw.tierMax === "" ? null : Number(raw.tierMax),
  });

  await db.insert(commissionRules).values({
    title: parsed.title || null,
    type: parsed.type,
    tierMin: String(parsed.tierMin),
    tierMax: parsed.tierMax !== null ? String(parsed.tierMax) : null,
    rate: String(parsed.rate),
    flatBonus: String(parsed.flatBonus),
    description: parsed.description || null,
  });

  revalidatePath("/settings");
}

export async function updateCommissionRule(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = commissionRuleSchema.parse({
    ...raw,
    tierMax: raw.tierMax === "" ? null : Number(raw.tierMax),
  });

  await db
    .update(commissionRules)
    .set({
      title: parsed.title || null,
      type: parsed.type,
      tierMin: String(parsed.tierMin),
      tierMax: parsed.tierMax !== null ? String(parsed.tierMax) : null,
      rate: String(parsed.rate),
      flatBonus: String(parsed.flatBonus),
      description: parsed.description || null,
    })
    .where(eq(commissionRules.id, id));

  revalidatePath("/settings");
}

export async function deleteCommissionRule(id: string) {
  await db
    .update(commissionRules)
    .set({ isActive: false })
    .where(eq(commissionRules.id, id));
  revalidatePath("/settings");
}
