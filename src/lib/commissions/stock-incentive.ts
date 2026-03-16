import type { CommissionRule, ContractForCalc, CommissionDetail } from "@/types";

/**
 * ストック歩合を計算する
 * ストック型（継続課金）商品の月額合計に対してレートを適用
 */
export function calculateStockIncentive(
  contracts: readonly ContractForCalc[],
  rules: readonly CommissionRule[]
): { total: number; details: CommissionDetail[] } {
  const stockRules = rules
    .filter((r) => r.type === "stock")
    .sort((a, b) => a.tierMin - b.tierMin);

  if (stockRules.length === 0) {
    return { total: 0, details: [] };
  }

  const recurringContracts = contracts.filter(
    (c) => c.isRecurring && c.status === "active"
  );
  const totalMonthlyRecurring = recurringContracts.reduce(
    (sum, c) => sum + c.monthlyAmount,
    0
  );

  let incentive = 0;
  let remaining = totalMonthlyRecurring;

  for (const rule of stockRules) {
    if (remaining <= 0) break;

    const tierMax = rule.tierMax ?? Infinity;
    const tierRange = tierMax - rule.tierMin;
    const applicableAmount = Math.min(remaining, tierRange);

    if (applicableAmount > 0) {
      incentive += applicableAmount * rule.rate + rule.flatBonus;
      remaining -= applicableAmount;
    }
  }

  const details: CommissionDetail[] = recurringContracts.map((c) => ({
    contractId: c.id,
    commissionType: "stock" as const,
    amount: totalMonthlyRecurring > 0
      ? (c.monthlyAmount / totalMonthlyRecurring) * incentive
      : 0,
    note: `ストック月額 ${c.monthlyAmount.toLocaleString()}円`,
  }));

  return { total: Math.round(incentive), details };
}
