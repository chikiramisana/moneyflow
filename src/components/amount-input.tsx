"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
}

export function AmountInput({ value, onChange, placeholder = "0", className, prefix }: AmountInputProps) {
  const [display, setDisplay] = useState(value ? value.toLocaleString("ko-KR") : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? value.toLocaleString("ko-KR") : "");
    }
  }, [value, focused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, "");
      if (!raw) {
        setDisplay("");
        onChange(0);
        return;
      }
      const num = Number(raw);
      setDisplay(num.toLocaleString("ko-KR"));
      onChange(num);
    },
    [onChange]
  );

  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
      <Input
        value={display}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`${prefix ? "pl-8" : ""} ${className ?? ""} text-right`}
      />
    </div>
  );
}
