"use client";

import { useState } from "react";
import {
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
} from "@/actions/commission-rules";
import { upsertCompanyProfit } from "@/actions/company-profit";
import { createInvitation, cancelInvitation } from "@/actions/invitations";
import { updateRolePermissions } from "@/actions/roles";
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
import { Plus, Trash2, Pencil, Mail, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useHasPermission } from "@/components/providers/auth-provider";

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

type RolePermission = {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  scope: string;
};

type Role = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermission[];
};

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  createdAt: Date | string;
  role: { displayName: string } | null;
  team: { name: string } | null;
  inviter: { name: string } | null;
};

type Team = {
  id: string;
  name: string;
};

const typeLabels: Record<string, string> = {
  gross_profit: "粗利歩合",
  stock: "ストック歩合",
  cross_sell: "クロスセル",
  company_profit: "会社利益",
};

const RESOURCES = [
  { key: "dashboard", label: "ダッシュボード" },
  { key: "members", label: "メンバー" },
  { key: "salaries", label: "固定給" },
  { key: "customers", label: "顧客" },
  { key: "products", label: "商品" },
  { key: "contracts", label: "契約" },
  { key: "commissions", label: "報酬" },
  { key: "settings", label: "設定" },
  { key: "teams", label: "チーム" },
  { key: "roles", label: "ロール" },
  { key: "invitations", label: "招待" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;
const ACTION_LABELS: Record<string, string> = {
  view: "閲覧",
  create: "作成",
  edit: "編集",
  delete: "削除",
};

const statusLabels: Record<string, string> = {
  pending: "招待中",
  accepted: "承認済み",
  expired: "期限切れ",
  cancelled: "キャンセル",
};

const statusVariants: Record<string, "default" | "destructive" | "secondary"> = {
  pending: "default",
  accepted: "secondary",
  expired: "destructive",
  cancelled: "destructive",
};

function RuleForm({
  rule,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  rule?: Rule;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>タイトル</Label>
          <Input
            name="title"
            placeholder="ルール名"
            defaultValue={rule?.title ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>タイプ</Label>
          <Select name="type" defaultValue={rule?.type ?? "gross_profit"}>
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
            defaultValue={rule ? rule.rate : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>ティア下限</Label>
          <Input
            name="tierMin"
            type="number"
            defaultValue={rule ? rule.tierMin : "0"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>ティア上限</Label>
          <Input
            name="tierMax"
            type="number"
            placeholder="上限なし"
            defaultValue={rule?.tierMax ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>固定ボーナス</Label>
          <Input
            name="flatBonus"
            type="number"
            defaultValue={rule ? rule.flatBonus : "0"}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>説明</Label>
        <Input
          name="description"
          defaultValue={rule?.description ?? ""}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}

export function SettingsClient({
  rules,
  profits,
  roles,
  invitations,
  teams,
}: {
  rules: Rule[];
  profits: Profit[];
  roles: Role[];
  invitations: Invitation[];
  teams: Team[];
}) {
  const canEditSettings = useHasPermission("settings", "edit");
  const canManageRoles = useHasPermission("roles", "edit");
  const canInvite = useHasPermission("invitations", "create");

  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  async function handleAddRule(formData: FormData) {
    try {
      await createCommissionRule(formData);
      toast.success("ルールを追加しました");
      setRuleOpen(false);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleEditRule(formData: FormData) {
    if (!editingRule) return;
    try {
      await updateCommissionRule(editingRule.id, formData);
      toast.success("ルールを更新しました");
      setEditingRule(null);
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

  async function handleInvite(formData: FormData) {
    try {
      const result = await createInvitation(formData);
      const url = `${window.location.origin}/invite/${result.token}`;
      await navigator.clipboard.writeText(url);
      toast.success("招待リンクをコピーしました");
      setInviteOpen(false);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleCancelInvite(id: string) {
    try {
      await cancelInvitation(id);
      toast.success("招待をキャンセルしました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("招待リンクをコピーしました");
  }

  const activeRules = rules.filter((r) => r.isActive);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">設定</h2>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">歩合ルール</TabsTrigger>
          <TabsTrigger value="profit">会社利益</TabsTrigger>
          {canInvite && <TabsTrigger value="invitations">メンバー招待</TabsTrigger>}
          {canManageRoles && <TabsTrigger value="roles">ロール管理</TabsTrigger>}
        </TabsList>

        {/* 歩合ルール */}
        <TabsContent value="rules" className="space-y-4">
          {canEditSettings && !ruleOpen && !editingRule ? (
            <Button onClick={() => setRuleOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              ルール追加
            </Button>
          ) : ruleOpen ? (
            <Card>
              <CardHeader>
                <CardTitle>新規ルール</CardTitle>
              </CardHeader>
              <CardContent>
                <RuleForm
                  onSubmit={handleAddRule}
                  onCancel={() => setRuleOpen(false)}
                  submitLabel="追加"
                />
              </CardContent>
            </Card>
          ) : editingRule ? (
            <Card>
              <CardHeader>
                <CardTitle>ルール編集</CardTitle>
              </CardHeader>
              <CardContent>
                <RuleForm
                  rule={editingRule}
                  onSubmit={handleEditRule}
                  onCancel={() => setEditingRule(null)}
                  submitLabel="更新"
                />
              </CardContent>
            </Card>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>ティア範囲</TableHead>
                <TableHead>レート</TableHead>
                <TableHead>固定ボーナス</TableHead>
                <TableHead>説明</TableHead>
                {canEditSettings && (
                  <TableHead className="w-[100px]">操作</TableHead>
                )}
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
                  {canEditSettings && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleOpen(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {activeRules.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canEditSettings ? 7 : 6}
                    className="text-center text-muted-foreground"
                  >
                    ルールがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* 会社利益 */}
        <TabsContent value="profit" className="space-y-4">
          {canEditSettings && (
            <Card>
              <CardHeader>
                <CardTitle>会社利益登録</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleUpsertProfit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>対象月</Label>
                      <Input name="yearMonth" type="month" required />
                    </div>
                    <div className="space-y-2">
                      <Label>売上</Label>
                      <Input name="totalRevenue" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label>経費</Label>
                      <Input name="totalCost" type="number" required />
                    </div>
                  </div>
                  <Button type="submit">登録</Button>
                </form>
              </CardContent>
            </Card>
          )}

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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* メンバー招待 */}
        {canInvite && (
          <TabsContent value="invitations" className="space-y-4">
            {!inviteOpen ? (
              <Button onClick={() => setInviteOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                メンバーを招待
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>メンバー招待</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={handleInvite} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>名前</Label>
                        <Input name="memberName" required placeholder="田中太郎" />
                      </div>
                      <div className="space-y-2">
                        <Label>メールアドレス</Label>
                        <Input name="email" type="email" required placeholder="tanaka@example.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ロール</Label>
                        <Select name="roleId">
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>チーム（任意）</Label>
                        <Select name="teamId" defaultValue="">
                          <SelectTrigger>
                            <SelectValue placeholder="なし" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">なし</SelectItem>
                            {teams.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">
                        招待リンクを作成
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
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
                  <TableHead>メール</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>チーム</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>招待者</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{inv.role?.displayName ?? "-"}</TableCell>
                    <TableCell>{inv.team?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[inv.status] ?? "secondary"}>
                        {statusLabels[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{inv.inviter?.name ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {inv.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(inv.token)}
                              title="リンクをコピー"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelInvite(inv.id)}
                              title="キャンセル"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      招待がありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        )}

        {/* ロール管理 */}
        {canManageRoles && (
          <TabsContent value="roles" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              各ロールの権限を設定できます。スコープは「全て」「自分のみ」「チームのみ」から選択できます。
            </p>
            {roles.map((role) => (
              <RolePermissionEditor
                key={role.id}
                role={role}
                isEditing={editingRoleId === role.id}
                onStartEdit={() => setEditingRoleId(role.id)}
                onStopEdit={() => setEditingRoleId(null)}
              />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function RolePermissionEditor({
  role,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  role: Role;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [perms, setPerms] = useState(role.permissions);
  const [saving, setSaving] = useState(false);

  function hasPerm(resource: string, action: string): boolean {
    return perms.some((p) => p.resource === resource && p.action === action);
  }

  function getScope(resource: string, action: string): string {
    const p = perms.find((p) => p.resource === resource && p.action === action);
    return p?.scope ?? "all";
  }

  function togglePerm(resource: string, action: string) {
    if (hasPerm(resource, action)) {
      setPerms(perms.filter((p) => !(p.resource === resource && p.action === action)));
    } else {
      setPerms([...perms, { id: "", roleId: role.id, resource, action, scope: "all" }]);
    }
  }

  function setScope(resource: string, action: string, scope: string) {
    setPerms(
      perms.map((p) =>
        p.resource === resource && p.action === action
          ? { ...p, scope }
          : p
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateRolePermissions(
        role.id,
        perms.map((p) => ({
          resource: p.resource,
          action: p.action,
          scope: p.scope as "all" | "own" | "team",
        }))
      );
      toast.success("権限を更新しました");
      onStopEdit();
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {role.displayName}
          {role.isSystem && (
            <Badge variant="secondary" className="ml-2 text-xs">
              システム
            </Badge>
          )}
        </CardTitle>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onStartEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            編集
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="mr-1 h-3 w-3" />
              保存
            </Button>
            <Button variant="outline" size="sm" onClick={onStopEdit}>
              キャンセル
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">リソース</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-2 py-2 text-center font-medium text-muted-foreground">
                    {ACTION_LABELS[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((res) => (
                <tr key={res.key} className="border-b last:border-0">
                  <td className="px-2 py-2 font-medium">{res.label}</td>
                  {ACTIONS.map((action) => (
                    <td key={action} className="px-2 py-2 text-center">
                      {isEditing ? (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            checked={hasPerm(res.key, action)}
                            onChange={() => togglePerm(res.key, action)}
                            className="h-4 w-4"
                          />
                          {hasPerm(res.key, action) && (
                            <select
                              value={getScope(res.key, action)}
                              onChange={(e) => setScope(res.key, action, e.target.value)}
                              className="text-xs border rounded px-1"
                            >
                              <option value="all">全て</option>
                              <option value="own">自分</option>
                              <option value="team">チーム</option>
                            </select>
                          )}
                        </div>
                      ) : hasPerm(res.key, action) ? (
                        <div className="flex flex-col items-center">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            {getScope(res.key, action) === "all"
                              ? "全て"
                              : getScope(res.key, action) === "own"
                              ? "自分"
                              : "チーム"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
