import type {
  CommissionRule,
  CompanyProfitForCalc,
  MemberForCalc,
} from "@/types";

/**
 * 会社利益ボーナスを計算する
 * 会社全体の月次利益に基づいて、全メンバーに均等配分
 */
export function calculateCompanyProfitBonus(
  companyProfit: CompanyProfitForCalc | null,
  members: readonly MemberForCalc[],
  rules: readonly CommissionRule[]
): { total: number; perMember: Map<string, number> } {
  const companyProfitRules = rules
    .filter((r) => r.type === "company_profit")
    .sort((a, b) => a.tierMin - b.tierMin);

  if (!companyProfit || companyProfitRules.length === 0 || members.length === 0) {
    return { total: 0, perMember: new Map() };
  }

  const netProfit = companyProfit.netProfit;
  if (netProfit <= 0) {
    return { total: 0, perMember: new Map() };
  }

  let bonusPool = 0;
  let remaining = netProfit;

  for (const rule of companyProfitRules) {
    if (remaining <= 0) break;

    const tierMax = rule.tierMax ?? Infinity;
    const tierRange = tierMax - rule.tierMin;
    const applicableAmount = Math.min(remaining, tierRange);

    if (applicableAmount > 0) {
      bonusPool += applicableAmount * rule.rate + rule.flatBonus;
      remaining -= applicableAmount;
    }
  }

  const perMemberBonus = Math.round(bonusPool / members.length);
  const perMember = new Map<string, number>();

  for (const member of members) {
    perMember.set(member.id, perMemberBonus);
  }

  return { total: Math.round(bonusPool), perMember };
}
