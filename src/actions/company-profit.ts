"use server";

import { db } from "@/lib/db";
import { companyProfitMonthly } from "@/db/schema";
import { companyProfitSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCompanyProfits() {
  try {
    return await db.query.companyProfitMonthly.findMany({
      orderBy: (p, { desc }) => [desc(p.yearMonth)],
    });
  } catch {
    return [];
  }
}

export async function upsertCompanyProfit(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = companyProfitSchema.parse(raw);
  const netProfit = parsed.totalRevenue - parsed.totalCost;

  const existing = await db.query.companyProfitMonthly.findFirst({
    where: eq(companyProfitMonthly.yearMonth, parsed.yearMonth),
  });

  if (existing) {
    await db
      .update(companyProfitMonthly)
      .set({
        totalRevenue: String(parsed.totalRevenue),
        totalCost: String(parsed.totalCost),
        netProfit: String(netProfit),
      })
      .where(eq(companyProfitMonthly.id, existing.id));
  } else {
    await db.insert(companyProfitMonthly).values({
      yearMonth: parsed.yearMonth,
      totalRevenue: String(parsed.totalRevenue),
      totalCost: String(parsed.totalCost),
      netProfit: String(netProfit),
    });
  }

  revalidatePath("/settings");
  revalidatePath("/commissions");
}
