import type { CommissionRule, ContractForCalc, CommissionDetail } from "@/types";

/**
 * 粗利歩合を計算する
 * 当月の契約粗利合計に対して、階段式のティアレートを適用
 */
export function calculateGrossProfitIncentive(
  contracts: readonly ContractForCalc[],
  rules: readonly CommissionRule[]
): { total: number; details: CommissionDetail[] } {
  const grossProfitRules = rules
    .filter((r) => r.type === "gross_profit")
    .sort((a, b) => a.tierMin - b.tierMin);

  if (grossProfitRules.length === 0) {
    return { total: 0, details: [] };
  }

  const activeContracts = contracts.filter((c) => c.status !== "cancelled");
  const totalGrossProfit = activeContracts.reduce(
    (sum, c) => sum + c.grossProfit,
    0
  );

  let incentive = 0;
  let remaining = totalGrossProfit;

  for (const rule of grossProfitRules) {
    if (remaining <= 0) break;

    const tierMax = rule.tierMax ?? Infinity;
    const tierRange = tierMax - rule.tierMin;
    const applicableAmount = Math.min(remaining, tierRange);

    if (applicableAmount > 0) {
      incentive += applicableAmount * rule.rate + rule.flatBonus;
      remaining -= applicableAmount;
    }
  }

  const details: CommissionDetail[] = activeContracts
    .filter((c) => c.grossProfit > 0)
    .map((c) => ({
      contractId: c.id,
      commissionType: "gross_profit" as const,
      amount: totalGrossProfit > 0
        ? (c.grossProfit / totalGrossProfit) * incentive
        : 0,
      note: `粗利 ${c.grossProfit.toLocaleString()}円 (全体比 ${
        totalGrossProfit > 0
          ? ((c.grossProfit / totalGrossProfit) * 100).toFixed(1)
          : 0
      }%)`,
    }));

  return { total: Math.round(incentive), details };
}
