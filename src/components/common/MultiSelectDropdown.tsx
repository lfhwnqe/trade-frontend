"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
  color?: string;
};

type MultiSelectDropdownProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
  contentClassName?: string;
};

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "请选择",
  disabled = false,
  emptyText = "暂无可选项",
  className,
  contentClassName,
}: MultiSelectDropdownProps) {
  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const selectedOptions = React.useMemo(
    () => options.filter((item) => selectedSet.has(item.value)),
    [options, selectedSet],
  );

  const summary =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= 2
        ? selectedOptions.map((item) => item.label).join("、")
        : `已选择 ${selectedOptions.length} 项`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={[
            "flex h-10 w-full items-center justify-between border-white/10 bg-transparent text-left text-sm text-foreground hover:bg-white/5",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={[
          "w-[var(--radix-popover-trigger-width)] min-w-[260px] border-white/10 bg-[#0f0f10] p-2 text-foreground",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {options.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {options.map((item) => {
              const checked = selectedSet.has(item.value);
              return (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-white/5"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => {
                      if (nextChecked) {
                        onChange(Array.from(new Set([...value, item.value])));
                      } else {
                        onChange(value.filter((current) => current !== item.value));
                      }
                    }}
                    disabled={disabled}
                  />
                  {item.color ? (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                  ) : null}
                  <span className="flex-1 truncate">{item.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
