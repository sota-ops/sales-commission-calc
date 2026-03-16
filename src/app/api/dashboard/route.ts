import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesMembers, contracts, monthlyCommissions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const yearMonth = searchParams.get("yearMonth") ?? defaultYearMonth;

    const members = await db.query.salesMembers.findMany({
      where: eq(salesMembers.isActive, true),
    });

    const activeContracts = await db.query.contracts.findMany({
      where: eq(contracts.status, "active"),
    });

    // Filter contracts by yearMonth (contract_date starts with yearMonth)
    const monthContracts = activeContracts.filter(
      (c) => c.contractDate.startsWith(yearMonth)
    );

    // Get commissions for the selected month
    const monthCommissions = await db.query.monthlyCommissions.findMany({
      where: eq(monthlyCommissions.yearMonth, yearMonth),
      orderBy: [desc(monthlyCommissions.totalCompensation)],
    });

    // Get all commissions for trend (last 6 months from selected month)
    const allCommissions = await db.query.monthlyCommissions.findMany({
      orderBy: [desc(monthlyCommissions.yearMonth)],
    });

    // Build 6-month trend ending at the selected month
    const monthMap = new Map<string, number>();
    for (const c of allCommissions) {
      if (c.yearMonth <= yearMonth) {
        const current = monthMap.get(c.yearMonth) ?? 0;
        monthMap.set(c.yearMonth, current + Number(c.totalCompensation));
      }
    }

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }));

    // Breakdown for selected month
    const breakdown = {
      grossProfit: monthCommissions.reduce(
        (s, c) => s + Number(c.grossProfitIncentive),
        0
      ),
      stock: monthCommissions.reduce(
        (s, c) => s + Number(c.stockIncentive),
        0
      ),
      crossSell: monthCommissions.reduce(
        (s, c) => s + Number(c.crossSellBonus),
        0
      ),
      companyProfit: monthCommissions.reduce(
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

    const totalCommissions = monthCommissions.reduce(
      (s, c) => s + Number(c.totalCompensation),
      0
    );

    // Per-member ranking for selected month
    const memberRanking = members.map((member) => {
      const memberContracts = monthContracts.filter(
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

      const memberComm = monthCommissions.find(
        (c) => c.memberId === member.id
      );
      const commission = memberComm
        ? Number(memberComm.totalCompensation)
        : 0;
      const rank = memberComm?.rank ?? null;

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

    return NextResponse.json({
      success: true,
      data: {
        memberCount: members.length,
        contractCount: monthContracts.length,
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
