"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <User className="h-3 w-3 text-primary-foreground" />
        </div>
        <span>{email}</span>
      </div>
      <form action={signOut}>
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-1 h-4 w-4" />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
