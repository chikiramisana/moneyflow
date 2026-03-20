"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { getYearMonth, formatYearMonthLabel, formatKRWPlain } from "@/lib/format";
import type { CardInstallment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react";

export default function CardsPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ yearMonth: getYearMonth(), paymentDay: 8, expectedAmount: 0 });
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  const { cardInfo } = data;
  const remainingLimit = cardInfo.totalLimit - cardInfo.usedLimit;
  const usagePercent = cardInfo.totalLimit > 0 ? (cardInfo.usedLimit / cardInfo.totalLimit) * 100 : 0;

  const openAdd = () => {
    setEditingId(null);
    setForm({ yearMonth: getYearMonth(), paymentDay: 8, expectedAmount: 0 });
    setDialogOpen(true);
  };

  const openEdit = (inst: CardInstallment) => {
    setEditingId(inst.id);
    setForm({ yearMonth: inst.yearMonth, paymentDay: inst.paymentDay, expectedAmount: inst.expectedAmount });
    setDialogOpen(true);
  };

  const handleSave = () => {
    updateData((prev) => {
      const installments = [...prev.cardInstallments];
      if (editingId) {
        const idx = installments.findIndex((i) => i.id === editingId);
        if (idx >= 0) installments[idx] = { ...installments[idx], ...form };
      } else {
        installments.push({ id: uuid(), ...form });
      }
      return { ...prev, cardInstallments: installments };
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      cardInstallments: prev.cardInstallments.filter((i) => i.id !== id),
    }));
  };

  const sortedInstallments = [...data.cardInstallments].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          카드 관리
        </h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 결제 추가
        </Button>
      </div>

      {/* 한도 관리 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">카드 한도</CardTitle>
              <CardDescription>현재 한도 및 이용 현황</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLimitDialogOpen(true)}>
              한도 변경
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>이용 한도</span>
              <span>{formatKRWPlain(cardInfo.usedLimit)} / {formatKRWPlain(cardInfo.totalLimit)}</span>
            </div>
            <Progress value={usagePercent} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">총 한도</p>
              <p className="font-semibold">{formatKRWPlain(cardInfo.totalLimit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">이용 금액</p>
              <p className="font-semibold text-red-600 dark:text-red-400">{formatKRWPlain(cardInfo.usedLimit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">잔여 한도</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">{formatKRWPlain(remainingLimit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 할부 잔여금 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">할부 잔여금</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyDisplay amount={-cardInfo.installmentBalance} showSign={false} className="text-2xl font-bold text-red-600 dark:text-red-400" />
        </CardContent>
      </Card>

      {/* 월별 결제 예정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 카드 결제 예정</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>월</TableHead>
                <TableHead>결제일</TableHead>
                <TableHead className="text-right">예정 금액</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInstallments.map((inst) => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{formatYearMonthLabel(inst.yearMonth)}</TableCell>
                  <TableCell>{inst.paymentDay}일</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={-inst.expectedAmount} showSign={false} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(inst)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedInstallments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    등록된 카드 결제 예정이 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 결제 추가/수정 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "결제 수정" : "결제 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>결제 월 (YYYY-MM)</Label>
              <Input value={form.yearMonth} onChange={(e) => setForm({ ...form, yearMonth: e.target.value })} placeholder="2026-04" />
            </div>
            <div className="space-y-2">
              <Label>결제일</Label>
              <Input type="number" min={1} max={31} value={form.paymentDay} onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>예정 금액</Label>
              <AmountInput value={form.expectedAmount} onChange={(v) => setForm({ ...form, expectedAmount: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 한도 변경 Dialog */}
      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카드 한도 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>총 한도</Label>
              <AmountInput
                value={cardInfo.totalLimit}
                onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, totalLimit: v } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>이용 금액</Label>
              <AmountInput
                value={cardInfo.usedLimit}
                onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, usedLimit: v } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>할부 잔여금</Label>
              <AmountInput
                value={cardInfo.installmentBalance}
                onChange={(v) => updateData((prev) => ({ ...prev, cardInfo: { ...prev.cardInfo, installmentBalance: v } }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLimitDialogOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
