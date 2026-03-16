"use server";

import { db } from "@/lib/db";
import { monthlyCommissions, monthlyCommissionDetails, contracts, salesMembers, commissionRules, companyProfitMonthly, products } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { calculateMonthlyCompensation } from "@/lib/commissions";
import type { ContractForCalc, MemberForCalc, CommissionRule, CompanyProfitForCalc } from "@/types";
import { revalidatePath } from "next/cache";

export async function runMonthlyCalculation(yearMonth: string) {
  // Fetch all active members
  const members = await db.query.salesMembers.findMany({
    where: eq(salesMembers.isActive, true),
  });

  // Fetch contracts for this month (by contract date prefix or active recurring)
  const allContracts = await db.query.contracts.findMany({
    with: { product: true },
  });

  const monthContracts = allContracts.filter((c) => {
    if (c.status === "cancelled") return false;
    // New contracts this month
    if (c.contractDate.startsWith(yearMonth)) return true;
    // Active recurring contracts
    if (c.product.isRecurring && c.status === "active" && c.contractDate <= `${yearMonth}-31`) return true;
    return false;
  });

  // Fetch rules
  const rules = await db.query.commissionRules.findMany({
    where: eq(commissionRules.isActive, true),
  });

  // Fetch company profit
  const companyProfit = await db.query.companyProfitMonthly.findFirst({
    where: eq(companyProfitMonthly.yearMonth, yearMonth),
  });

  // Convert to calc types
  const membersForCalc: MemberForCalc[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    baseSalary: Number(m.baseSalary),
    teamId: m.teamId,
  }));

  const contractsForCalc: ContractForCalc[] = monthContracts.map((c) => ({
    id: c.id,
    memberId: c.memberId,
    customerId: c.customerId,
    productId: c.productId,
    status: c.status,
    contractDate: c.contractDate,
    monthlyAmount: Number(c.monthlyAmount),
    grossProfit: Number(c.grossProfit),
    isCrossSell: c.isCrossSell,
    isRecurring: c.product.isRecurring,
  }));

  const rulesForCalc: CommissionRule[] = rules.map((r) => ({
    type: r.type,
    tierMin: Number(r.tierMin),
    tierMax: r.tierMax ? Number(r.tierMax) : null,
    rate: Number(r.rate),
    flatBonus: Number(r.flatBonus),
  }));

  const companyProfitForCalc: CompanyProfitForCalc | null = companyProfit
    ? {
        yearMonth: companyProfit.yearMonth,
        totalRevenue: Number(companyProfit.totalRevenue),
        totalCost: Number(companyProfit.totalCost),
        netProfit: Number(companyProfit.netProfit),
      }
    : null;

  // Run calculation
  const results = calculateMonthlyCompensation({
    yearMonth,
    members: membersForCalc,
    contracts: contractsForCalc,
    rules: rulesForCalc,
    companyProfit: companyProfitForCalc,
  });

  // Delete existing records for this month
  const existing = await db.query.monthlyCommissions.findMany({
    where: eq(monthlyCommissions.yearMonth, yearMonth),
  });
  for (const e of existing) {
    await db.delete(monthlyCommissionDetails).where(
      eq(monthlyCommissionDetails.monthlyCommissionId, e.id)
    );
  }
  if (existing.length > 0) {
    await db.delete(monthlyCommissions).where(
      eq(monthlyCommissions.yearMonth, yearMonth)
    );
  }

  // Insert new records
  for (const result of results) {
    const [inserted] = await db
      .insert(monthlyCommissions)
      .values({
        memberId: result.memberId,
        yearMonth: result.yearMonth,
        baseSalary: String(result.baseSalary),
        grossProfitIncentive: String(result.grossProfitIncentive),
        stockIncentive: String(result.stockIncentive),
        crossSellBonus: String(result.crossSellBonus),
        companyProfitBonus: String(result.companyProfitBonus),
        totalCompensation: String(result.totalCompensation),
        rank: result.rank ?? null,
      })
      .returning();

    for (const detail of result.details) {
      await db.insert(monthlyCommissionDetails).values({
        monthlyCommissionId: inserted.id,
        contractId: detail.contractId,
        commissionType: detail.commissionType,
        amount: String(detail.amount),
        note: detail.note,
      });
    }
  }

  revalidatePath("/commissions");
  return results;
}

export async function getMonthlyCommissions(yearMonth: string) {
  return db.query.monthlyCommissions.findMany({
    where: eq(monthlyCommissions.yearMonth, yearMonth),
    with: { member: true, details: true },
    orderBy: (mc, { asc }) => [asc(mc.rank)],
  });
}
