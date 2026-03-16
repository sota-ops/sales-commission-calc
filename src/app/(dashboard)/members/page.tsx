export const dynamic = "force-dynamic";

import { getMembers } from "@/actions/members";
import { getTeams } from "@/actions/teams";
import { MembersClient } from "./members-client";

export default async function MembersPage() {
  const [members, teams] = await Promise.all([getMembers(), getTeams()]);
  return <MembersClient members={members} teams={teams} />;
}
