"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [
  { label: "+30m", minutes: 30 },
  { label: "+1h", minutes: 60 },
  { label: "+2h", minutes: 120 },
  { label: "+4h", minutes: 240 },
] as const;

type ElapsedTimeBackfillProps = {
  baseTime: string;
  onApply: (value: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function ElapsedTimeBackfill({ baseTime, onApply, onError, disabled = false }: ElapsedTimeBackfillProps) {
  const [customMinutes, setCustomMinutes] = React.useState("120");

  const applyMinutes = React.useCallback((minutes: number) => {
    const nextValue = addMinutesToDateTime(baseTime, minutes);
    if (!nextValue) {
      onError?.("请先选择入场 / 考试开始时间");
      return;
    }
    onApply(nextValue);
  }, [baseTime, onApply, onError]);

  const handleCustomApply = React.useCallback(() => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      onError?.("请输入有效的经过分钟数");
      return;
    }
    applyMinutes(minutes);
  }, [applyMinutes, customMinutes, onError]);

  return (
    <div className="space-y-2 rounded-lg border border-[#27272a] bg-[#18181b] p-2">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <Button
            key={item.label}
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => applyMinutes(item.minutes)}
            className="h-7 border border-[#27272a] bg-[#1e1e1e] px-2 text-xs text-[#d4d4d8] hover:bg-[#27272a]"
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={customMinutes}
          onChange={(event) => setCustomMinutes(event.target.value)}
          inputMode="numeric"
          disabled={disabled}
          className="h-8 w-28 border border-[#27272a] bg-[#121212] text-xs text-[#e5e7eb]"
        />
        <span className="text-xs text-[#a1a1aa]">分钟后</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={handleCustomApply}
          className="h-8 border border-[#00c2b2]/40 bg-[#00c2b2]/10 px-3 text-xs text-[#67e8f9] hover:bg-[#00c2b2]/20"
        >
          回填
        </Button>
      </div>
    </div>
  );
}

function addMinutesToDateTime(value: string, minutes: number) {
  const base = parseDateTime(value);
  if (!base) return "";
  const next = new Date(base.getTime() + minutes * 60 * 1000);
  return formatDateTime(next);
}

function parseDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes("T") || /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [, yyyy, mm, dd, hh = "00", mi = "00", ss = "00"] = match;
  const parsed = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(mi),
    Number(ss),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value: Date) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const dd = String(value.getDate()).padStart(2, "0");
  const hh = String(value.getHours()).padStart(2, "0");
  const mi = String(value.getMinutes()).padStart(2, "0");
  const ss = String(value.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
