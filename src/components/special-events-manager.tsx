"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import type { SpecialEvent, EventType } from "@/lib/types";
import { formatKRWPlain, formatYearMonthLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AmountInput } from "@/components/amount-input";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";

const emptyEvent: Omit<SpecialEvent, "id"> = {
  name: "",
  amount: 0,
  type: "expense",
  isRecurring: false,
  startMonth: "",
  endMonth: "",
};

export function SpecialEventsManager() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SpecialEvent, "id">>(emptyEvent);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyEvent);
    setDialogOpen(true);
  };

  const openEdit = (evt: SpecialEvent) => {
    setEditingId(evt.id);
    setForm({
      name: evt.name,
      amount: evt.amount,
      type: evt.type,
      isRecurring: evt.isRecurring,
      startMonth: evt.startMonth,
      endMonth: evt.endMonth,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const finalForm = { ...form };
    if (!finalForm.isRecurring) {
      finalForm.endMonth = finalForm.startMonth;
    }
    updateData((prev) => {
      const events = [...prev.specialEvents];
      if (editingId) {
        const idx = events.findIndex((e) => e.id === editingId);
        if (idx >= 0) events[idx] = { ...events[idx], ...finalForm };
      } else {
        events.push({ id: uuid(), ...finalForm });
      }
      return { ...prev, specialEvents: events };
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      specialEvents: prev.specialEvents.filter((e) => e.id !== id),
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              특별 지출/수입
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5 mr-1" /> 이벤트 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>항목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>시기</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.specialEvents.map((evt) => (
                <TableRow key={evt.id}>
                  <TableCell className="font-medium">{evt.name}</TableCell>
                  <TableCell>
                    <Badge variant={evt.type === "income" ? "default" : "destructive"}>
                      {evt.type === "income" ? "수입" : "지출"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {evt.isRecurring
                      ? `${formatYearMonthLabel(evt.startMonth)} ~ ${formatYearMonthLabel(evt.endMonth)}`
                      : formatYearMonthLabel(evt.startMonth)}
                    {evt.isRecurring && <Badge variant="outline" className="ml-1 text-xs">반복</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatKRWPlain(evt.amount)}
                    {evt.isRecurring && <span className="text-xs text-muted-foreground">/월</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(evt)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(evt.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.specialEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    등록된 특별 이벤트가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>항목명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 건보료 분할납부" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={form.type} onValueChange={(v: EventType) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">수입</SelectItem>
                    <SelectItem value="expense">지출</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>금액</Label>
                <AmountInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isRecurring} onCheckedChange={(v) => setForm({ ...form, isRecurring: v })} />
              <Label>매월 반복</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{form.isRecurring ? "시작월" : "해당월"}</Label>
                <Input value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} placeholder="2026-05" />
              </div>
              {form.isRecurring && (
                <div className="space-y-2">
                  <Label>종료월</Label>
                  <Input value={form.endMonth} onChange={(e) => setForm({ ...form, endMonth: e.target.value })} placeholder="2026-09" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.startMonth}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
