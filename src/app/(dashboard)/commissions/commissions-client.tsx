"use client";

import { useState } from "react";
import { runMonthlyCalculation, getMonthlyCommissionsRange } from "@/actions/commissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Download, Trophy } from "lucide-react";
import { toast } from "sonner";

type AggregatedResult = {
  memberId: string;
  memberName: string;
  baseSalary: number;
  grossProfitIncentive: number;
  stockIncentive: number;
  crossSellBonus: number;
  companyProfitBonus: number;
  totalCompensation: number;
  rank?: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

export function CommissionsClient() {
  const [fromMonth, setFromMonth] = useState(getCurrentYearMonth());
  const [toMonth, setToMonth] = useState(getCurrentYearMonth());
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleCalculate() {
    setLoading(true);
    try {
      const months = getMonthsBetween(fromMonth, toMonth);
      for (const ym of months) {
        await runMonthlyCalculation(ym);
      }
      await handleLoad();
      const label = fromMonth === toMonth ? fromMonth : `${fromMonth} 〜 ${toMonth}`;
      toast.success(`${label} の報酬計算が完了しました`);
    } catch (error) {
      toast.error("計算中にエラーが発生しました");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad() {
    try {
      const data = await getMonthlyCommissionsRange(fromMonth, toMonth);
      // Aggregate by member
      const memberMap = new Map<string, AggregatedResult>();
      for (const d of data) {
        const existing = memberMap.get(d.memberId);
        if (existing) {
          memberMap.set(d.memberId, {
            ...existing,
            baseSalary: existing.baseSalary + Number(d.baseSalary),
            grossProfitIncentive: existing.grossProfitIncentive + Number(d.grossProfitIncentive),
            stockIncentive: existing.stockIncentive + Number(d.stockIncentive),
            crossSellBonus: existing.crossSellBonus + Number(d.crossSellBonus),
            companyProfitBonus: existing.companyProfitBonus + Number(d.companyProfitBonus),
            totalCompensation: existing.totalCompensation + Number(d.totalCompensation),
          });
        } else {
          memberMap.set(d.memberId, {
            memberId: d.memberId,
            memberName: d.member.name,
            baseSalary: Number(d.baseSalary),
            grossProfitIncentive: Number(d.grossProfitIncentive),
            stockIncentive: Number(d.stockIncentive),
            crossSellBonus: Number(d.crossSellBonus),
            companyProfitBonus: Number(d.companyProfitBonus),
            totalCompensation: Number(d.totalCompensation),
          });
        }
      }
      const aggregated = Array.from(memberMap.values())
        .sort((a, b) => b.totalCompensation - a.totalCompensation)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      setResults(aggregated);
    } catch {
      // No data
    }
  }

  function handleExportCSV() {
    if (results.length === 0) return;

    const headers = [
      "順位",
      "名前",
      "固定給",
      "粗利歩合",
      "ストック歩合",
      "クロスセルボーナス",
      "会社利益ボーナス",
      "合計報酬",
    ];

    const rows = results.map((r) => [
      r.rank ?? "",
      r.memberName,
      r.baseSalary,
      r.grossProfitIncentive,
      r.stockIncentive,
      r.crossSellBonus,
      r.companyProfitBonus,
      r.totalCompensation,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = fromMonth === toMonth ? fromMonth : `${fromMonth}_${toMonth}`;
    a.download = `commissions-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAll = results.reduce((sum, r) => sum + r.totalCompensation, 0);
  const rangeLabel = fromMonth === toMonth ? fromMonth : `${fromMonth} 〜 ${toMonth}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">報酬計算</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>対象月</Label>
            <Input
              type="month"
              value={fromMonth}
              onChange={(e) => {
                setFromMonth(e.target.value);
                if (e.target.value > toMonth) setToMonth(e.target.value);
              }}
              className="w-[160px]"
            />
            <span className="text-sm text-muted-foreground">〜</span>
            <Input
              type="month"
              value={toMonth}
              onChange={(e) => {
                setToMonth(e.target.value);
                if (e.target.value < fromMonth) setFromMonth(e.target.value);
              }}
              className="w-[160px]"
            />
          </div>
          <Button onClick={handleLoad} variant="outline">
            読込
          </Button>
          <Button onClick={handleCalculate} disabled={loading}>
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? "計算中..." : "計算実行"}
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={results.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {rangeLabel} 報酬サマリー
              </CardTitle>
              <CardDescription>
                対象メンバー: {results.length}名 / 報酬合計:{" "}
                {formatCurrency(totalAll)}
              </CardDescription>
            </CardHeader>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">順位</TableHead>
                <TableHead>名前</TableHead>
                <TableHead className="text-right">固定給</TableHead>
                <TableHead className="text-right">粗利歩合</TableHead>
                <TableHead className="text-right">ストック歩合</TableHead>
                <TableHead className="text-right">XSボーナス</TableHead>
                <TableHead className="text-right">会社利益</TableHead>
                <TableHead className="text-right">合計報酬</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.memberId}>
                  <TableCell>
                    {r.rank === 1 ? (
                      <Badge className="bg-yellow-500">
                        <Trophy className="mr-1 h-3 w-3" />1
                      </Badge>
                    ) : r.rank === 2 ? (
                      <Badge className="bg-gray-400">2</Badge>
                    ) : r.rank === 3 ? (
                      <Badge className="bg-amber-700">3</Badge>
                    ) : (
                      r.rank
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.memberName}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.baseSalary)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.grossProfitIncentive)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.stockIncentive)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.crossSellBonus)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.companyProfitBonus)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(r.totalCompensation)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {results.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            対象月を選択して「計算実行」または「読込」を押してください
          </CardContent>
        </Card>
      )}
    </div>
  );
}
