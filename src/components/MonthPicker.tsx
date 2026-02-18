import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const prev = () => {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  };
  const next = () => {
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={prev} aria-label="Luna anterioară">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm sm:text-lg font-semibold min-w-[120px] sm:min-w-[180px] text-center">
        {MONTH_NAMES[month]} {year}
      </span>
      <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={next} aria-label="Luna următoare">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
