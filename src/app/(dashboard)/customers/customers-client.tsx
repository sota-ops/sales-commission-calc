"use client";

import { useState } from "react";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/actions/customers";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Customer = {
  id: string;
  name: string;
  industry: string | null;
};

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        toast.success("顧客を更新しました");
      } else {
        await createCustomer(formData);
        toast.success("顧客を追加しました");
      }
      setOpen(false);
      setEditingId(null);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この顧客を削除しますか？")) return;
    try {
      await deleteCustomer(id);
      toast.success("顧客を削除しました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  const editing = editingId
    ? customers.find((c) => c.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">顧客管理</h2>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "顧客編集" : "顧客追加"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">顧客名</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editing?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">業種</Label>
                <Input
                  id="industry"
                  name="industry"
                  defaultValue={editing?.industry ?? ""}
                />
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
            <TableHead>顧客名</TableHead>
            <TableHead>業種</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.industry ?? "-"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(customer.id);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                顧客がいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
