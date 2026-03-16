"use client";

import { useState } from "react";
import { createMember, updateMember, deleteMember } from "@/actions/members";
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

type Member = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  teamId: string | null;
  baseSalary: string;
  joinDate: string;
  isActive: boolean;
  team: { id: string; name: string } | null;
};

type Team = {
  id: string;
  name: string;
};

export function MembersClient({
  members,
  teams,
}: {
  members: Member[];
  teams: Team[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeMembers = members.filter((m) => m.isActive);

  async function handleSubmit(formData: FormData) {
    try {
      if (editingId) {
        await updateMember(editingId, formData);
        toast.success("メンバーを更新しました");
      } else {
        await createMember(formData);
        toast.success("メンバーを追加しました");
      }
      setOpen(false);
      setEditingId(null);
    } catch (error) {
      toast.error("エラーが発生しました");
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このメンバーを無効にしますか？")) return;
    try {
      await deleteMember(id);
      toast.success("メンバーを無効にしました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  function openEdit(member: Member) {
    setEditingId(member.id);
    setOpen(true);
  }

  const editingMember = editingId
    ? members.find((m) => m.id === editingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">メンバー管理</h2>
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
                {editingId ? "メンバー編集" : "メンバー追加"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingMember?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メール</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingMember?.email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">権限</Label>
                <Select
                  name="role"
                  defaultValue={editingMember?.role ?? "viewer"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="manager">マネージャー</SelectItem>
                    <SelectItem value="viewer">一般</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamId">チーム</Label>
                <Select
                  name="teamId"
                  defaultValue={editingMember?.teamId ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="チームを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">なし</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseSalary">固定給</Label>
                <Input
                  id="baseSalary"
                  name="baseSalary"
                  type="number"
                  defaultValue={editingMember?.baseSalary ?? "0"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">入社日</Label>
                <Input
                  id="joinDate"
                  name="joinDate"
                  type="date"
                  defaultValue={editingMember?.joinDate}
                  required
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
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>権限</TableHead>
            <TableHead>チーム</TableHead>
            <TableHead>固定給</TableHead>
            <TableHead>入社日</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                  {member.role === "admin"
                    ? "管理者"
                    : member.role === "manager"
                    ? "マネージャー"
                    : "一般"}
                </Badge>
              </TableCell>
              <TableCell>{member.team?.name ?? "-"}</TableCell>
              <TableCell>
                {Number(member.baseSalary).toLocaleString()}円
              </TableCell>
              <TableCell>{member.joinDate}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {activeMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                メンバーがいません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
