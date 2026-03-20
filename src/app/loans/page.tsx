"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { calculateMonthlyInterest } from "@/lib/calculate";
import { formatKRWPlain, formatPercent } from "@/lib/format";
import type { Loan, RepaymentType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { Landmark, Plus, Pencil, Trash2, Banknote } from "lucide-react";

const emptyLoan: Omit<Loan, "id" | "history"> = {
  name: "",
  balance: 0,
  interestRate: 0,
  monthlyPayment: 0,
  paymentDay: 1,
  repaymentType: "partial",
};

export default function LoansPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prepayOpen, setPrepayOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prepayLoanId, setPrepayLoanId] = useState<string | null>(null);
  const [prepayAmount, setPrepayAmount] = useState(0);
  const [form, setForm] = useState<Omit<Loan, "id" | "history">>(emptyLoan);

  const totalBalance = data.loans.reduce((sum, l) => sum + l.balance, 0);
  const totalMonthly = data.loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const totalInterest = data.loans.reduce((sum, l) => sum + calculateMonthlyInterest(l.balance, l.interestRate), 0);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyLoan);
    setDialogOpen(true);
  };

  const openEdit = (loan: Loan) => {
    setEditingId(loan.id);
    setForm({
      name: loan.name,
      balance: loan.balance,
      interestRate: loan.interestRate,
      monthlyPayment: loan.monthlyPayment,
      paymentDay: loan.paymentDay,
      repaymentType: loan.repaymentType,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    updateData((prev) => {
      const loans = [...prev.loans];
      if (editingId) {
        const idx = loans.findIndex((l) => l.id === editingId);
        if (idx >= 0) loans[idx] = { ...loans[idx], ...form };
      } else {
        loans.push({ id: uuid(), ...form, history: [] });
      }
      return { ...prev, loans };
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      loans: prev.loans.filter((l) => l.id !== id),
    }));
  };

  const openPrepay = (loanId: string) => {
    setPrepayLoanId(loanId);
    setPrepayAmount(0);
    setPrepayOpen(true);
  };

  const handlePrepay = () => {
    if (!prepayLoanId || prepayAmount <= 0) return;
    updateData((prev) => ({
      ...prev,
      loans: prev.loans.map((l) => {
        if (l.id !== prepayLoanId) return l;
        const newBalance = Math.max(0, l.balance - prepayAmount);
        return {
          ...l,
          balance: newBalance,
          history: [
            ...l.history,
            { id: uuid(), date: new Date().toISOString(), type: "prepayment" as const, amount: prepayAmount },
          ],
        };
      }),
    }));
    setPrepayOpen(false);
  };

  // 상환 플래너 시뮬레이션 (애벌랜치: 고금리 순)
  const simulateRepayment = () => {
    const sorted = [...data.loans]
      .filter((l) => l.balance > 0)
      .sort((a, b) => b.interestRate - a.interestRate);
    const months: Array<{ month: number; balances: Record<string, number> }> = [];
    const balances: Record<string, number> = {};
    sorted.forEach((l) => (balances[l.id] = l.balance));

    for (let m = 0; m <= 60; m++) {
      months.push({ month: m, balances: { ...balances } });
      const totalRemaining = Object.values(balances).reduce((s, v) => s + v, 0);
      if (totalRemaining <= 0) break;

      for (const loan of sorted) {
        if (balances[loan.id] <= 0) continue;
        const interest = (balances[loan.id] * loan.interestRate) / 100 / 12;
        const principal = Math.max(0, loan.monthlyPayment - interest);
        balances[loan.id] = Math.max(0, balances[loan.id] - principal);
      }
    }
    return months;
  };

  const repaymentData = simulateRepayment();
  const debtFreeMonth = repaymentData.findIndex(
    (m) => Object.values(m.balances).reduce((s, v) => s + v, 0) <= 0
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Landmark className="h-6 w-6" />
          대출 관리
        </h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 대출 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 대출 잔액</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={-totalBalance} showSign={false} className="text-2xl font-bold text-red-600 dark:text-red-400" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>월 상환 합계</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={-totalMonthly} showSign={false} className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>월 이자 합계</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={-totalInterest} showSign={false} className="text-2xl font-bold text-orange-600 dark:text-orange-400" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">대출 목록</TabsTrigger>
          <TabsTrigger value="planner">상환 플래너</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>대출명</TableHead>
                    <TableHead className="text-right">잔액</TableHead>
                    <TableHead>금리</TableHead>
                    <TableHead className="text-right">월 상환</TableHead>
                    <TableHead className="text-right">월 이자</TableHead>
                    <TableHead>결제일</TableHead>
                    <TableHead>상환방식</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.loans.map((loan) => {
                    const monthlyInterest = calculateMonthlyInterest(loan.balance, loan.interestRate);
                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.name}</TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={-loan.balance} showSign={false} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={loan.interestRate >= 10 ? "destructive" : loan.interestRate >= 5 ? "secondary" : "outline"}>
                            {formatPercent(loan.interestRate)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatKRWPlain(loan.monthlyPayment)}</TableCell>
                        <TableCell className="text-right text-orange-600 dark:text-orange-400">
                          {formatKRWPlain(monthlyInterest)}
                        </TableCell>
                        <TableCell>{loan.paymentDay}일</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {loan.repaymentType === "full_only" ? "전액상환만" : "일부상환"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openPrepay(loan.id)}>
                              <Banknote className="h-3.5 w-3.5 mr-1" /> 중도상환
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(loan)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(loan.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planner">
          <Card>
            <CardHeader>
              <CardTitle>상환 시뮬레이션 (애벌랜치 방식)</CardTitle>
              <CardDescription>
                고금리 대출부터 우선 상환하는 시나리오입니다.
                {debtFreeMonth > 0 && ` 현재 상환액 기준 약 ${debtFreeMonth}개월 후 부채 제로 달성 예상`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.loans
                  .filter((l) => l.balance > 0)
                  .sort((a, b) => b.interestRate - a.interestRate)
                  .map((loan) => {
                    const initial = repaymentData[0]?.balances[loan.id] ?? loan.balance;
                    const final = repaymentData[repaymentData.length - 1]?.balances[loan.id] ?? 0;
                    const paidOff = final <= 0;
                    const progressVal = initial > 0 ? ((initial - final) / initial) * 100 : 100;
                    const zeroMonth = repaymentData.findIndex((m) => (m.balances[loan.id] ?? 0) <= 0);

                    return (
                      <div key={loan.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{loan.name}</span>
                            <Badge variant={paidOff ? "default" : "outline"} className="text-xs">
                              {formatPercent(loan.interestRate)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {paidOff ? "상환 완료" : zeroMonth > 0 ? `${zeroMonth}개월 후 완료` : "60개월 이상"}
                          </span>
                        </div>
                        <Progress value={progressVal} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatKRWPlain(initial)}</span>
                          <span>{formatKRWPlain(final)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 대출 추가/수정 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "대출 수정" : "대출 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>대출명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="대출명" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>잔액</Label>
                <AmountInput value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} />
              </div>
              <div className="space-y-2">
                <Label>금리 (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>월 상환액</Label>
                <AmountInput value={form.monthlyPayment} onChange={(v) => setForm({ ...form, monthlyPayment: v })} />
              </div>
              <div className="space-y-2">
                <Label>결제일</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>상환 방식</Label>
              <Select
                value={form.repaymentType}
                onValueChange={(v: RepaymentType) => setForm({ ...form, repaymentType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">일부상환 가능</SelectItem>
                  <SelectItem value="full_only">전액상환만 가능</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!form.name}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 중도상환 Dialog */}
      <Dialog open={prepayOpen} onOpenChange={setPrepayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>중도상환</DialogTitle>
            <DialogDescription>
              {prepayLoanId && data.loans.find((l) => l.id === prepayLoanId)?.name}에 상환할 금액을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>상환 금액</Label>
            <AmountInput value={prepayAmount} onChange={setPrepayAmount} placeholder="상환 금액" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrepayOpen(false)}>취소</Button>
            <Button onClick={handlePrepay} disabled={prepayAmount <= 0}>상환</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
