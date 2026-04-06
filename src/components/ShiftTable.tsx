import { useMemo } from "react";
import {
  Employee, ShiftAssignment, ShiftType,
  getDayName, getDateKey, getDaysOffInWeek, getWeekNumber,
  getISOWeekNumber, getISOWeeksInYear,
} from "@/lib/shiftTypes";
import { WeekExportButton } from "@/components/ExportButton";

interface ShiftTableProps {
  employees: Employee[];
  days: Date[];
  monthDays: Date[];
  viewYear: number;
  viewMonth: number;
  holidays: Map<string, string>;
  assignments: ShiftAssignment;
  onToggleShift: (employeeId: string, dateKey: string) => void;
}

function ShiftCell({
  shift,
  reachedLimit,
  onClick,
  isHoliday,
  isWeekBoundary,
}: {
  shift: ShiftType;
  reachedLimit: boolean;
  onClick: () => void;
  isHoliday: boolean;
  isWeekBoundary?: boolean;
}) {
  let cls = "w-full h-full flex items-center justify-center text-xs font-semibold rounded cursor-pointer transition-colors min-h-[32px] sm:min-h-[36px] ";

  if (shift === "A") {
    cls += "bg-blue-500 text-white font-bold text-base";
  } else if (shift === "B") {
    cls += "bg-orange-500 text-white font-bold text-base";
  } else if (reachedLimit) {
    cls += "bg-red-100 text-red-600 line-through";
  } else {
    cls += "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200";
  }

  return (
    <td className={`p-0.5 ${isWeekBoundary ? "border-l-4 border-gray-900" : ""}`}>
      <div className={cls} onClick={onClick}>
        {shift === "A" ? "1" : shift === "B" ? "2" : reachedLimit ? "✕" : "–"}
      </div>
    </td>
  );
}

export function ShiftTable({ employees, days, monthDays, viewYear, viewMonth, holidays, assignments, onToggleShift }: ShiftTableProps) {

  // Group days into Mon-Sun chunks for per-week export buttons
  const weekChunks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  const weekBoundaries = useMemo(() => {
    const boundaries = new Set<number>();
    for (let i = 0; i < days.length; i++) {
      const dayOfWeek = days[i].getDay();
      // Check if it's Monday (1) and not the first day
      if (dayOfWeek === 1 && i > 0) {
        boundaries.add(i);
      }
    }
    return boundaries;
  }, [days]);

  const weekColors = [
    "bg-blue-600 text-white",
    "bg-green-500 text-white",
    "bg-amber-600 text-white",
    "bg-rose-600 text-white",
    "bg-cyan-600 text-white",
    "bg-indigo-600 text-white",
  ];

  const getWeekColor = (dayIndex: number) => {
    const date = days[dayIndex];
    const weekNum = getWeekNumber(date, days[0]);
    // weekNum is 1-based, convert to 0-based index for colors array
    return weekColors[(weekNum - 1) % weekColors.length];
  };

  const isHoliday = (date: Date): boolean => {
    const dateKey = getDateKey(date);
    return holidays.has(dateKey);
  };

  const getHolidayName = (date: Date): string | undefined => {
    const dateKey = getDateKey(date);
    return holidays.get(dateKey);
  };

  const isCurrentMonth = (date: Date): boolean =>
    date.getFullYear() === viewYear && date.getMonth() === viewMonth;

  // Only use current-month days for the weekly days-off count.
  // This prevents unloaded overflow data (other months) from inflating daysOff
  // and incorrectly triggering the ✕ limit indicator on current-month cells.
  const currentMonthDays = useMemo(
    () => days.filter(d => d.getFullYear() === viewYear && d.getMonth() === viewMonth),
    [days, viewYear, viewMonth]
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-800 text-white px-2 sm:px-3 py-2 text-left font-medium min-w-[90px] sm:min-w-[140px]">Angajat</th>
            {days.map((d, i) => {
              const holiday = isHoliday(d);
              const holidayName = getHolidayName(d);
              const otherMonth = !isCurrentMonth(d);
              const baseColor = otherMonth
                ? "bg-gray-500 text-white opacity-50"
                : holiday
                ? "bg-red-700 text-white shadow-lg border-2 border-red-900"
                : getWeekColor(i);

              const isMonday = d.getDay() === 1;
              const isSunday = d.getDay() === 0;
              const isoWeek = isMonday ? getISOWeekNumber(d) : null;
              const weeksInYear = isMonday ? getISOWeeksInYear(d.getFullYear()) : null;
              const chunkIndex = (isMonday || isSunday)
                ? weekChunks.findIndex(chunk => chunk.some(cd => getDateKey(cd) === getDateKey(d)))
                : -1;
              const weekChunk = chunkIndex >= 0 ? weekChunks[chunkIndex] : null;

              return (
                <th
                  key={i}
                  className={`relative px-0.5 sm:px-1 py-1 sm:py-2 text-center font-medium min-w-[30px] sm:min-w-[40px] ${baseColor} ${weekBoundaries.has(i) && !holiday ? "border-l-4 border-gray-900" : ""}`}
                  title={holiday ? holidayName : undefined}
                >
                  {isSunday && weekChunk && (
                    <div className="absolute bottom-0.5 right-0.5 z-10">
                      <WeekExportButton
                        weekDays={weekChunk}
                        employees={employees}
                        assignments={assignments}
                        viewYear={viewYear}
                        viewMonth={viewMonth}
                      />
                    </div>
                  )}
                  <div className="text-[9px] sm:text-[10px] opacity-70">{getDayName(d)}</div>
                  <div className={`text-xs sm:text-sm ${holiday ? "font-bold" : ""}`}>{d.getDate()}</div>
                  <div className="text-[9px] font-normal mt-0.5">{holiday && !otherMonth ? "🎉" : "\u00A0"}</div>
                  <div className="text-[8px] sm:text-[9px] font-bold opacity-90 leading-none whitespace-nowrap">
                    {isoWeek !== null ? `S${isoWeek}/${weeksInYear}` : "\u00A0"}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, empIdx) => (
            <tr key={emp.id} className={empIdx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              <td className={`sticky left-0 z-10 px-2 sm:px-3 py-1 sm:py-2 font-medium border-r ${empIdx % 2 === 0 ? "bg-card" : "bg-muted"}`}>
                <div className="font-medium text-xs sm:text-sm leading-tight">{emp.name}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">{emp.position}</div>
              </td>
              {days.map((d, i) => {
                const dateKey = getDateKey(d);
                const shift = assignments[emp.id]?.[dateKey] ?? null;
                const currentMonthCell = isCurrentMonth(d);
                const daysOff = currentMonthCell
                  ? getDaysOffInWeek(assignments, emp.id, d, currentMonthDays)
                  : 0;
                const reachedLimit = !shift && daysOff > 2;
                return (
                  <ShiftCell
                    key={i}
                    shift={shift}
                    reachedLimit={reachedLimit}
                    onClick={() => onToggleShift(emp.id, dateKey)}
                    isHoliday={isHoliday(d)}
                    isWeekBoundary={weekBoundaries.has(i)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
