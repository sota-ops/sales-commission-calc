export const dynamic = "force-dynamic";

import { getCommissionRules } from "@/actions/commission-rules";
import { getCompanyProfits } from "@/actions/company-profit";
import { getRoles } from "@/actions/roles";
import { getInvitations } from "@/actions/invitations";
import { getTeams } from "@/actions/teams";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [rules, profits, roles, invitations, teams] = await Promise.all([
    getCommissionRules(),
    getCompanyProfits(),
    getRoles(),
    getInvitations().catch(() => []),
    getTeams(),
  ]);
  return (
    <SettingsClient
      rules={rules}
      profits={profits}
      roles={roles}
      invitations={invitations}
      teams={teams}
    />
  );
}
