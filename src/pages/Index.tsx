import { useState, useCallback, useMemo, useEffect } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { ShiftTable } from "@/components/ShiftTable";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ExportButton } from "@/components/ExportButton";
import { EmployeeManager } from "@/components/EmployeeManager";
import {
  Employee, ShiftAssignment, ShiftType,
  getDaysInMonth, getDateKey,
  SHIFT_A_TIME, SHIFT_B_TIME,
} from "@/lib/shiftTypes";
import { CalendarDays } from "lucide-react";
import { useFirebaseData } from "@/hooks/useFirebaseData";

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
  } = useFirebaseData(year, month);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

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
      const current = assignments[employeeId]?.[dateKey] ?? null;
      const cycle: ShiftType[] = [null, "A", "B"];
      const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
      const next = cycle[nextIdx];

      const updatedAssignments = {
        ...assignments,
        [employeeId]: {
          ...assignments[employeeId],
          [dateKey]: next,
        },
      };

      saveAssignments(updatedAssignments, year, month);
    },
    [assignments, year, month, saveAssignments]
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
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Planificator de Ture</h1>
              <p className="text-xs text-muted-foreground">Gestionarea lunară a turilor angajaților</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <MonthPicker year={year} month={month} onChange={handleMonthChange} />
            <ExportButton employees={employees} days={days} assignments={assignments} monthLabel={monthLabel} />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Legend & Summary */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Legendă</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-base">1</span>
                  <div>
                    <div className="font-medium">Tura 1</div>
                    <div className="text-xs text-muted-foreground">{SHIFT_A_TIME}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold text-base">2</span>
                  <div>
                    <div className="font-medium">Tura 2</div>
                    <div className="text-xs text-muted-foreground">{SHIFT_B_TIME}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold text-base">–</span>
                  <div>
                    <div className="font-medium">Zi Liberă</div>
                    <div className="text-xs text-muted-foreground">2 pe săptămână</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded bg-red-100 flex items-center justify-center font-bold text-base line-through text-red-600">✕</span>
                  <div>
                    <div className="font-medium">Zi Neconfigurată</div>
                    <div className="text-xs text-muted-foreground">Fără tură alocată</div>
                  </div>
                </div>
              </div>
            <p className="text-xs text-muted-foreground mt-4">Apasă pe o celulă pentru a schimba: Liberă → Tura 1 → Tura 2 → Liberă. Tabelul se derulează orizontal pentru a arăta toate zilele.</p>
          </div>

          {/* Analytics */}
        </div>

        {/* Shift Table */}
        <ShiftTable
          employees={employees}
          days={days}
          assignments={assignments}
          onToggleShift={toggleShift}
        />

        <AnalyticsDashboard
            employees={employees}
            days={days}
            assignments={assignments}
            onChange={handleEmployeesChange}
            onAdd={addEmployee}
            onRemove={removeEmployee}
        />
      </main>
    </div>
  );
};

export default Index;
