import { useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const label = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return { value, label };
});

function parseDateValue(value: string): Date | undefined {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function formatDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLabel(value: string): string {
  const date = parseDateValue(value);
  return date
    ? date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "Choose a date";
}

export function DateTimeDropdown({
  value,
  onChange,
  label,
  optional = false,
  dateTestId,
  timeTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  optional?: boolean;
  dateTestId?: string;
  timeTestId?: string;
}) {
  const [open, setOpen] = useState(false);
  const dateValue = value.slice(0, 10);
  const timeValue = value.includes("T") ? value.slice(11, 16) : "";
  const timeLabel = timeOptions.find((option) => option.value === timeValue)?.label || timeValue;

  return (
    <div className="space-y-2">
      <Label>{label}{optional ? " (Optional)" : ""}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between px-3 font-normal"
            data-testid={dateTestId}
          >
            <span className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={dateValue ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                {dateValue
                  ? `${formatDateLabel(dateValue)}${timeValue ? ` · ${timeLabel}` : ""}`
                  : `Choose ${label.toLowerCase()} date and time`}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start" sideOffset={8}>
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-sm font-semibold">{label} date and time</p>
            <p className="mt-1 text-xs text-muted-foreground">Pick a date, then choose a time.</p>
          </div>
          <Calendar
            mode="single"
            selected={parseDateValue(dateValue)}
            onSelect={(date) => {
              if (date) onChange(`${formatDateValue(date)}T${timeValue || "09:00"}`);
            }}
            initialFocus
            className="mx-auto"
          />
          <div className="border-t px-4 py-4">
            <Label className="mb-2 block" htmlFor={timeTestId ? `${timeTestId}-select` : undefined}>Time</Label>
            <Select
              value={timeValue || "09:00"}
              onValueChange={(nextTime) => {
                if (dateValue) onChange(`${dateValue}T${nextTime}`);
              }}
            >
              <SelectTrigger id={timeTestId ? `${timeTestId}-select` : undefined} data-testid={timeTestId}>
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 flex items-center justify-between gap-2">
              {optional && value ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Clear</Button>
              ) : <span />}
              <Button type="button" size="sm" className="min-w-20" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}