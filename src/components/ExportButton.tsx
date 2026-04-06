import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Employee, ShiftAssignment,
  getDayName, getDateKey, getEmployeeStats,
  SHIFT_A_TIME, SHIFT_B_TIME,
  getISOWeekNumber, getISOWeeksInYear,
} from "@/lib/shiftTypes";

interface ExportButtonProps {
  employees: Employee[];
  days: Date[];      // current month only — used for summary calculations
  viewDays: Date[];  // full Mon–Sun weeks including adjacent month days
  assignments: ShiftAssignment;
  monthLabel: string;
  viewYear: number;
  viewMonth: number;
}

interface WeekExportButtonProps {
  weekDays: Date[];
  employees: Employee[];
  assignments: ShiftAssignment;
  viewYear: number;
  viewMonth: number;
}

export function WeekExportButton({ weekDays, employees, assignments, viewYear, viewMonth }: WeekExportButtonProps) {
  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const monday = weekDays.find(d => d.getDay() === 1) ?? weekDays[0];
    const isoWeek = getISOWeekNumber(monday);
    const weeksInYear = getISOWeeksInYear(monday.getFullYear());

    const isCurrentMonth = (d: Date) =>
      d.getFullYear() === viewYear && d.getMonth() === viewMonth;

    const headerFill: ExcelJS.Fill = {
      type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" },
    };
    const oddRowFill: ExcelJS.Fill = {
      type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9C4" },
    };

    const sheetName = `S${isoWeek} din ${weeksInYear}`;
    const ws = wb.addWorksheet(sheetName);

    const headerValues = [`Angajat  (S${isoWeek})`, "Funcție"];
    weekDays.forEach(day => {
      const dayName = getDayName(day).substring(0, 1).toUpperCase();
      const dayStr = String(day.getDate()).padStart(2, "0");
      const monthStr = String(day.getMonth() + 1).padStart(2, "0");
      headerValues.push(`${dayName} ${dayStr}.${monthStr}`);
    });

    const headerRow = ws.addRow(headerValues);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = headerFill;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    employees.forEach((emp, empIdx) => {
      const rowValues: (string | number)[] = [emp.name, emp.position];
      weekDays.forEach(day => {
        const shift = assignments[emp.id]?.[getDateKey(day)];
        rowValues.push(shift === "A" ? SHIFT_A_TIME : shift === "B" ? SHIFT_B_TIME : "L");
      });

      const row = ws.addRow(rowValues);
      const baseRowFill = empIdx % 2 !== 0 ? oddRowFill : null;

      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { vertical: "middle" };
      if (baseRowFill) {
        row.getCell(1).fill = baseRowFill;
        row.getCell(2).fill = baseRowFill;
      }

      weekDays.forEach((day, di) => {
        const cell = row.getCell(3 + di);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (!isCurrentMonth(day)) {
          cell.font = { italic: true, color: { argb: "FF9CA3AF" } };
          if (baseRowFill) cell.fill = baseRowFill;
        } else if (baseRowFill) {
          cell.fill = baseRowFill;
        }
      });
    });

    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 24;
    for (let c = 3; c <= 2 + weekDays.length; c++) ws.getColumn(c).width = 18;

    const startDay = String(monday.getDate()).padStart(2, "0");
    const startMonth = String(monday.getMonth() + 1).padStart(2, "0");
    const sunday = weekDays[weekDays.length - 1];
    const endDay = String(sunday.getDate()).padStart(2, "0");
    const endMonth = String(sunday.getMonth() + 1).padStart(2, "0");
    const filename = `program-S${isoWeek}-${startDay}.${startMonth}-${endDay}.${endMonth}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center justify-center w-4 h-4 rounded opacity-70 hover:opacity-100 hover:bg-white/20 transition-opacity"
      title="Descarcă săptămâna"
    >
      <Download className="w-2.5 h-2.5" />
    </button>
  );
}

export function ExportButton({ employees, days, viewDays, assignments, monthLabel, viewYear, viewMonth }: ExportButtonProps) {
  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();

    // Split viewDays into complete 7-day weeks (Mon–Sun)
    const weeks: Date[][] = [];
    for (let i = 0; i < viewDays.length; i += 7) {
      weeks.push(viewDays.slice(i, i + 7));
    }

    const isCurrentMonth = (d: Date) =>
      d.getFullYear() === viewYear && d.getMonth() === viewMonth;

    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    };
    const oddRowFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF9C4" },
    };
    weeks.forEach((weekDays, weekIndex) => {
      const monday = weekDays.find(d => d.getDay() === 1) ?? weekDays[0];
      const isoWeek = getISOWeekNumber(monday);
      const weeksInYear = getISOWeeksInYear(monday.getFullYear());
      const sheetName = `S${isoWeek} din ${weeksInYear}`;
      const ws = wb.addWorksheet(sheetName);

      // Header row
      const headerValues = [`Angajat  (S${isoWeek})`, "Funcție"];
      weekDays.forEach(day => {
        const dayName = getDayName(day).substring(0, 1).toUpperCase();
        const dayStr = String(day.getDate()).padStart(2, "0");
        const monthStr = String(day.getMonth() + 1).padStart(2, "0");
        headerValues.push(`${dayName} ${dayStr}.${monthStr}`);
      });

      const headerRow = ws.addRow(headerValues);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = headerFill;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Employee rows
      employees.forEach((emp, empIdx) => {
        const rowValues: (string | number)[] = [emp.name, emp.position];
        weekDays.forEach(day => {
          const dateKey = getDateKey(day);
          const shift = assignments[emp.id]?.[dateKey];
          rowValues.push(shift === "A" ? SHIFT_A_TIME : shift === "B" ? SHIFT_B_TIME : "L");
        });

        const row = ws.addRow(rowValues);
        const baseRowFill = empIdx % 2 !== 0 ? oddRowFill : null;

        // Bold name
        row.getCell(1).font = { bold: true };
        row.getCell(1).alignment = { vertical: "middle" };
        if (baseRowFill) {
          row.getCell(1).fill = baseRowFill;
          row.getCell(2).fill = baseRowFill;
        }

        // Day cells — grey out adjacent month days
        weekDays.forEach((day, di) => {
          const cell = row.getCell(3 + di);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (!isCurrentMonth(day)) {
            cell.font = { italic: true, color: { argb: "FF9CA3AF" } };
            if (baseRowFill) cell.fill = baseRowFill;
          } else if (baseRowFill) {
            cell.fill = baseRowFill;
          }
        });
      });

      // Column widths
      ws.getColumn(1).width = 28;
      ws.getColumn(2).width = 24;
      for (let c = 3; c <= 2 + weekDays.length; c++) {
        ws.getColumn(c).width = 18;
      }
    });

    // Summary sheet — calculated on current month days only
    const wsSummary = wb.addWorksheet("Sumar");
    const summaryHeader = wsSummary.addRow([
      "Angajat", "Funcție", "Zile Lucrate", "Tura 1", "Tura 2", "Zile Libere",
    ]);
    summaryHeader.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = headerFill;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    employees.forEach((emp, empIdx) => {
      const stats = getEmployeeStats(assignments, emp.id, days);
      const daysOff = days.length - stats.totalWorked;
      const row = wsSummary.addRow([
        emp.name, emp.position,
        stats.totalWorked, stats.groupA, stats.groupB, daysOff,
      ]);
      if (empIdx % 2 !== 0) {
        row.eachCell(cell => { cell.fill = oddRowFill; });
      }
      row.getCell(1).font = { bold: true };
      for (let c = 3; c <= 6; c++) {
        row.getCell(c).alignment = { horizontal: "center", vertical: "middle" };
      }
    });

    wsSummary.getColumn(1).width = 28;
    wsSummary.getColumn(2).width = 24;
    for (let c = 3; c <= 6; c++) wsSummary.getColumn(c).width = 14;

    // Filename based on current month
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const startDay = String(startDate.getDate()).padStart(2, "0");
    const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
    const endDay = String(endDate.getDate()).padStart(2, "0");
    const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
    const filename = `pontaj-${startDay}.${startMonth}-${endDay}.${endMonth}.xlsx`;

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  };

  return (
    <Button onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Descarcă pontaj
    </Button>
  );
}
