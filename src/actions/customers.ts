"use server";

import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { customerSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  try {
    return await db.query.customers.findMany({
      orderBy: (c, { asc }) => [asc(c.name)],
    });
  } catch {
    return [];
  }
}

export async function createCustomer(formData: FormData) {
  const parsed = customerSchema.parse(Object.fromEntries(formData));
  await db.insert(customers).values({
    name: parsed.name,
    industry: parsed.industry || null,
  });
  revalidatePath("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const parsed = customerSchema.parse(Object.fromEntries(formData));
  await db
    .update(customers)
    .set({
      name: parsed.name,
      industry: parsed.industry || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  revalidatePath("/customers");
}

export async function deleteCustomer(id: string) {
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/customers");
}
