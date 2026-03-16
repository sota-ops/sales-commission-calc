"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>{email}</span>
      </div>
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="mr-1 h-4 w-4" />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
