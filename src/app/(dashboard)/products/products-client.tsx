"use client";

import { useState } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions/products";
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

type Product = {
  id: string;
  name: string;
  category: string;
  unitPrice: string;
  isRecurring: boolean;
};

export function ProductsClient({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
        toast.success("商品を更新しました");
      } else {
        await createProduct(formData);
        toast.success("商品を追加しました");
      }
      setOpen(false);
      setEditingId(null);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この商品を削除しますか？")) return;
    try {
      await deleteProduct(id);
      toast.success("商品を削除しました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  const editingProduct = editingId
    ? products.find((p) => p.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">商品管理</h2>
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
                {editingId ? "商品編集" : "商品追加"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">商品名</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editingProduct?.category}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">単価</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  defaultValue={editingProduct?.unitPrice ?? "0"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isRecurring">課金形態</Label>
                <Select
                  name="isRecurring"
                  defaultValue={
                    editingProduct?.isRecurring ? "true" : "false"
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">一括</SelectItem>
                    <SelectItem value="true">ストック（継続課金）</SelectItem>
                  </SelectContent>
                </Select>
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
            <TableHead>商品名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>単価</TableHead>
            <TableHead>課金形態</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                {Number(product.unitPrice).toLocaleString()}円
              </TableCell>
              <TableCell>
                <Badge variant={product.isRecurring ? "default" : "secondary"}>
                  {product.isRecurring ? "ストック" : "一括"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(product.id);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                商品がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
