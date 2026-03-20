"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { FinancialData } from "./types";
import { createDefaultData } from "./default-data";

const STORAGE_KEY = "financial-planner-data";

interface FinancialContextType {
  data: FinancialData;
  setData: (data: FinancialData) => void;
  updateData: (updater: (prev: FinancialData) => FinancialData) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

const FinancialContext = createContext<FinancialContextType | null>(null);

function loadData(): FinancialData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as FinancialData;
    }
  } catch {
    // corrupted data
  }
  return createDefaultData();
}

function saveData(data: FinancialData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full
  }
}

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<FinancialData>(createDefaultData);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDataState(loadData());
    setHydrated(true);
  }, []);

  const scheduleSave = useCallback((newData: FinancialData) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveData(newData), 500);
  }, []);

  const setData = useCallback(
    (newData: FinancialData) => {
      setDataState(newData);
      scheduleSave(newData);
    },
    [scheduleSave]
  );

  const updateData = useCallback(
    (updater: (prev: FinancialData) => FinancialData) => {
      setDataState((prev) => {
        const next = updater(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json) as FinancialData;
        if (parsed.fixedExpenses && parsed.loans) {
          setData(parsed);
          return true;
        }
      } catch {
        // invalid json
      }
      return false;
    },
    [setData]
  );

  const resetData = useCallback(() => {
    const fresh = createDefaultData();
    setData(fresh);
  }, [setData]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground animate-pulse">로딩 중...</div>
      </div>
    );
  }

  return (
    <FinancialContext.Provider value={{ data, setData, updateData, exportData, importData, resetData }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancialData(): FinancialContextType {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error("useFinancialData must be used within FinancialProvider");
  return ctx;
}
