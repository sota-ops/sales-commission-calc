import { NextResponse } from "next/server";
import { getInvitationByToken } from "@/actions/invitations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "招待が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        team: invitation.team,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
