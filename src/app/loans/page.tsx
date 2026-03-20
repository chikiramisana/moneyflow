"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthlyInterest } from "@/lib/calculate";
import { formatKRWPlain, formatPercent } from "@/lib/format";
import type { Loan, RepaymentType } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { motion } from "framer-motion";
import { Landmark, Plus, Pencil, Trash2, Banknote } from "lucide-react";

const emptyLoan: Omit<Loan, "id" | "history"> = {
  name: "", balance: 0, interestRate: 0, monthlyPayment: 0, paymentDay: 1, repaymentType: "partial",
};
const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function LoansPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prepayOpen, setPrepayOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prepayLoanId, setPrepayLoanId] = useState<string | null>(null);
  const [prepayAmount, setPrepayAmount] = useState(0);
  const [form, setForm] = useState<Omit<Loan, "id" | "history">>(emptyLoan);

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");
  const totalBalance = data.loans.reduce((s, l) => s + l.balance, 0);
  const totalMonthly = data.loans.reduce((s, l) => s + l.monthlyPayment, 0);
  const totalInterest = data.loans.reduce((s, l) => s + calculateMonthlyInterest(l.balance, l.interestRate), 0);

  const openAdd = () => { setEditingId(null); setForm(emptyLoan); setDialogOpen(true); };
  const openEdit = (loan: Loan) => { setEditingId(loan.id); setForm({ name: loan.name, balance: loan.balance, interestRate: loan.interestRate, monthlyPayment: loan.monthlyPayment, paymentDay: loan.paymentDay, repaymentType: loan.repaymentType }); setDialogOpen(true); };
  const handleSave = () => { updateData((prev) => { const loans = [...prev.loans]; if (editingId) { const idx = loans.findIndex((l) => l.id === editingId); if (idx >= 0) loans[idx] = { ...loans[idx], ...form }; } else { loans.push({ id: uuid(), ...form, history: [] }); } return { ...prev, loans }; }); setDialogOpen(false); };
  const handleDelete = (id: string) => { updateData((prev) => ({ ...prev, loans: prev.loans.filter((l) => l.id !== id) })); };
  const openPrepay = (loanId: string) => { setPrepayLoanId(loanId); setPrepayAmount(0); setPrepayOpen(true); };
  const handlePrepay = () => { if (!prepayLoanId || prepayAmount <= 0) return; updateData((prev) => ({ ...prev, loans: prev.loans.map((l) => { if (l.id !== prepayLoanId) return l; return { ...l, balance: Math.max(0, l.balance - prepayAmount), history: [...l.history, { id: uuid(), date: new Date().toISOString(), type: "prepayment" as const, amount: prepayAmount }] }; }) })); setPrepayOpen(false); };

  const simulateRepayment = () => {
    const sorted = [...data.loans].filter((l) => l.balance > 0).sort((a, b) => b.interestRate - a.interestRate);
    const months: Array<{ month: number; balances: Record<string, number> }> = [];
    const balances: Record<string, number> = {};
    sorted.forEach((l) => (balances[l.id] = l.balance));
    for (let m = 0; m <= 60; m++) {
      months.push({ month: m, balances: { ...balances } });
      if (Object.values(balances).reduce((s, v) => s + v, 0) <= 0) break;
      for (const loan of sorted) { if (balances[loan.id] <= 0) continue; const interest = (balances[loan.id] * loan.interestRate) / 100 / 12; const principal = Math.max(0, loan.monthlyPayment - interest); balances[loan.id] = Math.max(0, balances[loan.id] - principal); }
    }
    return months;
  };

  const repaymentData = simulateRepayment();
  const debtFreeMonth = repaymentData.findIndex((m) => Object.values(m.balances).reduce((s, v) => s + v, 0) <= 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center"><Landmark className="h-5 w-5 text-foreground/70" /></div>
          <h2 className="text-lg font-bold">대출 관리</h2>
        </div>
        <button onClick={openAdd} className="rounded-[14px] bg-[#d4f943] border-2 border-[#1a1a1a] px-4 py-2 text-sm font-bold text-[#1a1a1a] hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> 대출 추가
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "총 대출 잔액", value: totalBalance, dark: true },
          { label: "월 상환 합계", value: totalMonthly },
          { label: "월 이자 합계", value: totalInterest },
        ].map((c, i) => (
          <motion.div key={c.label} {...anim} transition={{ ...anim.transition, delay: i * 0.05 }}>
            <div className={`rounded-[20px] p-5 border-2 ${c.dark ? "bg-[#1a1a1a] dark:bg-[#111] border-[#1a1a1a] dark:border-[#333]" : "bg-card border-foreground"}`}>
              <p className={`text-[11px] font-medium mb-1 ${c.dark ? "text-white/50" : "text-muted-foreground"}`}>{c.label}</p>
              <p className={`text-2xl font-extrabold tabular-nums ${c.dark ? "text-[#d4f943]" : ""}`}>{fmt(c.value)}<span className={`text-sm font-bold ml-0.5 ${c.dark ? "text-white/60" : ""}`}>원</span></p>
            </div>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList className="rounded-[14px] border-2 border-foreground p-1">
          <TabsTrigger value="list" className="rounded-[10px] data-[state=active]:bg-[#d4f943] data-[state=active]:text-[#1a1a1a]">대출 목록</TabsTrigger>
          <TabsTrigger value="planner" className="rounded-[10px] data-[state=active]:bg-[#d4f943] data-[state=active]:text-[#1a1a1a]">상환 플래너</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <motion.div {...anim}>
            <div className="rounded-[20px] bg-card border-2 border-foreground overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-foreground">
                    <TableHead className="pl-5">대출명</TableHead><TableHead className="text-right">잔액</TableHead><TableHead>금리</TableHead>
                    <TableHead className="text-right">월 상환</TableHead><TableHead className="text-right">월 이자</TableHead><TableHead>결제일</TableHead><TableHead className="text-right pr-5">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.loans.map((loan) => {
                    const mi = calculateMonthlyInterest(loan.balance, loan.interestRate);
                    return (
                      <TableRow key={loan.id} className="border-foreground/20">
                        <TableCell className="pl-5 font-semibold">{loan.name}</TableCell>
                        <TableCell className="text-right tabular-nums"><CurrencyDisplay amount={-loan.balance} showSign={false} /></TableCell>
                        <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{formatPercent(loan.interestRate)}</span></TableCell>
                        <TableCell className="text-right tabular-nums">{formatKRWPlain(loan.monthlyPayment)}</TableCell>
                        <TableCell className="text-right tabular-nums text-orange-500">{formatKRWPlain(mi)}</TableCell>
                        <TableCell>{loan.paymentDay}일</TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openPrepay(loan.id)} className="rounded-[10px] border border-foreground/20 px-2 py-1 text-[11px] font-semibold hover:bg-muted transition-colors flex items-center gap-1"><Banknote className="h-3 w-3" />중도상환</button>
                            <button onClick={() => openEdit(loan)} className="h-8 w-8 rounded-[10px] hover:bg-muted flex items-center justify-center transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(loan.id)} className="h-8 w-8 rounded-[10px] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="planner">
          <motion.div {...anim}>
            <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold">상환 시뮬레이션 (애벌랜치 방식)</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">고금리 대출부터 우선 상환 · {debtFreeMonth > 0 ? `약 ${debtFreeMonth}개월 후 부채 제로` : "60개월 이상 소요"}</p>
              </div>
              <div className="space-y-4">
                {data.loans.filter((l) => l.balance > 0).sort((a, b) => b.interestRate - a.interestRate).map((loan) => {
                  const initial = repaymentData[0]?.balances[loan.id] ?? loan.balance;
                  const final2 = repaymentData[repaymentData.length - 1]?.balances[loan.id] ?? 0;
                  const paidOff = final2 <= 0;
                  const progressVal = initial > 0 ? ((initial - final2) / initial) * 100 : 100;
                  const zeroMonth = repaymentData.findIndex((m2) => (m2.balances[loan.id] ?? 0) <= 0);
                  return (
                    <div key={loan.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{loan.name}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">{formatPercent(loan.interestRate)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{paidOff ? "상환 완료" : zeroMonth > 0 ? `${zeroMonth}개월 후 완료` : "60개월 이상"}</span>
                      </div>
                      <Progress value={progressVal} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                        <span>{formatKRWPlain(initial)}</span><span>{formatKRWPlain(final2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader><DialogTitle>{editingId ? "대출 수정" : "대출 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>대출명</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="대출명" className="rounded-[10px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>잔액</Label><AmountInput value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} /></div>
              <div className="space-y-2"><Label>금리 (%)</Label><Input type="number" step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })} className="rounded-[10px]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>월 상환액</Label><AmountInput value={form.monthlyPayment} onChange={(v) => setForm({ ...form, monthlyPayment: v })} /></div>
              <div className="space-y-2"><Label>결제일</Label><Input type="number" min={1} max={31} value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })} className="rounded-[10px]" /></div>
            </div>
            <div className="space-y-2">
              <Label>상환 방식</Label>
              <Select value={form.repaymentType} onValueChange={(v: RepaymentType) => setForm({ ...form, repaymentType: v })}>
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="partial">일부상환 가능</SelectItem><SelectItem value="full_only">전액상환만 가능</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[10px]">취소</Button>
            <Button onClick={handleSave} disabled={!form.name} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prepayOpen} onOpenChange={setPrepayOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle>중도상환</DialogTitle>
            <DialogDescription>{prepayLoanId && data.loans.find((l) => l.id === prepayLoanId)?.name}에 상환할 금액을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2"><Label>상환 금액</Label><AmountInput value={prepayAmount} onChange={setPrepayAmount} placeholder="상환 금액" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrepayOpen(false)} className="rounded-[10px]">취소</Button>
            <Button onClick={handlePrepay} disabled={prepayAmount <= 0} className="rounded-[10px] bg-[#d4f943] text-[#1a1a1a] hover:bg-[#c5ea34]">상환</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
