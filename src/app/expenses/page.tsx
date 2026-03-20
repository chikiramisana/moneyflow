"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import type { FixedExpense, Currency, PaymentMethod } from "@/lib/types";
import { getFixedExpenseKRW } from "@/lib/calculate";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AmountInput } from "@/components/amount-input";
import { CurrencyDisplay } from "@/components/currency-display";
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

export default function ExpensesPage() {
  const { data, updateData } = useFinancialData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FixedExpense, "id">>(emptyExpense);

  const exchangeRate = data.settings.exchangeRate;

  const totalKRW = data.fixedExpenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + getFixedExpenseKRW(e.amount, e.currency, exchangeRate), 0);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyExpense);
    setDialogOpen(true);
  };

  const openEdit = (exp: FixedExpense) => {
    setEditingId(exp.id);
    setForm({
      name: exp.name,
      amount: exp.amount,
      currency: exp.currency,
      paymentDay: exp.paymentDay,
      paymentMethod: exp.paymentMethod,
      enabled: exp.enabled,
      disabledMonths: exp.disabledMonths,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    updateData((prev) => {
      const expenses = [...prev.fixedExpenses];
      if (editingId) {
        const idx = expenses.findIndex((e) => e.id === editingId);
        if (idx >= 0) expenses[idx] = { ...expenses[idx], ...form };
      } else {
        expenses.push({ id: uuid(), ...form });
      }
      return { ...prev, fixedExpenses: expenses };
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }));
  };

  const toggleEnabled = (id: string) => {
    updateData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((e) =>
        e.id === id ? { ...e, enabled: !e.enabled } : e
      ),
    }));
  };

  const dayLabel = (day: number) => (day === 0 ? "말일" : `${day}일`);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          고정 지출 관리
        </h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 항목 추가
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>활성</TableHead>
                <TableHead>항목</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>결제일</TableHead>
                <TableHead>결제수단</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fixedExpenses.map((exp) => {
                const krw = getFixedExpenseKRW(exp.amount, exp.currency, exchangeRate);
                return (
                  <TableRow key={exp.id} className={!exp.enabled ? "opacity-50" : ""}>
                    <TableCell>
                      <Switch checked={exp.enabled} onCheckedChange={() => toggleEnabled(exp.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{exp.name}</TableCell>
                    <TableCell className="text-right">
                      {exp.currency === "USD" ? (
                        <div>
                          <span className="font-mono">${exp.amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ≈ {krw.toLocaleString("ko-KR")}원
                          </span>
                        </div>
                      ) : (
                        <CurrencyDisplay amount={-exp.amount} showSign={false} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dayLabel(exp.paymentDay)}</Badge>
                    </TableCell>
                    <TableCell>{paymentMethodLabels[exp.paymentMethod]}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
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

      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">고정 지출 합계</span>
            <CurrencyDisplay amount={-totalKRW} showSign={false} className="text-xl font-bold text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "지출 항목 수정" : "지출 항목 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>항목명</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="예: 월세, 휴대폰"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>통화</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v: Currency) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KRW">원화 (KRW)</SelectItem>
                    <SelectItem value="USD">달러 (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>금액</Label>
                <AmountInput
                  value={form.amount}
                  onChange={(v) => setForm({ ...form, amount: v })}
                  prefix={form.currency === "USD" ? "$" : ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>결제일 (0 = 말일)</Label>
                <Input
                  type="number"
                  min={0}
                  max={31}
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>결제수단</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(v: PaymentMethod) => setForm({ ...form, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">카드</SelectItem>
                    <SelectItem value="transfer">계좌이체</SelectItem>
                    <SelectItem value="cash">현금</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={!form.name}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
