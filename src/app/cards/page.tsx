"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { getYearMonth, formatYearMonthLabel, formatKRWPlain } from "@/lib/format";
import type { CardInstallment } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { motion } from "framer-motion";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";

const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function CardsPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ yearMonth: getYearMonth(), paymentDay: 8, expectedAmount: 0 });
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");
  const { cardInfo } = data;
  const remainingLimit = cardInfo.totalLimit - cardInfo.usedLimit;
  const usagePercent = cardInfo.totalLimit > 0 ? (cardInfo.usedLimit / cardInfo.totalLimit) * 100 : 0;

  const openAdd = () => { setEditingId(null); setForm({ yearMonth: getYearMonth(), paymentDay: 8, expectedAmount: 0 }); setDialogOpen(true); };
  const openEdit = (inst: CardInstallment) => { setEditingId(inst.id); setForm({ yearMonth: inst.yearMonth, paymentDay: inst.paymentDay, expectedAmount: inst.expectedAmount }); setDialogOpen(true); };
  const handleSave = () => { updateData((prev) => { const installments = [...prev.cardInstallments]; if (editingId) { const idx = installments.findIndex((i) => i.id === editingId); if (idx >= 0) installments[idx] = { ...installments[idx], ...form }; } else { installments.push({ id: uuid(), ...form }); } return { ...prev, cardInstallments: installments }; }); setDialogOpen(false); };
  const handleDelete = (id: string) => { updateData((prev) => ({ ...prev, cardInstallments: prev.cardInstallments.filter((i) => i.id !== id) })); };

  const sortedInstallments = [...data.cardInstallments].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center"><CreditCard className="h-5 w-5 text-foreground/70" /></div>
          <h2 className="text-lg font-bold">카드 관리</h2>
        </div>
        <button onClick={openAdd} className="rounded-[14px] bg-[#d4f943] border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> 결제 추가
        </button>
      </div>

      {/* 한도 관리 */}
      <motion.div {...anim}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">카드 한도</h3>
            <button onClick={() => setLimitDialogOpen(true)} className="rounded-[10px] border border-foreground/20 px-3 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors">
              한도 변경
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">이용 한도</span>
              <span className="font-semibold tabular-nums">{fmt(cardInfo.usedLimit)} / {fmt(cardInfo.totalLimit)}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "총 한도", value: cardInfo.totalLimit },
              { label: "이용 금액", value: cardInfo.usedLimit, color: "text-red-500" },
              { label: "잔여 한도", value: remainingLimit, color: "text-[#d4f943]" },
            ].map((c) => (
              <div key={c.label} className="text-center rounded-[14px] bg-muted/50 p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{c.label}</p>
                <p className={`font-bold text-sm tabular-nums ${c.color ?? ""}`}>{fmt(c.value)}원</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 할부 잔여금 */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.05 }}>
        <div className="rounded-[20px] bg-[#1a1a1a] dark:bg-[#111] border-2 border-[#1a1a1a] dark:border-[#333] p-5">
          <p className="text-[11px] text-white/50 mb-1">할부 잔여금</p>
          <p className="text-2xl font-extrabold text-[#d4f943] tabular-nums">{fmt(cardInfo.installmentBalance)}<span className="text-sm font-bold ml-0.5 text-white/60">원</span></p>
        </div>
      </motion.div>

      {/* 월별 결제 */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.1 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground overflow-hidden">
          <div className="px-5 py-3 border-b border-foreground/20">
            <h3 className="text-sm font-bold">월별 카드 결제 예정</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-foreground/20">
                <TableHead className="pl-5">월</TableHead><TableHead>결제일</TableHead><TableHead className="text-right">예정 금액</TableHead><TableHead className="text-right pr-5">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstallments.map((inst) => (
                <TableRow key={inst.id} className="border-foreground/20">
                  <TableCell className="pl-5 font-semibold">{formatYearMonthLabel(inst.yearMonth)}</TableCell>
                  <TableCell>{inst.paymentDay}일</TableCell>
                  <TableCell className="text-right tabular-nums"><CurrencyDisplay amount={-inst.expectedAmount} showSign={false} /></TableCell>
                  <TableCell className="text-right pr-5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(inst)} className="h-8 w-8 rounded-[10px] hover:bg-muted flex items-center justify-center transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(inst.id)} className="h-8 w-8 rounded-[10px] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedInstallments.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">등록된 카드 결제 예정이 없습니다</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader><DialogTitle>{editingId ? "결제 수정" : "결제 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>결제 월 (YYYY-MM)</Label><Input value={form.yearMonth} onChange={(e) => setForm({ ...form, yearMonth: e.target.value })} placeholder="2026-04" className="rounded-[10px]" /></div>
            <div className="space-y-2"><Label>결제일</Label><Input type="number" min={1} max={31} value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })} className="rounded-[10px]" /></div>
            <div className="space-y-2"><Label>예정 금액</Label><AmountInput value={form.expectedAmount} onChange={(v) => setForm({ ...form, expectedAmount: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[10px]">취소</Button>
            <Button onClick={handleSave} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader><DialogTitle>카드 한도 변경</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>총 한도</Label><AmountInput value={cardInfo.totalLimit} onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, totalLimit: v } }))} /></div>
            <div className="space-y-2"><Label>이용 금액</Label><AmountInput value={cardInfo.usedLimit} onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, usedLimit: v } }))} /></div>
            <div className="space-y-2"><Label>할부 잔여금</Label><AmountInput value={cardInfo.installmentBalance} onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, installmentBalance: v } }))} /></div>
          </div>
          <DialogFooter><Button onClick={() => setLimitDialogOpen(false)} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">확인</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
