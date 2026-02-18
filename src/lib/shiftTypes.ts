export type ShiftType = "A" | "B" | null;

export interface Employee {
  id: string;
  name: string;
}

export interface ShiftAssignment {
  [employeeId: string]: {
    [dateKey: string]: ShiftType;
  };
}

export interface EmployeeStats {
  totalWorked: number;
  groupA: number;
  groupB: number;
}

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "emp1", name: "Ahmed Al-Rashid" },
  { id: "emp2", name: "Sara Mahmoud" },
  { id: "emp3", name: "Omar Khalil" },
  { id: "emp4", name: "Fatima Hassan" },
  { id: "emp5", name: "Youssef Nabil" },
];

export const SHIFT_A_TIME = "06:30 – 15:00";
export const SHIFT_B_TIME = "14:00 – 22:30";

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getWeekNumber(date: Date, monthStart: Date): number {
  const startOfMonth = new Date(monthStart);
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDaysOffInWeek(
  assignments: ShiftAssignment,
  employeeId: string,
  date: Date,
  allDays: Date[]
): number {
  const weekNum = getWeekNumber(date, allDays[0]);
  const weekDays = allDays.filter(d => getWeekNumber(d, allDays[0]) === weekNum);
  let daysOff = 0;
  for (const d of weekDays) {
    const key = getDateKey(d);
    if (!assignments[employeeId]?.[key]) {
      daysOff++;
    }
  }
  return daysOff;
}

export function getEmployeeStats(
  assignments: ShiftAssignment,
  employeeId: string,
  allDays: Date[]
): EmployeeStats {
  let totalWorked = 0, groupA = 0, groupB = 0;
  for (const d of allDays) {
    const key = getDateKey(d);
    const shift = assignments[employeeId]?.[key];
    if (shift === "A") { totalWorked++; groupA++; }
    if (shift === "B") { totalWorked++; groupB++; }
  }
  return { totalWorked, groupA, groupB };
}
