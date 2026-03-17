import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvitationByToken, acceptInvitation } from "@/actions/invitations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { password } = await request.json();

    const invitation = await getInvitationByToken(token);
    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "無効な招待です" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "招待の有効期限が切れています" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try to sign up the user
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: invitation.email,
        password,
      });

    if (signUpError) {
      // If user already exists, try to sign in
      if (signUpError.message.includes("already registered")) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: invitation.email,
            password,
          });

        if (signInError) {
          return NextResponse.json(
            { success: false, error: "ログインに失敗しました。パスワードを確認してください。" },
            { status: 400 }
          );
        }

        await acceptInvitation(token, signInData.user.id);
      } else {
        return NextResponse.json(
          { success: false, error: signUpError.message },
          { status: 400 }
        );
      }
    } else if (signUpData.user) {
      await acceptInvitation(token, signUpData.user.id);

      // Auto sign-in after signup
      await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "エラーが発生しました";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
