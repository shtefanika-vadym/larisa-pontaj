import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Employee, ShiftAssignment,
  getDayName, getDateKey, getEmployeeStats, getWeekNumber,
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
    const wb = XLSX.utils.book_new();

    // Group days by week (Monday to Sunday)
    const weeks: Date[][] = [[], [], [], []];
    let currentWeekIndex = 0;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // If it's Monday and not the first day, move to next week
      if (dayOfWeek === 1 && i > 0 && weeks[currentWeekIndex].length > 0) {
        currentWeekIndex++;
        if (currentWeekIndex >= 4) break; // Only 4 weeks
      }

      // Only start adding days from the first Monday
      if (currentWeekIndex === 0 && dayOfWeek !== 1 && weeks[0].length === 0) {
        continue; // Skip days before first Monday
      }

      if (currentWeekIndex < 4) {
        weeks[currentWeekIndex].push(day);
      }
    }

    // Create exactly 4 week sheets
    weeks.forEach((weekDays, weekIndex) => {
      if (weekDays.length === 0) return; // Skip empty weeks
      const weekData: any[] = [];

      // Create header row
      const header: any = {
        Angajat: 'Angajat',
        Funcție: 'Funcție',
      };

      weekDays.forEach(day => {
        const dayName = getDayName(day).substring(0, 1).toUpperCase(); // L, M, M, J, V, S, D
        const dayStr = String(day.getDate()).padStart(2, '0');
        const monthStr = String(day.getMonth() + 1).padStart(2, '0');
        const columnKey = `${dayName} ${dayStr}.${monthStr}`;
        header[columnKey] = columnKey;
      });

      weekData.push(header);

      // Add employee rows
      employees.forEach(emp => {
        const row: any = {
          Angajat: emp.name,
          Funcție: emp.position,
        };

        weekDays.forEach(day => {
          const dayName = getDayName(day).substring(0, 1).toUpperCase();
          const dayStr = String(day.getDate()).padStart(2, '0');
          const monthStr = String(day.getMonth() + 1).padStart(2, '0');
          const columnKey = `${dayName} ${dayStr}.${monthStr}`;

          const dateKey = getDateKey(day);
          const shift = assignments[emp.id]?.[dateKey];
          row[columnKey] = shift === "A" ? SHIFT_A_TIME : shift === "B" ? SHIFT_B_TIME : "L";
        });

        weekData.push(row);
      });

      const ws = XLSX.utils.json_to_sheet(weekData, { skipHeader: true });
      // Column widths: Angajat=28, Funcție=24, then day columns=18 each
      ws['!cols'] = [
        { wch: 28 },
        { wch: 24 },
        ...weekDays.map(() => ({ wch: 18 })),
      ];
      XLSX.utils.book_append_sheet(wb, ws, `Săptămâna ${weekIndex + 1}`);
    });

    // Create summary sheet
    const summaryData: any[] = [
      {
        Angajat: 'Angajat',
        Funcție: 'Funcție',
        'Zile Lucrate': 'Zile Lucrate',
        'Tura 1': 'Tura 1',
        'Tura 2': 'Tura 2',
        'Zile Libere': 'Zile Libere',
      }
    ];

    employees.forEach(emp => {
      const stats = getEmployeeStats(assignments, emp.id, days);
      const daysOff = days.length - stats.totalWorked;
      summaryData.push({
        Angajat: emp.name,
        Funcție: emp.position,
        'Zile Lucrate': stats.totalWorked,
        'Tura 1': stats.groupA,
        'Tura 2': stats.groupB,
        'Zile Libere': daysOff,
      });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
    wsSummary['!cols'] = [
      { wch: 28 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Sumar");

    // Generate filename
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const filename = `pontaj-${startDay}.${startMonth}-${endDay}.${endMonth}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <Button onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Exportă în Excel
    </Button>
  );
}
