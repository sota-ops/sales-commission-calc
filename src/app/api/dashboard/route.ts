import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesMembers, contracts, monthlyCommissions } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const from = searchParams.get("from") ?? defaultYearMonth;
    const to = searchParams.get("to") ?? defaultYearMonth;

    const members = await db.query.salesMembers.findMany({
      where: eq(salesMembers.isActive, true),
    });

    const activeContracts = await db.query.contracts.findMany({
      where: eq(contracts.status, "active"),
    });

    // Filter contracts within the date range (by contract_date month)
    const rangeContracts = activeContracts.filter((c) => {
      const contractMonth = c.contractDate.slice(0, 7);
      return contractMonth >= from && contractMonth <= to;
    });

    // Get commissions within range
    const rangeCommissions = await db.query.monthlyCommissions.findMany({
      where: and(
        gte(monthlyCommissions.yearMonth, from),
        lte(monthlyCommissions.yearMonth, to)
      ),
      orderBy: [desc(monthlyCommissions.yearMonth)],
    });

    // Group by month for trend
    const monthMap = new Map<string, number>();
    for (const c of rangeCommissions) {
      const current = monthMap.get(c.yearMonth) ?? 0;
      monthMap.set(c.yearMonth, current + Number(c.totalCompensation));
    }

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));

    // Breakdown aggregated over range
    const breakdown = {
      grossProfit: rangeCommissions.reduce(
        (s, c) => s + Number(c.grossProfitIncentive),
        0
      ),
      stock: rangeCommissions.reduce(
        (s, c) => s + Number(c.stockIncentive),
        0
      ),
      crossSell: rangeCommissions.reduce(
        (s, c) => s + Number(c.crossSellBonus),
        0
      ),
      companyProfit: rangeCommissions.reduce(
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

    const totalCommissions = rangeCommissions.reduce(
      (s, c) => s + Number(c.totalCompensation),
      0
    );

    // Per-member ranking aggregated over range
    const memberRanking = members.map((member) => {
      const memberContracts = rangeContracts.filter(
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

      const memberComms = rangeCommissions.filter(
        (c) => c.memberId === member.id
      );
      const commission = memberComms.reduce(
        (s, c) => s + Number(c.totalCompensation),
        0
      );

      return {
        id: member.id,
        name: member.name,
        totalSales,
        totalProfit,
        contractCount,
        commission,
        rank: null as number | null,
      };
    });

    memberRanking.sort((a, b) => b.commission - a.commission);

    return NextResponse.json({
      success: true,
      data: {
        memberCount: members.length,
        contractCount: rangeContracts.length,
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
