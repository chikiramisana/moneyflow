"use client";

import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/amount-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Settings, Download, Upload, RotateCcw, AlertTriangle, Plus } from "lucide-react";

const anim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function SettingsPage() {
  const { data, updateData, exportData, importData, resetData } = useFinancialData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  const fmt = (n: number) => Math.abs(Math.round(n)).toLocaleString("ko-KR");

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const success = importData(text);
      setImportStatus(success ? "success" : "error");
      setTimeout(() => setImportStatus("idle"), 3000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-[14px] bg-muted flex items-center justify-center"><Settings className="h-5 w-5 text-foreground/70" /></div>
        <h2 className="text-lg font-bold">설정</h2>
      </div>

      {/* 환율 설정 */}
      <motion.div {...anim}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-3">
          <h3 className="text-sm font-bold">환율 설정</h3>
          <p className="text-[11px] text-muted-foreground">달러(USD) 결제 항목의 원화 환산에 사용됩니다.</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$1 =</span>
            <AmountInput
              value={data.settings.exchangeRate}
              onChange={(v) => updateData((prev) => ({ ...prev, settings: { ...prev.settings, exchangeRate: v } }))}
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        </div>
      </motion.div>

      {/* 자산 관리 */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.05 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
          <h3 className="text-sm font-bold">자산 관리</h3>
          <p className="text-[11px] text-muted-foreground">보유 자산 항목을 관리합니다.</p>
          {data.assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">{asset.name}</Label>
                <AmountInput
                  value={asset.amount}
                  onChange={(v) => updateData((prev) => ({ ...prev, assets: prev.assets.map((a) => a.id === asset.id ? { ...a, amount: v } : a) }))}
                />
              </div>
              <button
                onClick={() => updateData((prev) => ({ ...prev, assets: prev.assets.filter((a) => a.id !== asset.id) }))}
                className="mt-4 h-8 w-8 rounded-[10px] hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors text-red-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const name = prompt("자산 항목명을 입력하세요:");
              if (name) { updateData((prev) => ({ ...prev, assets: [...prev.assets, { id: uuid(), name, amount: 0 }] })); }
            }}
            className="rounded-[10px] border border-foreground/20 px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> 자산 항목 추가
          </button>
        </div>
      </motion.div>

      {/* 데이터 관리 */}
      <motion.div {...anim} transition={{ ...anim.transition, delay: 0.1 }}>
        <div className="rounded-[20px] bg-card border-2 border-foreground p-5 space-y-4">
          <h3 className="text-sm font-bold">데이터 관리</h3>
          <p className="text-[11px] text-muted-foreground">데이터를 내보내거나 가져올 수 있습니다.</p>
          <div className="flex gap-3">
            <button onClick={handleExport} className="rounded-[10px] border border-foreground/20 px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> 데이터 내보내기
            </button>
            <div>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button onClick={() => fileInputRef.current?.click()} className="rounded-[10px] border border-foreground/20 px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> 데이터 가져오기
              </button>
            </div>
          </div>
          {importStatus === "success" && <p className="text-xs text-green-600 font-semibold">데이터를 성공적으로 가져왔습니다.</p>}
          {importStatus === "error" && <p className="text-xs text-red-500 font-semibold">데이터 가져오기에 실패했습니다.</p>}
          <div className="h-px bg-foreground/10" />
          <button onClick={() => setResetDialogOpen(true)} className="rounded-[10px] bg-red-500 text-white px-4 py-2 text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> 데이터 초기화
          </button>
          <p className="text-[10px] text-muted-foreground">모든 데이터가 기본값으로 초기화됩니다. 되돌릴 수 없습니다.</p>
        </div>
      </motion.div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> 데이터 초기화</DialogTitle>
            <DialogDescription>정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="rounded-[10px]">취소</Button>
            <Button variant="destructive" onClick={() => { resetData(); setResetDialogOpen(false); }} className="rounded-[10px]">초기화</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
