import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Employee, ShiftAssignment,
  getDayName, getDateKey, getEmployeeStats,
  SHIFT_A_TIME, SHIFT_B_TIME,
} from "@/lib/shiftTypes";

interface ExportButtonProps {
  employees: Employee[];
  days: Date[];
  assignments: ShiftAssignment;
  monthLabel: string;
}

export function ExportButton({ employees, days, assignments, monthLabel }: ExportButtonProps) {
  const handleExport = () => {
    const rows: Record<string, string | number>[] = [];

    for (const d of days) {
      const dateKey = getDateKey(d);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      const dayName = getDayName(d);

      for (const emp of employees) {
        const shift = assignments[emp.id]?.[dateKey];
        rows.push({
          Date: dateStr,
          Day: dayName,
          Employee: emp.name,
          Shift: shift === "A" ? `Group A (${SHIFT_A_TIME})` : shift === "B" ? `Group B (${SHIFT_B_TIME})` : "Day Off",
        });
      }
    }

    // Add summary section
    rows.push({});
    rows.push({ Date: "MONTHLY SUMMARY", Day: "", Employee: "", Shift: "" });
    rows.push({ Date: "Employee", Day: "Days Worked", Employee: "Group A", Shift: "Group B" });

    for (const emp of employees) {
      const stats = getEmployeeStats(assignments, emp.id, days);
      rows.push({
        Date: emp.name,
        Day: stats.totalWorked,
        Employee: stats.groupA as unknown as string,
        Shift: stats.groupB as unknown as string,
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shifts");
    XLSX.writeFile(wb, `Shift_Schedule_${monthLabel.replace(" ", "_")}.xlsx`);
  };

  return (
    <Button onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Export to Excel
    </Button>
  );
}
