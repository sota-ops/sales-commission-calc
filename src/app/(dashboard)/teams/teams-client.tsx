"use client";

import { useState } from "react";
import { createTeam, updateTeam, deleteTeam } from "@/actions/teams";
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

type Team = {
  id: string;
  name: string;
  members: { id: string; name: string }[];
};

export function TeamsClient({ teams }: { teams: Team[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      if (editingId) {
        await updateTeam(editingId, formData);
        toast.success("チームを更新しました");
      } else {
        await createTeam(formData);
        toast.success("チームを追加しました");
      }
      setOpen(false);
      setEditingId(null);
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このチームを削除しますか？")) return;
    try {
      await deleteTeam(id);
      toast.success("チームを削除しました");
    } catch {
      toast.error("エラーが発生しました");
    }
  }

  const editingTeam = editingId ? teams.find((t) => t.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">チーム管理</h2>
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
                {editingId ? "チーム編集" : "チーム追加"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">チーム名</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingTeam?.name}
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
            <TableHead>チーム名</TableHead>
            <TableHead>メンバー数</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>{team.members.length}名</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingId(team.id);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {teams.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                チームがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
