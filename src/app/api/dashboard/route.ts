import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salesMembers, contracts, monthlyCommissions } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const members = await db.query.salesMembers.findMany({
      where: eq(salesMembers.isActive, true),
    });

    const activeContracts = await db.query.contracts.findMany({
      where: eq(contracts.status, "active"),
    });

    const recentCommissions = await db.query.monthlyCommissions.findMany({
      orderBy: [desc(monthlyCommissions.yearMonth)],
    });

    // Group by month for trend
    const monthMap = new Map<string, number>();
    for (const c of recentCommissions) {
      const current = monthMap.get(c.yearMonth) ?? 0;
      monthMap.set(c.yearMonth, current + Number(c.totalCompensation));
    }

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }));

    // Breakdown from latest month
    const latestMonth = monthlyTrend.at(-1)?.month;
    const latestCommissions = latestMonth
      ? recentCommissions.filter((c) => c.yearMonth === latestMonth)
      : [];

    const breakdown = {
      grossProfit: latestCommissions.reduce(
        (s, c) => s + Number(c.grossProfitIncentive),
        0
      ),
      stock: latestCommissions.reduce(
        (s, c) => s + Number(c.stockIncentive),
        0
      ),
      crossSell: latestCommissions.reduce(
        (s, c) => s + Number(c.crossSellBonus),
        0
      ),
      companyProfit: latestCommissions.reduce(
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

    const totalCommissions = monthlyTrend.reduce((s, m) => s + m.total, 0);

    return NextResponse.json({
      success: true,
      data: {
        memberCount: members.length,
        contractCount: activeContracts.length,
        totalCommissions,
        averageCompensation:
          members.length > 0
            ? Math.round(totalCommissions / members.length)
            : 0,
        monthlyTrend,
        commissionBreakdown,
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
        },
      },
      { status: 200 }
    );
  }
}
