"use server";

import { db } from "@/lib/db";
import { contracts } from "@/db/schema";
import { contractSchema } from "@/types";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getContracts() {
  try {
    return await db.query.contracts.findMany({
      with: { member: true, customer: true, product: true },
      orderBy: (c, { desc }) => [desc(c.contractDate)],
    });
  } catch {
    return [];
  }
}

export async function getContract(id: string) {
  return db.query.contracts.findFirst({
    where: eq(contracts.id, id),
    with: { member: true, customer: true, product: true },
  });
}

export async function createContract(formData: FormData) {
  const raw = Object.fromEntries(formData);

  // Auto-detect cross-sell: same customer with different product from different member
  const existingContracts = await db.query.contracts.findMany({
    where: and(
      eq(contracts.customerId, raw.customerId as string),
      eq(contracts.status, "active")
    ),
  });

  const isCrossSell =
    raw.isCrossSell === "true" ||
    existingContracts.some(
      (c) =>
        c.memberId !== raw.memberId && c.productId !== raw.productId
    );

  const parsed = contractSchema.parse({
    ...raw,
    isCrossSell,
  });

  await db.insert(contracts).values({
    memberId: parsed.memberId,
    customerId: parsed.customerId,
    productId: parsed.productId,
    status: parsed.status,
    contractDate: parsed.contractDate,
    monthlyAmount: String(parsed.monthlyAmount),
    grossProfit: String(parsed.grossProfit),
    isCrossSell: parsed.isCrossSell,
    note: parsed.note || null,
  });

  revalidatePath("/contracts");
}

export async function updateContract(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = contractSchema.parse({
    ...raw,
    isCrossSell: raw.isCrossSell === "true",
  });

  await db
    .update(contracts)
    .set({
      memberId: parsed.memberId,
      customerId: parsed.customerId,
      productId: parsed.productId,
      status: parsed.status,
      contractDate: parsed.contractDate,
      monthlyAmount: String(parsed.monthlyAmount),
      grossProfit: String(parsed.grossProfit),
      isCrossSell: parsed.isCrossSell,
      note: parsed.note || null,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  revalidatePath("/contracts");
}

export async function deleteContract(id: string) {
  await db
    .update(contracts)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(contracts.id, id));
  revalidatePath("/contracts");
}
