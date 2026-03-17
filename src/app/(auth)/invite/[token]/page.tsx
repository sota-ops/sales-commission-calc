"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<{
    email: string;
    role: { displayName: string };
    team: { name: string } | null;
    status: string;
    expiresAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvitation(data.data);
        } else {
          setError(data.error ?? "招待が見つかりません");
        }
      })
      .catch(() => setError("エラーが発生しました"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError("");

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error ?? "エラーが発生しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>招待エラー</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>この招待は無効です</CardTitle>
            <CardDescription>
              既に使用済み、またはキャンセルされています。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Calculator className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            招待を承認
          </CardTitle>
          <CardDescription>
            <span className="font-medium">{invitation.email}</span> 宛の招待です。
            <br />
            ロール: <span className="font-medium">{invitation.role.displayName}</span>
            {invitation.team && (
              <>
                <br />チーム: <span className="font-medium">{invitation.team.name}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "登録中..." : "アカウント作成して参加"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
