export const dynamic = "force-dynamic";

import { getCommissionRules } from "@/actions/commission-rules";
import { getCompanyProfits } from "@/actions/company-profit";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [rules, profits] = await Promise.all([
    getCommissionRules(),
    getCompanyProfits(),
  ]);
  return <SettingsClient rules={rules} profits={profits} />;
}
