import { useState, useCallback, useMemo } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { ShiftTable } from "@/components/ShiftTable";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ExportButton } from "@/components/ExportButton";
import { EmployeeManager } from "@/components/EmployeeManager";
import {
  Employee, ShiftAssignment, ShiftType,
  DEFAULT_EMPLOYEES, getDaysInMonth, getDateKey,
  SHIFT_A_TIME, SHIFT_B_TIME,
} from "@/lib/shiftTypes";
import { CalendarDays } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Index = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [assignments, setAssignments] = useState<ShiftAssignment>({});

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const handleMonthChange = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
  }, []);

  const toggleShift = useCallback((employeeId: string, dateKey: string) => {
    setAssignments((prev) => {
      const current = prev[employeeId]?.[dateKey] ?? null;
      const cycle: ShiftType[] = [null, "A", "B"];
      const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
      const next = cycle[nextIdx];

      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [dateKey]: next,
        },
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Shift Scheduler</h1>
              <p className="text-xs text-muted-foreground">Monthly employee shift management</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <MonthPicker year={year} month={month} onChange={handleMonthChange} />
            <ExportButton employees={employees} days={days} assignments={assignments} monthLabel={monthLabel} />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Legend + Employees side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <EmployeeManager employees={employees} onChange={setEmployees} />
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-4 h-full">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Legend</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-shift-a-bg text-shift-a flex items-center justify-center font-bold text-xs">A</span>
                  <div>
                    <div className="font-medium">Group A</div>
                    <div className="text-xs text-muted-foreground">{SHIFT_A_TIME}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-shift-b-bg text-shift-b flex items-center justify-center font-bold text-xs">B</span>
                  <div>
                    <div className="font-medium">Group B</div>
                    <div className="text-xs text-muted-foreground">{SHIFT_B_TIME}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-day-off text-day-off-foreground flex items-center justify-center font-bold text-xs">–</span>
                  <div>
                    <div className="font-medium">Day Off</div>
                    <div className="text-xs text-muted-foreground">Not assigned</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-warning-bg text-warning flex items-center justify-center font-bold text-xs line-through">✕</span>
                  <div>
                    <div className="font-medium">Limit Reached</div>
                    <div className="text-xs text-muted-foreground">2+ offs this week</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Click a cell to cycle: Off → A → B → Off. The table scrolls horizontally to show all days.</p>
            </div>
          </div>
        </div>

        {/* Shift Table */}
        <ShiftTable
          employees={employees}
          days={days}
          assignments={assignments}
          onToggleShift={toggleShift}
        />

        {/* Analytics */}
        <AnalyticsDashboard employees={employees} days={days} assignments={assignments} />
      </main>
    </div>
  );
};

export default Index;
