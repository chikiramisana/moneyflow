"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import type { SpecialEvent, EventType } from "@/lib/types";
import { formatKRWPlain, formatYearMonthLabel } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AmountInput } from "@/components/amount-input";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";

const emptyEvent: Omit<SpecialEvent, "id"> = {
  name: "", amount: 0, type: "expense", isRecurring: false, startMonth: "", endMonth: "",
};

export function SpecialEventsManager() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SpecialEvent, "id">>(emptyEvent);

  const openAdd = () => { setEditingId(null); setForm(emptyEvent); setDialogOpen(true); };
  const openEdit = (evt: SpecialEvent) => { setEditingId(evt.id); setForm({ name: evt.name, amount: evt.amount, type: evt.type, isRecurring: evt.isRecurring, startMonth: evt.startMonth, endMonth: evt.endMonth }); setDialogOpen(true); };
  const handleSave = () => {
    const finalForm = { ...form };
    if (!finalForm.isRecurring) finalForm.endMonth = finalForm.startMonth;
    updateData((prev) => {
      const events = [...prev.specialEvents];
      if (editingId) { const idx = events.findIndex((e) => e.id === editingId); if (idx >= 0) events[idx] = { ...events[idx], ...finalForm }; }
      else { events.push({ id: uuid(), ...finalForm }); }
      return { ...prev, specialEvents: events };
    });
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => { updateData((prev) => ({ ...prev, specialEvents: prev.specialEvents.filter((e) => e.id !== id) })); };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground overflow-hidden">
          <div className="px-5 py-3 border-b border-foreground/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#d4f943]" />
              <h3 className="text-sm font-bold">특별 지출/수입</h3>
            </div>
            <button onClick={openAdd} className="rounded-[10px] border border-foreground/20 px-3 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors flex items-center gap-1">
              <Plus className="h-3 w-3" /> 이벤트 추가
            </button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-foreground/20">
                <TableHead className="pl-5">항목</TableHead><TableHead>유형</TableHead><TableHead>시기</TableHead><TableHead className="text-right">금액</TableHead><TableHead className="text-right pr-5">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.specialEvents.map((evt) => (
                <TableRow key={evt.id} className="border-foreground/20">
                  <TableCell className="pl-5 font-semibold">{evt.name}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${evt.type === "income" ? "bg-[#d4f943] text-[#1a1a1a]" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"}`}>
                      {evt.type === "income" ? "수입" : "지출"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {evt.isRecurring ? `${formatYearMonthLabel(evt.startMonth)} ~ ${formatYearMonthLabel(evt.endMonth)}` : formatYearMonthLabel(evt.startMonth)}
                    {evt.isRecurring && <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">반복</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatKRWPlain(evt.amount)}{evt.isRecurring && <span className="text-[10px] text-muted-foreground">/월</span>}</TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(evt)} className="h-8 w-8 rounded-[10px] hover:bg-muted flex items-center justify-center transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(evt.id)} className="h-8 w-8 rounded-[10px] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.specialEvents.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">등록된 특별 이벤트가 없습니다</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader><DialogTitle>{editingId ? "이벤트 수정" : "이벤트 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>항목명</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 건보료 분할납부" className="rounded-[10px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={form.type} onValueChange={(v: EventType) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="income">수입</SelectItem><SelectItem value="expense">지출</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>금액</Label><AmountInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.isRecurring} onCheckedChange={(v) => setForm({ ...form, isRecurring: v })} /><Label>매월 반복</Label></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{form.isRecurring ? "시작월" : "해당월"}</Label><Input value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })} placeholder="2026-05" className="rounded-[10px]" /></div>
              {form.isRecurring && <div className="space-y-2"><Label>종료월</Label><Input value={form.endMonth} onChange={(e) => setForm({ ...form, endMonth: e.target.value })} placeholder="2026-09" className="rounded-[10px]" /></div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[10px]">취소</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.startMonth} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
