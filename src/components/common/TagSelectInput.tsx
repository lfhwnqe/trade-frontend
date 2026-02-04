import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type TagSelectInputProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  presets: readonly string[];
  placeholder?: string;
  readOnly?: boolean;
  maxTags?: number;
  storageKey?: string;
  showAddButton?: boolean;
  containerClassName?: string;
  chipClassName?: string;
  inputClassName?: string;
  popoverClassName?: string;
  suggestionClassName?: string;
  removeSuggestionClassName?: string;
};

export default function TagSelectInput({
  value,
  onChange,
  presets,
  placeholder,
  readOnly = false,
  maxTags = 3,
  storageKey = "trade-tags-suggestions",
  showAddButton = false,
  containerClassName,
  chipClassName,
  inputClassName,
  popoverClassName,
  suggestionClassName,
  removeSuggestionClassName,
}: TagSelectInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [customTags, setCustomTags] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tags = value ?? [];

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item) => `${item}`.trim())
          .filter((item) => item.length > 0);
        const filtered = normalized.filter((item) => !presets.includes(item));
        setCustomTags(Array.from(new Set(filtered)));
      }
    } catch (err) {
      console.warn("Failed to load tag suggestions", err);
    }
  }, [storageKey, presets]);

  const allPresets = React.useMemo(() => {
    const merged = [...presets, ...customTags.filter((tag) => !presets.includes(tag))];
    return Array.from(new Set(merged));
  }, [presets, customTags]);

  const persistSuggestions = React.useCallback(
    (next: string[]) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (err) {
        console.warn("Failed to save tag suggestions", err);
      }
    },
    [storageKey],
  );

  const removeCustomTag = React.useCallback(
    (tag: string) => {
      const next = customTags.filter((item) => item !== tag);
      setCustomTags(next);
      persistSuggestions(next);
    },
    [customTags, persistSuggestions],
  );

  const addTags = React.useCallback(
    (raw: string) => {
      if (readOnly) return;
      const items = raw
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      if (items.length === 0) return;
      const next = [...tags];
      items.forEach((item) => {
        if (next.length >= maxTags) return;
        if (!next.includes(item)) {
          next.push(item);
        }
      });
      if (next.length === tags.length) {
        setInputValue("");
        return;
      }
      onChange(next);
      setInputValue("");
      const mergedSuggestions = Array.from(
        new Set(
          [...customTags, ...next].filter((tag) => !presets.includes(tag)),
        ),
      );
      setCustomTags(mergedSuggestions);
      persistSuggestions(mergedSuggestions);
    },
    [readOnly, tags, maxTags, onChange, customTags, persistSuggestions],
  );

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            ref={triggerRef}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2",
              containerClassName,
            )}
            onClick={() => setOpen(true)}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                  chipClassName,
                )}
              >
                {tag}
                {!readOnly && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange(tags.filter((item) => item !== tag));
                    }}
                    aria-label={`移除标签 ${tag}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            <input
              readOnly={readOnly || tags.length >= maxTags}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTags(inputValue);
                }
              }}
              onBlur={() => addTags(inputValue)}
              placeholder={
                tags.length >= maxTags ? "最多 3 个标签" : placeholder
              }
              className={cn(
                "min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
                inputClassName,
              )}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("w-80 p-3", popoverClassName)}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            const target = event.target as Node | null;
            if (target && triggerRef.current?.contains(target)) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex flex-wrap gap-2">
            {allPresets.length === 0 && (
              <span className="text-xs text-muted-foreground">
                暂无可用标签
              </span>
            )}
            {allPresets.map((preset) => {
              const isCustom = customTags.includes(preset);
              return (
                <span
                  key={preset}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                    suggestionClassName,
                  )}
                >
                  <button
                    type="button"
                    className="text-current"
                    onClick={() => addTags(preset)}
                    disabled={readOnly || tags.length >= maxTags}
                    aria-label={`添加标签 ${preset}`}
                  >
                    {preset}
                  </button>
                  {!readOnly && isCustom && (
                    <button
                      type="button"
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        removeSuggestionClassName,
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeCustomTag(preset);
                      }}
                      aria-label={`删除历史标签 ${preset}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {!readOnly && showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTags(inputValue)}
          disabled={tags.length >= maxTags}
          className="w-fit"
        >
          添加
        </Button>
      )}
    </div>
  );
}
