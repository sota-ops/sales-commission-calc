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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  category: string;
  initialPrice: string;
  monthlyPrice: string;
  unitPrice: string;
  isRecurring: boolean;
};

function ProductForm({
  product,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  product?: Product;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>商品名</Label>
        <Input
          name="name"
          defaultValue={product?.name}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <Input
          name="category"
          defaultValue={product?.category}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>初期費用</Label>
          <Input
            name="initialPrice"
            type="number"
            defaultValue={product?.initialPrice ?? "0"}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>月額</Label>
          <Input
            name="monthlyPrice"
            type="number"
            defaultValue={product?.monthlyPrice ?? "0"}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>課金形態</Label>
        <Select
          name="isRecurring"
          defaultValue={product?.isRecurring ? "true" : "false"}
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
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    try {
      await createProduct(formData);
      toast.success("商品を追加しました");
      setFormOpen(false);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingId) return;
    try {
      await updateProduct(editingId, formData);
      toast.success("商品を更新しました");
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
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">商品管理</h2>
        {!formOpen && !editingId && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            追加
          </Button>
        )}
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>商品追加</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              onSubmit={handleCreate}
              onCancel={() => setFormOpen(false)}
              submitLabel="追加"
            />
          </CardContent>
        </Card>
      )}

      {editingId && editingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>商品編集</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
              submitLabel="更新"
            />
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商品名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead className="text-right">初期費用</TableHead>
            <TableHead className="text-right">月額</TableHead>
            <TableHead>課金形態</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right">
                {Number(product.initialPrice).toLocaleString()}円
              </TableCell>
              <TableCell className="text-right">
                {Number(product.monthlyPrice).toLocaleString()}円
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
                      setFormOpen(false);
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
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                商品がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
