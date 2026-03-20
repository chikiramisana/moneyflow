"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import type { FixedExpense, Currency, PaymentMethod } from "@/lib/types";
import { getFixedExpenseKRW } from "@/lib/calculate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: "카드",
  transfer: "계좌이체",
  cash: "현금",
  other: "기타",
};

const emptyExpense: Omit<FixedExpense, "id"> = {
  name: "",
  amount: 0,
  currency: "KRW",
  paymentDay: 0,
  paymentMethod: "transfer",
  enabled: true,
  disabledMonths: [],
};

const anim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ExpensesPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FixedExpense, "id">>(emptyExpense);

  const exchangeRate = data.settings.exchangeRate;
  const totalKRW = data.fixedExpenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + getFixedExpenseKRW(e.amount, e.currency, exchangeRate), 0);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  const openAdd = () => { setEditingId(null); setForm(emptyExpense); setDialogOpen(true); };
  const openEdit = (exp: FixedExpense) => {
    setEditingId(exp.id);
    setForm({ name: exp.name, amount: exp.amount, currency: exp.currency, paymentDay: exp.paymentDay, paymentMethod: exp.paymentMethod, enabled: exp.enabled, disabledMonths: exp.disabledMonths });
    setDialogOpen(true);
  };
  const handleSave = () => {
    updateData((prev) => {
      const expenses = [...prev.fixedExpenses];
      if (editingId) { const idx = expenses.findIndex((e) => e.id === editingId); if (idx >= 0) expenses[idx] = { ...expenses[idx], ...form }; }
      else { expenses.push({ id: uuid(), ...form }); }
      return { ...prev, fixedExpenses: expenses };
    });
    setDialogOpen(false);
  };
  const handleDelete = (id: string) => { updateData((prev) => ({ ...prev, fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id) })); };
  const toggleEnabled = (id: string) => { updateData((prev) => ({ ...prev, fixedExpenses: prev.fixedExpenses.map((e) => e.id === id ? { ...e, enabled: !e.enabled } : e) })); };

  const dayLabel = (day: number) => (day === 0 ? "말일" : `${day}일`);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center">
            <Receipt className="h-5 w-5 text-foreground/70" />
          </div>
          <h2 className="text-lg font-bold">고정 지출 관리</h2>
        </div>
        <button onClick={openAdd} className="rounded-[14px] bg-[#d4f943] border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> 항목 추가
        </button>
      </div>

      <motion.div {...anim}>
        <div className="rounded-[20px] bg-card border-2 border-foreground overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-foreground">
                <TableHead className="pl-5">활성</TableHead>
                <TableHead>항목</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>결제일</TableHead>
                <TableHead>결제수단</TableHead>
                <TableHead className="text-right pr-5">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fixedExpenses.map((exp) => {
                const krw = getFixedExpenseKRW(exp.amount, exp.currency, exchangeRate);
                return (
                  <TableRow key={exp.id} className={`border-foreground/20 ${!exp.enabled ? "opacity-40" : ""}`}>
                    <TableCell className="pl-5"><Switch checked={exp.enabled} onCheckedChange={() => toggleEnabled(exp.id)} /></TableCell>
                    <TableCell className="font-semibold">{exp.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {exp.currency === "USD" ? (
                        <div><span className="font-mono">${exp.amount.toFixed(2)}</span><span className="text-[10px] text-muted-foreground ml-1">≈ {krw.toLocaleString("ko-KR")}원</span></div>
                      ) : (
                        <CurrencyDisplay amount={-exp.amount} showSign={false} />
                      )}
                    </TableCell>
                    <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{dayLabel(exp.paymentDay)}</span></TableCell>
                    <TableCell className="text-sm">{paymentMethodLabels[exp.paymentMethod]}</TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(exp)} className="h-8 w-8 rounded-[10px] hover:bg-muted flex items-center justify-center transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(exp.id)} className="h-8 w-8 rounded-[10px] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.1 }}>
        <div className="rounded-[20px] bg-[#1a1a1a] dark:bg-[#111] border-2 border-[#1a1a1a] dark:border-[#333] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white/80">고정 지출 합계</span>
            <span className="text-2xl font-extrabold text-[#d4f943] tabular-nums">{fmt(totalKRW)}<span className="text-sm font-bold ml-0.5">원</span></span>
          </div>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "지출 항목 수정" : "지출 항목 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>항목명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 월세, 휴대폰" className="rounded-[10px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>통화</Label>
                <Select value={form.currency} onValueChange={(v: Currency) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="KRW">원화 (KRW)</SelectItem><SelectItem value="USD">달러 (USD)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>금액</Label>
                <AmountInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} prefix={form.currency === "USD" ? "$" : ""} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>결제일 (0 = 말일)</Label>
                <Input type="number" min={0} max={31} value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })} className="rounded-[10px]" />
              </div>
              <div className="space-y-2">
                <Label>결제수단</Label>
                <Select value={form.paymentMethod} onValueChange={(v: PaymentMethod) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="card">카드</SelectItem><SelectItem value="transfer">계좌이체</SelectItem><SelectItem value="cash">현금</SelectItem><SelectItem value="other">기타</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[10px]">취소</Button>
            <Button onClick={handleSave} disabled={!form.name} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
