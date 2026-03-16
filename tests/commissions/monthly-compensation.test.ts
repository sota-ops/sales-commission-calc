import { describe, it, expect } from "vitest";
import { calculateMonthlyCompensation } from "@/lib/commissions/monthly-compensation";
import type {
  CommissionRule,
  ContractForCalc,
  MemberForCalc,
  CompanyProfitForCalc,
} from "@/types";

const rules: CommissionRule[] = [
  { type: "gross_profit", tierMin: 0, tierMax: 100000, rate: 0.05, flatBonus: 0 },
  { type: "gross_profit", tierMin: 100000, tierMax: null, rate: 0.1, flatBonus: 0 },
  { type: "stock", tierMin: 0, tierMax: null, rate: 0.03, flatBonus: 0 },
  { type: "cross_sell", tierMin: 0, tierMax: null, rate: 0.05, flatBonus: 5000 },
  { type: "company_profit", tierMin: 0, tierMax: null, rate: 0.02, flatBonus: 0 },
];

const members: MemberForCalc[] = [
  { id: "m1", name: "田中太郎", baseSalary: 300000, teamId: "t1" },
  { id: "m2", name: "鈴木花子", baseSalary: 250000, teamId: "t1" },
];

const contracts: ContractForCalc[] = [
  {
    id: "c1", memberId: "m1", customerId: "cust1", productId: "p1",
    status: "active", contractDate: "2026-03-01",
    monthlyAmount: 100000, grossProfit: 200000,
    isCrossSell: false, isRecurring: false,
  },
  {
    id: "c2", memberId: "m1", customerId: "cust2", productId: "p2",
    status: "active", contractDate: "2026-01-01",
    monthlyAmount: 80000, grossProfit: 30000,
    isCrossSell: false, isRecurring: true,
  },
  {
    id: "c3", memberId: "m2", customerId: "cust1", productId: "p3",
    status: "active", contractDate: "2026-03-10",
    monthlyAmount: 50000, grossProfit: 120000,
    isCrossSell: true, isRecurring: false,
  },
];

const companyProfit: CompanyProfitForCalc = {
  yearMonth: "2026-03",
  totalRevenue: 5000000,
  totalCost: 3000000,
  netProfit: 2000000,
};

describe("calculateMonthlyCompensation (integration)", () => {
  it("should calculate all compensation components for each member", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts,
      rules,
      companyProfit,
    });

    expect(results).toHaveLength(2);

    // All results should have the yearMonth
    for (const r of results) {
      expect(r.yearMonth).toBe("2026-03");
    }
  });

  it("should assign ranks correctly", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts,
      rules,
      companyProfit,
    });

    // Results are sorted by totalCompensation desc
    expect(results[0].totalCompensation).toBeGreaterThanOrEqual(
      results[1].totalCompensation
    );
    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);
  });

  it("should calculate Tanaka (m1) correctly", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts,
      rules,
      companyProfit,
    });

    const tanaka = results.find((r) => r.memberId === "m1")!;
    expect(tanaka.baseSalary).toBe(300000);

    // Gross profit: 200,000 + 30,000 = 230,000
    // Tier 1: 100,000 * 0.05 = 5,000
    // Tier 2: 130,000 * 0.10 = 13,000
    // Total gross profit incentive: 18,000
    expect(tanaka.grossProfitIncentive).toBe(18000);

    // Stock: 80,000 (recurring) * 0.03 = 2,400
    expect(tanaka.stockIncentive).toBe(2400);

    // No cross-sell
    expect(tanaka.crossSellBonus).toBe(0);

    // Company profit: 2,000,000 * 0.02 = 40,000 / 2 members = 20,000
    expect(tanaka.companyProfitBonus).toBe(20000);

    // Total: 300,000 + 18,000 + 2,400 + 0 + 20,000 = 340,400
    expect(tanaka.totalCompensation).toBe(340400);
  });

  it("should calculate Suzuki (m2) with cross-sell bonus", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts,
      rules,
      companyProfit,
    });

    const suzuki = results.find((r) => r.memberId === "m2")!;
    expect(suzuki.baseSalary).toBe(250000);

    // Gross profit: 120,000
    // Tier 1: 100,000 * 0.05 = 5,000
    // Tier 2: 20,000 * 0.10 = 2,000
    // Total: 7,000
    expect(suzuki.grossProfitIncentive).toBe(7000);

    // No recurring contracts
    expect(suzuki.stockIncentive).toBe(0);

    // Cross-sell: 120,000 * 0.05 + 5,000 = 11,000
    expect(suzuki.crossSellBonus).toBe(11000);

    // Company profit: 20,000 (same as Tanaka)
    expect(suzuki.companyProfitBonus).toBe(20000);

    // Total: 250,000 + 7,000 + 0 + 11,000 + 20,000 = 288,000
    expect(suzuki.totalCompensation).toBe(288000);
  });

  it("should handle missing company profit", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts,
      rules,
      companyProfit: null,
    });

    for (const r of results) {
      expect(r.companyProfitBonus).toBe(0);
    }
  });

  it("should handle empty contracts", () => {
    const results = calculateMonthlyCompensation({
      yearMonth: "2026-03",
      members,
      contracts: [],
      rules,
      companyProfit,
    });

    const tanaka = results.find((r) => r.memberId === "m1")!;
    expect(tanaka.grossProfitIncentive).toBe(0);
    expect(tanaka.stockIncentive).toBe(0);
    expect(tanaka.crossSellBonus).toBe(0);
    // Company profit bonus still applies
    expect(tanaka.companyProfitBonus).toBe(20000);
    expect(tanaka.totalCompensation).toBe(320000);
  });
});
