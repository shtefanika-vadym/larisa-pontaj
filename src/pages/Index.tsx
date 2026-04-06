import { useState, useCallback, useMemo, useEffect } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { ShiftTable } from "@/components/ShiftTable";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ExportButton } from "@/components/ExportButton";
import { EmployeeManager } from "@/components/EmployeeManager";
import {
  Employee, ShiftAssignment, ShiftType,
  getDaysInMonth, getMonthViewDays, getDateKey,
  SHIFT_A_TIME, SHIFT_B_TIME,
} from "@/lib/shiftTypes";
import { CalendarDays } from "lucide-react";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { useHolidays } from "@/hooks/useHolidays";

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

const Index = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const {
    employees,
    assignments,
    loading,
    saveEmployees,
    addEmployee,
    removeEmployee,
    saveAssignments,
    subscribeToMonthAssignments,
    saveAssignmentEntry,
  } = useFirebaseData(year, month);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const viewDays = useMemo(() => getMonthViewDays(year, month), [year, month]);
  const visibleMonthDays = useMemo(
    () => viewDays.filter(d => d.getFullYear() === year && d.getMonth() === month),
    [viewDays, year, month]
  );
  const holidays = useHolidays(viewDays);
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  // Detect overflow months (days from adjacent months shown in the view)
  const overflowMonths = useMemo(() => {
    const seen = new Map<string, { year: number; month: number }>();
    viewDays.forEach(d => {
      if (d.getFullYear() !== year || d.getMonth() !== month) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!seen.has(key)) seen.set(key, { year: d.getFullYear(), month: d.getMonth() });
      }
    });
    return Array.from(seen.values());
  }, [viewDays, year, month]);

  const [overflowAssignments, setOverflowAssignments] = useState<ShiftAssignment>({});

  useEffect(() => {
    if (overflowMonths.length === 0) {
      setOverflowAssignments({});
      return;
    }

    // Keep per-month data in a closure-local map so each onSnapshot callback
    // can update its slice and recompute the merged result.
    const dataMap: Record<string, ShiftAssignment> = {};

    const updateMerged = () => {
      const merged: ShiftAssignment = {};
      Object.values(dataMap).forEach((monthData) => {
        Object.entries(monthData).forEach(([empId, dates]) => {
          if (!merged[empId]) merged[empId] = {};
          Object.assign(merged[empId], dates);
        });
      });
      setOverflowAssignments(merged);
    };

    const unsubscribes = overflowMonths.map(({ year: y, month: m }) => {
      const key = `${y}-${m}`;
      dataMap[key] = {};
      return subscribeToMonthAssignments(y, m, (data) => {
        dataMap[key] = data;
        updateMerged();
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [overflowMonths, subscribeToMonthAssignments]);

  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

  const mergedAssignments = useMemo(() => {
    const result: ShiftAssignment = {};

    for (const source of [overflowAssignments, assignments]) {
      for (const [empId, dates] of Object.entries(source)) {
        if (!result[empId]) result[empId] = {};
        Object.assign(result[empId], dates);
      }
    }

    for (const [empId, dates] of Object.entries(overflowAssignments)) {
      for (const [dateKey, shift] of Object.entries(dates)) {
        if (!dateKey.startsWith(currentMonthPrefix)) {
          if (!result[empId]) result[empId] = {};
          result[empId][dateKey] = shift;
        }
      }
    }

    for (const [empId, dates] of Object.entries(assignments)) {
      for (const [dateKey, shift] of Object.entries(dates)) {
        if (dateKey.startsWith(currentMonthPrefix)) {
          if (!result[empId]) result[empId] = {};
          result[empId][dateKey] = shift;
        }
      }
    }

    return result;
  }, [assignments, overflowAssignments, currentMonthPrefix]);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
  }, []);

  const handleEmployeesChange = useCallback(
    (newEmployees: Employee[]) => {
      saveEmployees(newEmployees);
    },
    [saveEmployees]
  );

  const toggleShift = useCallback(
    (employeeId: string, dateKey: string) => {
      const current = mergedAssignments[employeeId]?.[dateKey] ?? null;
      const cycle: ShiftType[] = [null, "A", "B"];
      const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];

      const [keyYearStr, keyMonthStr] = dateKey.split("-");
      const keyYear = parseInt(keyYearStr);
      const keyMonth = parseInt(keyMonthStr) - 1; // 0-based

      if (keyYear === year && keyMonth === month) {
        // Current month: update state normally
        const updatedAssignments = {
          ...assignments,
          [employeeId]: { ...assignments[employeeId], [dateKey]: next },
        };
        saveAssignments(updatedAssignments, year, month);
      } else {
        // Overflow day: optimistic local update + save to the correct month
        setOverflowAssignments(prev => ({
          ...prev,
          [employeeId]: { ...prev[employeeId], [dateKey]: next },
        }));
        saveAssignmentEntry(employeeId, dateKey, next, keyYear, keyMonth);
      }
    },
    [mergedAssignments, assignments, year, month, saveAssignments, saveAssignmentEntry]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Se încarcă datele...</div>
          <div className="text-sm text-muted-foreground">Vă rugăm așteptați</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight">Planificator de Ture</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gestionarea lunară a turilor angajaților</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <MonthPicker year={year} month={month} onChange={handleMonthChange} />
            <ExportButton employees={employees} days={days} viewDays={viewDays} assignments={assignments} monthLabel={monthLabel} viewYear={year} viewMonth={month} />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
        {/* Legend */}
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <h3 className="text-xs font-semibold mb-2 sm:mb-3 text-muted-foreground uppercase tracking-wide">Legendă</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0">1</span>
              <div>
                <div className="font-medium text-xs sm:text-sm">Tura 1</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{SHIFT_A_TIME}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0">2</span>
              <div>
                <div className="font-medium text-xs sm:text-sm">Tura 2</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{SHIFT_B_TIME}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold text-sm sm:text-base shrink-0">–</span>
              <div>
                <div className="font-medium text-xs sm:text-sm">Zi Liberă</div>
                <div className="text-xs text-muted-foreground hidden sm:block">2 pe săptămână</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-red-100 flex items-center justify-center font-bold text-sm sm:text-base line-through text-red-600 shrink-0">✕</span>
              <div>
                <div className="font-medium text-xs sm:text-sm">Neconfigurat</div>
                <div className="text-xs text-muted-foreground hidden sm:block">Fără tură alocată</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 hidden sm:block">Apasă pe o celulă pentru a schimba: Liberă → Tura 1 → Tura 2 → Liberă.</p>
        </div>

        {/* Shift Table */}
        <ShiftTable
          employees={employees}
          days={viewDays}
          monthDays={days}
          viewYear={year}
          viewMonth={month}
          holidays={holidays}
          assignments={mergedAssignments}
          onToggleShift={toggleShift}
        />

        <AnalyticsDashboard
            employees={employees}
            days={days}
            assignments={mergedAssignments}
            holidays={holidays}
            onChange={handleEmployeesChange}
            onAdd={addEmployee}
            onRemove={removeEmployee}
        />
      </main>
    </div>
  );
};

export default Index;
