"use client";

import { useState, useCallback } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  hideCheckbox?: boolean;
  mode?: "multi" | "single";
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select...",
  className,
  hideCheckbox = false,
  mode = "multi",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = useCallback(
    (value: string) => {
      if (mode === "single") {
        onChange(selectedValues.includes(value) ? [] : [value]);
        setOpen(false);
      } else {
        if (selectedValues.includes(value)) {
          onChange(selectedValues.filter((v) => v !== value));
        } else {
          onChange([...selectedValues, value]);
        }
      }
    },
    [selectedValues, onChange, mode]
  );

  const clearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <span className="flex-1 text-left truncate">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span className="flex items-center gap-1 flex-wrap">
                {selectedValues.length <= 2 ? (
                  selectedLabels.map((label, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {selectedValues.length} selected
                  </Badge>
                )}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {selectedValues.length > 0 && (
              <X
                size={14}
                className="text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              />
            )}
            <ChevronsUpDown size={16} className="text-muted-foreground shrink-0" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggleOption(opt.value)}
                  >
                    {!hideCheckbox && (
                      <Check
                        size={16}
                        className={cn(
                          "mr-2 shrink-0",
                          isChecked ? "opacity-100" : "opacity-0"
                        )}
                      />
                    )}
                    <span>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
