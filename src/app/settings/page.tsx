"use client";

import { useRef } from "react";
import { v4 as uuid } from "uuid";
import { useFinancialData } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AmountInput } from "@/components/amount-input";
import { Settings, Download, Upload, RotateCcw, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export default function SettingsPage() {
  const { data, updateData, exportData, importData, resetData } = useFinancialData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

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

  const handleReset = () => {
    resetData();
    setResetDialogOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6" />
        설정
      </h2>

      {/* 환율 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">환율 설정</CardTitle>
          <CardDescription>달러(USD) 결제 항목의 원화 환산에 사용됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>USD → KRW 환율</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$1 =</span>
              <AmountInput
                value={data.settings.exchangeRate}
                onChange={(v) =>
                  updateData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, exchangeRate: v },
                  }))
                }
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 자산 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자산 관리</CardTitle>
          <CardDescription>보유 자산 항목을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">{asset.name}</Label>
                <AmountInput
                  value={asset.amount}
                  onChange={(v) =>
                    updateData((prev) => ({
                      ...prev,
                      assets: prev.assets.map((a) =>
                        a.id === asset.id ? { ...a, amount: v } : a
                      ),
                    }))
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive mt-4"
                onClick={() =>
                  updateData((prev) => ({
                    ...prev,
                    assets: prev.assets.filter((a) => a.id !== asset.id),
                  }))
                }
              >
                삭제
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const name = prompt("자산 항목명을 입력하세요:");
              if (name) {
                updateData((prev) => ({
                  ...prev,
                  assets: [...prev.assets, { id: uuid(), name, amount: 0 }],
                }));
              }
            }}
          >
            자산 항목 추가
          </Button>
        </CardContent>
      </Card>

      {/* 데이터 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">데이터 관리</CardTitle>
          <CardDescription>데이터를 내보내거나 가져올 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              데이터 내보내기 (JSON)
            </Button>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                데이터 가져오기
              </Button>
            </div>
          </div>
          {importStatus === "success" && (
            <p className="text-sm text-green-600">데이터를 성공적으로 가져왔습니다.</p>
          )}
          {importStatus === "error" && (
            <p className="text-sm text-red-600">데이터 가져오기에 실패했습니다. 올바른 JSON 파일인지 확인해주세요.</p>
          )}

          <Separator />

          <div>
            <Button variant="destructive" onClick={() => setResetDialogOpen(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              데이터 초기화
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              모든 데이터가 기본값으로 초기화됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              데이터 초기화
            </DialogTitle>
            <DialogDescription>
              정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              초기화 전에 데이터를 내보내는 것을 권장합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleReset}>초기화</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
