"use client";

import { useState } from "react";
import {
  createContract,
  updateContract,
  deleteContract,
} from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Contract = {
  id: string;
  memberId: string;
  customerId: string;
  productId: string;
  status: "active" | "cancelled" | "pending";
  contractDate: string;
  initialAmount: string;
  monthlyAmount: string;
  grossProfit: string;
  isCrossSell: boolean;
  note: string | null;
  member: { name: string };
  customer: { name: string };
  product: { name: string };
};

type SelectOption = { id: string; name: string };

export function ContractsClient({
  contracts,
  members,
  customers,
  products,
}: {
  contracts: Contract[];
  members: SelectOption[];
  customers: SelectOption[];
  products: SelectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      if (editingId) {
        await updateContract(editingId, formData);
        toast.success("契約を更新しました");
      } else {
        await createContract(formData);
        toast.success("契約を追加しました");
      }
      setOpen(false);
      setEditingId(null);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この契約をキャンセルしますか？")) return;
    try {
      await deleteContract(id);
      toast.success("契約をキャンセルしました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  const editing = editingId
    ? contracts.find((c) => c.id === editingId)
    : null;

  const statusLabel = {
    active: "有効",
    cancelled: "キャンセル",
    pending: "保留",
  };

  const statusVariant = {
    active: "default" as const,
    cancelled: "destructive" as const,
    pending: "secondary" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">契約管理</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditingId(null);
          }}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            追加
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "契約編集" : "契約追加"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>担当者</Label>
                  <Select
                    name="memberId"
                    defaultValue={editing?.memberId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>顧客</Label>
                  <Select
                    name="customerId"
                    defaultValue={editing?.customerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>商品</Label>
                  <Select
                    name="productId"
                    defaultValue={editing?.productId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <Select
                    name="status"
                    defaultValue={editing?.status ?? "active"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">有効</SelectItem>
                      <SelectItem value="pending">保留</SelectItem>
                      <SelectItem value="cancelled">キャンセル</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>契約日</Label>
                <Input
                  name="contractDate"
                  type="date"
                  defaultValue={editing?.contractDate}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>初期費用</Label>
                  <Input
                    name="initialAmount"
                    type="number"
                    defaultValue={editing?.initialAmount ?? "0"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>月額</Label>
                  <Input
                    name="monthlyAmount"
                    type="number"
                    defaultValue={editing?.monthlyAmount ?? "0"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>粗利</Label>
                  <Input
                    name="grossProfit"
                    type="number"
                    defaultValue={editing?.grossProfit ?? "0"}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>クロスセル</Label>
                <Select
                  name="isCrossSell"
                  defaultValue={editing?.isCrossSell ? "true" : "false"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">いいえ</SelectItem>
                    <SelectItem value="true">はい</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>備考</Label>
                <Input name="note" defaultValue={editing?.note ?? ""} />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "更新" : "追加"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>契約日</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>顧客</TableHead>
            <TableHead>商品</TableHead>
            <TableHead>初期費用</TableHead>
            <TableHead>月額</TableHead>
            <TableHead>粗利</TableHead>
            <TableHead>状態</TableHead>
            <TableHead>XS</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.contractDate}</TableCell>
              <TableCell>{c.member.name}</TableCell>
              <TableCell>{c.customer.name}</TableCell>
              <TableCell>{c.product.name}</TableCell>
              <TableCell>
                {Number(c.initialAmount).toLocaleString()}円
              </TableCell>
              <TableCell>
                {Number(c.monthlyAmount).toLocaleString()}円
              </TableCell>
              <TableCell>
                {Number(c.grossProfit).toLocaleString()}円
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[c.status]}>
                  {statusLabel[c.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {c.isCrossSell && (
                  <Badge variant="outline">XS</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(c.id);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {c.status !== "cancelled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {contracts.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                契約がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
