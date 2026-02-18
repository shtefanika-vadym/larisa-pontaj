import { Employee, ShiftAssignment, getEmployeeStats } from "@/lib/shiftTypes";

interface AnalyticsDashboardProps {
  employees: Employee[];
  days: Date[];
  assignments: ShiftAssignment;
}

export function AnalyticsDashboard({ employees, days, assignments }: AnalyticsDashboardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Monthly Summary</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">Employee</th>
              <th className="text-center py-2 px-3 font-medium">Days Worked</th>
              <th className="text-center py-2 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-shift-a" /> Group A
                </span>
              </th>
              <th className="text-center py-2 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-shift-b" /> Group B
                </span>
              </th>
              <th className="text-center py-2 px-3 font-medium">Days Off</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const stats = getEmployeeStats(assignments, emp.id, days);
              const daysOff = days.length - stats.totalWorked;
              return (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-3 font-medium">{emp.name}</td>
                  <td className="py-2 px-3 text-center font-semibold">{stats.totalWorked}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-shift-a-bg text-shift-a rounded px-2 py-0.5 font-semibold text-xs">
                      {stats.groupA}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-shift-b-bg text-shift-b rounded px-2 py-0.5 font-semibold text-xs">
                      {stats.groupB}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{daysOff}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
