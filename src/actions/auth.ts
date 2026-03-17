"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { salesMembers } from "@/db/schema";
import { roles } from "@/db/schema-rbac";
import { eq } from "drizzle-orm";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードは必須です" };
  }

  if (password !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }

  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // If this is the first user, create owner member automatically
  if (data.user) {
    try {
      const existingMembers = await db.query.salesMembers.findMany({
        limit: 1,
      });

      if (existingMembers.length === 0) {
        // First user becomes owner
        const ownerRole = await db.query.roles.findFirst({
          where: eq(roles.name, "owner"),
        });

        await db.insert(salesMembers).values({
          userId: data.user.id,
          name: email.split("@")[0],
          email,
          role: "admin",
          roleId: ownerRole?.id ?? null,
          baseSalary: "0",
          joinDate: new Date().toISOString().slice(0, 10),
          isActive: true,
        });
      }
    } catch {
      // Non-critical: member creation can happen later
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードは必須です" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  // If user has no salesMember linked, try to link by email
  if (data.user) {
    try {
      const existing = await db.query.salesMembers.findFirst({
        where: eq(salesMembers.userId, data.user.id),
      });

      if (!existing) {
        // Try to find unlinked member by email
        const byEmail = await db.query.salesMembers.findFirst({
          where: eq(salesMembers.email, data.user.email ?? ""),
        });

        if (byEmail && !byEmail.userId) {
          await db
            .update(salesMembers)
            .set({ userId: data.user.id, updatedAt: new Date() })
            .where(eq(salesMembers.id, byEmail.id));
        }
      }
    } catch {
      // Non-critical
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
