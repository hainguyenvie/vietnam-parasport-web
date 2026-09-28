"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Matcher } from "react-day-picker"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  locale?: "vi" | "en"
  className?: string
  disabled?: boolean
  disabledDays?: Matcher | Matcher[]
}

function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  locale = "vi",
  className,
  disabled,
  disabledDays,
}: DatePickerProps) {
  const dateLocale = locale === "vi" ? vi : enUS

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(value, "dd/MM/yyyy", { locale: dateLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={dateLocale}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
