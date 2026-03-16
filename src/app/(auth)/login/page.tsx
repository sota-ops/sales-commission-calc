"use client";

import { useState } from "react";
import { signIn } from "@/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-mesh relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#0176D3]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#9B59B6]/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#06A59A]/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/50 glass-card rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0176D3] to-[#1B96FF] glow-blue animate-glow-pulse">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient-sf">
            営業報酬計算システム
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            ログインしてダッシュボードにアクセス
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                メールアドレス
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[#0176D3]/50 focus:ring-[#0176D3]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                パスワード
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-[#0176D3]/50 focus:ring-[#0176D3]/20"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#0176D3] to-[#1B96FF] text-white font-semibold transition-all duration-300 hover:from-[#015ba7] hover:to-[#0176D3] hover:glow-blue"
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/signup"
              className="font-medium text-[#1B96FF] underline underline-offset-4 transition-colors hover:text-[#0176D3]"
            >
              新規登録
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
