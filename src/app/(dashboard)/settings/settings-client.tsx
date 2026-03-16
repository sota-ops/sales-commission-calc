"use client";

import { useState } from "react";
import {
  createCommissionRule,
  deleteCommissionRule,
} from "@/actions/commission-rules";
import { upsertCompanyProfit } from "@/actions/company-profit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Rule = {
  id: string;
  title: string | null;
  type: "gross_profit" | "stock" | "cross_sell" | "company_profit";
  tierMin: string;
  tierMax: string | null;
  rate: string;
  flatBonus: string;
  description: string | null;
  isActive: boolean;
};

type Profit = {
  id: string;
  yearMonth: string;
  totalRevenue: string;
  totalCost: string;
  netProfit: string;
};

const typeLabels: Record<string, string> = {
  gross_profit: "粗利歩合",
  stock: "ストック歩合",
  cross_sell: "クロスセル",
  company_profit: "会社利益",
};

export function SettingsClient({
  rules,
  profits,
}: {
  rules: Rule[];
  profits: Profit[];
}) {
  const [ruleOpen, setRuleOpen] = useState(false);

  async function handleAddRule(formData: FormData) {
    try {
      await createCommissionRule(formData);
      toast.success("ルールを追加しました");
      setRuleOpen(false);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm("このルールを無効にしますか？")) return;
    try {
      await deleteCommissionRule(id);
      toast.success("ルールを無効にしました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleUpsertProfit(formData: FormData) {
    try {
      await upsertCompanyProfit(formData);
      toast.success("会社利益を登録しました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  const activeRules = rules.filter((r) => r.isActive);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">設定</h2>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">歩合ルール</TabsTrigger>
          <TabsTrigger value="profit">会社利益</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {!ruleOpen ? (
            <Button onClick={() => setRuleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              ルール追加
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>新規ルール</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleAddRule} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>タイトル</Label>
                      <Input name="title" placeholder="ルール名" />
                    </div>
                    <div className="space-y-2">
                      <Label>タイプ</Label>
                      <Select name="type" defaultValue="gross_profit">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gross_profit">粗利歩合</SelectItem>
                          <SelectItem value="stock">ストック歩合</SelectItem>
                          <SelectItem value="cross_sell">クロスセル</SelectItem>
                          <SelectItem value="company_profit">会社利益</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>レート</Label>
                      <Input
                        name="rate"
                        type="number"
                        step="0.0001"
                        placeholder="0.10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ティア下限</Label>
                      <Input
                        name="tierMin"
                        type="number"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ティア上限</Label>
                      <Input name="tierMax" type="number" placeholder="上限なし" />
                    </div>
                    <div className="space-y-2">
                      <Label>固定ボーナス</Label>
                      <Input
                        name="flatBonus"
                        type="number"
                        defaultValue="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>説明</Label>
                    <Input name="description" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">追加</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRuleOpen(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>ティア範囲</TableHead>
                <TableHead>レート</TableHead>
                <TableHead>固定ボーナス</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="w-[60px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.title ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge>{typeLabels[rule.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    {Number(rule.tierMin).toLocaleString()} ~{" "}
                    {rule.tierMax
                      ? Number(rule.tierMax).toLocaleString()
                      : "上限なし"}
                  </TableCell>
                  <TableCell>
                    {(Number(rule.rate) * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    {Number(rule.flatBonus).toLocaleString()}円
                  </TableCell>
                  <TableCell>{rule.description ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {activeRules.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    ルールがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>会社利益登録</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleUpsertProfit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>対象月</Label>
                    <Input
                      name="yearMonth"
                      type="month"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>売上</Label>
                    <Input
                      name="totalRevenue"
                      type="number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>経費</Label>
                    <Input
                      name="totalCost"
                      type="number"
                      required
                    />
                  </div>
                </div>
                <Button type="submit">登録</Button>
              </form>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>対象月</TableHead>
                <TableHead className="text-right">売上</TableHead>
                <TableHead className="text-right">経費</TableHead>
                <TableHead className="text-right">純利益</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profits.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.yearMonth}</TableCell>
                  <TableCell className="text-right">
                    {Number(p.totalRevenue).toLocaleString()}円
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(p.totalCost).toLocaleString()}円
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {Number(p.netProfit).toLocaleString()}円
                  </TableCell>
                </TableRow>
              ))}
              {profits.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
