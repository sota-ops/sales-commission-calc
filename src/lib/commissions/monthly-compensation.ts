import type {
  CommissionRule,
  ContractForCalc,
  MemberForCalc,
  CompanyProfitForCalc,
  MonthlyCompensationResult,
} from "@/types";
import { calculateGrossProfitIncentive } from "./gross-profit-incentive";
import { calculateStockIncentive } from "./stock-incentive";
import { calculateCrossSellBonus } from "./cross-sell-bonus";
import { calculateCompanyProfitBonus } from "./company-profit-bonus";
import { calculateRanking } from "./ranking";

/**
 * 月次報酬を一括計算するオーケストレーター
 * 全メンバーの報酬を計算し、ランキングを付与して返す
 */
export function calculateMonthlyCompensation(params: {
  readonly yearMonth: string;
  readonly members: readonly MemberForCalc[];
  readonly contracts: readonly ContractForCalc[];
  readonly rules: readonly CommissionRule[];
  readonly companyProfit: CompanyProfitForCalc | null;
}): MonthlyCompensationResult[] {
  const { yearMonth, members, contracts, rules, companyProfit } = params;

  // 会社利益ボーナスは全メンバー共通
  const companyBonus = calculateCompanyProfitBonus(
    companyProfit,
    members,
    rules
  );

  const results: MonthlyCompensationResult[] = members.map((member) => {
    // メンバーの契約を抽出
    const memberContracts = contracts.filter(
      (c) => c.memberId === member.id
    );

    // 各種インセンティブ計算
    const grossProfit = calculateGrossProfitIncentive(memberContracts, rules);
    const stock = calculateStockIncentive(memberContracts, rules);
    const crossSell = calculateCrossSellBonus(memberContracts, rules);
    const memberCompanyBonus = companyBonus.perMember.get(member.id) ?? 0;

    const totalCompensation =
      member.baseSalary +
      grossProfit.total +
      stock.total +
      crossSell.total +
      memberCompanyBonus;

    return {
      memberId: member.id,
      memberName: member.name,
      yearMonth,
      baseSalary: member.baseSalary,
      grossProfitIncentive: grossProfit.total,
      stockIncentive: stock.total,
      crossSellBonus: crossSell.total,
      companyProfitBonus: memberCompanyBonus,
      totalCompensation: Math.round(totalCompensation),
      details: [
        ...grossProfit.details,
        ...stock.details,
        ...crossSell.details,
      ],
    };
  });

  return calculateRanking(results);
}
