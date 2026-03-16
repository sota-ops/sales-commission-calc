"use server";

import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { productSchema } from "@/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    return await db.query.products.findMany({
      orderBy: (p, { asc }) => [asc(p.name)],
    });
  } catch {
    return [];
  }
}

export async function createProduct(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = productSchema.parse({
    ...raw,
    isRecurring: raw.isRecurring === "true",
  });

  await db.insert(products).values({
    name: parsed.name,
    category: parsed.category,
    initialPrice: String(parsed.initialPrice),
    monthlyPrice: String(parsed.monthlyPrice),
    unitPrice: String(parsed.initialPrice + parsed.monthlyPrice),
    isRecurring: parsed.isRecurring,
  });

  revalidatePath("/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = productSchema.parse({
    ...raw,
    isRecurring: raw.isRecurring === "true",
  });

  await db
    .update(products)
    .set({
      name: parsed.name,
      category: parsed.category,
      initialPrice: String(parsed.initialPrice),
      monthlyPrice: String(parsed.monthlyPrice),
      unitPrice: String(parsed.initialPrice + parsed.monthlyPrice),
      isRecurring: parsed.isRecurring,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/products");
}
