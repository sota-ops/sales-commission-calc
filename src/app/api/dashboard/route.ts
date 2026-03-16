import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesMembers, contracts, monthlyCommissions } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";

function getStartMonth(period: string): string {
  const now = new Date();
  let monthsBack = 1;
  switch (period) {
    case "1m":
      monthsBack = 1;
      break;
    case "3m":
      monthsBack = 3;
      break;
    case "6m":
      monthsBack = 6;
      break;
    case "1y":
      monthsBack = 12;
      break;
    default:
      monthsBack = 1;
  }

  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getContractStartDate(period: string): string {
  const now = new Date();
  let monthsBack = 1;
  switch (period) {
    case "1m":
      monthsBack = 1;
      break;
    case "3m":
      monthsBack = 3;
      break;
    case "6m":
      monthsBack = 6;
      break;
    case "1y":
      monthsBack = 12;
      break;
    default:
      monthsBack = 1;
  }
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  return start.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "1m";

    const startMonth = getStartMonth(period);
    const contractStart = getContractStartDate(period);

    const members = await db.query.salesMembers.findMany({
      where: eq(salesMembers.isActive, true),
    });

    const activeContracts = await db.query.contracts.findMany({
      where: eq(contracts.status, "active"),
    });

    // Filter contracts by period for ranking
    const periodContracts = activeContracts.filter(
      (c) => c.contractDate >= contractStart
    );

    const periodCommissions = await db.query.monthlyCommissions.findMany({
      where: gte(monthlyCommissions.yearMonth, startMonth),
      orderBy: [desc(monthlyCommissions.yearMonth)],
    });

    // Group by month for trend
    const monthMap = new Map<string, number>();
    for (const c of periodCommissions) {
      const current = monthMap.get(c.yearMonth) ?? 0;
      monthMap.set(c.yearMonth, current + Number(c.totalCompensation));
    }

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    // Breakdown aggregated over the period
    const breakdown = {
      grossProfit: periodCommissions.reduce(
        (s, c) => s + Number(c.grossProfitIncentive),
        0
      ),
      stock: periodCommissions.reduce(
        (s, c) => s + Number(c.stockIncentive),
        0
      ),
      crossSell: periodCommissions.reduce(
        (s, c) => s + Number(c.crossSellBonus),
        0
      ),
      companyProfit: periodCommissions.reduce(
        (s, c) => s + Number(c.companyProfitBonus),
        0
      ),
    };

    const commissionBreakdown = [
      { name: "粗利歩合", value: breakdown.grossProfit },
      { name: "ストック歩合", value: breakdown.stock },
      { name: "クロスセル", value: breakdown.crossSell },
      { name: "会社利益", value: breakdown.companyProfit },
    ].filter((b) => b.value > 0);

    const totalCommissions = periodCommissions.reduce(
      (s, c) => s + Number(c.totalCompensation),
      0
    );

    // Per-member ranking — use period contracts for sales/profit, period commissions for commission
    const memberRanking = members.map((member) => {
      const memberContracts = periodContracts.filter(
        (c) => c.memberId === member.id
      );
      const totalSales = memberContracts.reduce(
        (s, c) => s + Number(c.monthlyAmount),
        0
      );
      const totalProfit = memberContracts.reduce(
        (s, c) => s + Number(c.grossProfit),
        0
      );
      const contractCount = memberContracts.length;

      const memberCommissions = periodCommissions.filter(
        (c) => c.memberId === member.id
      );
      const commission = memberCommissions.reduce(
        (s, c) => s + Number(c.totalCompensation),
        0
      );

      // Use latest month rank for display
      const latestComm = memberCommissions[0];
      const rank = latestComm?.rank ?? null;

      return {
        id: member.id,
        name: member.name,
        totalSales,
        totalProfit,
        contractCount,
        commission,
        rank,
      };
    });

    memberRanking.sort((a, b) => b.commission - a.commission);

    // Count contracts in period
    const periodContractCount = periodContracts.length;

    return NextResponse.json({
      success: true,
      data: {
        memberCount: members.length,
        contractCount: periodContractCount,
        totalCommissions,
        averageCompensation:
          members.length > 0
            ? Math.round(totalCommissions / members.length)
            : 0,
        monthlyTrend,
        commissionBreakdown,
        memberRanking,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        data: {
          memberCount: 0,
          contractCount: 0,
          totalCommissions: 0,
          averageCompensation: 0,
          monthlyTrend: [],
          commissionBreakdown: [],
          memberRanking: [],
        },
      },
      { status: 200 }
    );
  }
}
