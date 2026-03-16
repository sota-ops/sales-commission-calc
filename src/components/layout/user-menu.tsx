"use client";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0176D3] to-[#9B59B6]">
          <User className="h-3 w-3 text-white" />
        </div>
        <span>{email}</span>
      </div>
      <form action={signOut}>
        <Button
          variant="ghost"
          size="sm"
          type="submit"
          className="text-muted-foreground transition-all duration-200 hover:text-[#1B96FF] hover:bg-[#0176D3]/10"
        >
          <LogOut className="mr-1 h-4 w-4" />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
