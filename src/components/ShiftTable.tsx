import { useMemo } from "react";
import {
  Employee, ShiftAssignment, ShiftType,
  getDayName, getDateKey, getDaysOffInWeek, getWeekNumber,
} from "@/lib/shiftTypes";

interface ShiftTableProps {
  employees: Employee[];
  days: Date[];
  assignments: ShiftAssignment;
  onToggleShift: (employeeId: string, dateKey: string) => void;
}

function ShiftCell({
  shift,
  reachedLimit,
  onClick,
}: {
  shift: ShiftType;
  reachedLimit: boolean;
  onClick: () => void;
}) {
  let cls = "w-full h-full flex items-center justify-center text-xs font-semibold rounded cursor-pointer transition-colors min-h-[36px] ";
  if (shift === "A") {
    cls += "bg-shift-a-bg text-shift-a";
  } else if (shift === "B") {
    cls += "bg-shift-b-bg text-shift-b";
  } else if (reachedLimit) {
    cls += "bg-warning-bg text-warning line-through";
  } else {
    cls += "bg-day-off text-day-off-foreground hover:bg-accent";
  }

  return (
    <td className="p-0.5">
      <div className={cls} onClick={onClick}>
        {shift === "A" ? "A" : shift === "B" ? "B" : reachedLimit ? "✕" : "–"}
      </div>
    </td>
  );
}

export function ShiftTable({ employees, days, assignments, onToggleShift }: ShiftTableProps) {
  const weekBoundaries = useMemo(() => {
    const boundaries = new Set<number>();
    for (let i = 1; i < days.length; i++) {
      if (getWeekNumber(days[i], days[0]) !== getWeekNumber(days[i - 1], days[0])) {
        boundaries.add(i);
      }
    }
    return boundaries;
  }, [days]);

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="sticky left-0 z-10 bg-primary px-3 py-2 text-left font-medium min-w-[140px]">Employee</th>
            {days.map((d, i) => (
              <th
                key={i}
                className={`px-1 py-2 text-center font-medium min-w-[40px] ${weekBoundaries.has(i) ? "border-l-2 border-primary-foreground/30" : ""}`}
              >
                <div className="text-[10px] opacity-70">{getDayName(d)}</div>
                <div>{d.getDate()}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, empIdx) => (
            <tr key={emp.id} className={empIdx % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              <td className="sticky left-0 z-10 px-3 py-2 font-medium bg-inherit border-r">
                {emp.name}
              </td>
              {days.map((d, i) => {
                const dateKey = getDateKey(d);
                const shift = assignments[emp.id]?.[dateKey] ?? null;
                const daysOff = getDaysOffInWeek(assignments, emp.id, d, days);
                const reachedLimit = !shift && daysOff > 2;
                return (
                  <ShiftCell
                    key={i}
                    shift={shift}
                    reachedLimit={reachedLimit}
                    onClick={() => onToggleShift(emp.id, dateKey)}
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
