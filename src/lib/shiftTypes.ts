export type ShiftType = "A" | "B" | null;

export interface Employee {
  id: string;
  name: string;
  position: string;
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
  { id: "emp1", name: "Matei Larisa", position: "SEF MAGAZIN" },
  { id: "emp2", name: "Cuziac Adelina-Valentina", position: "SEF TURA" },
  { id: "emp3", name: "Teodorovici Ramona-Carmen", position: "CASIER" },
  { id: "emp4", name: "Teodorovici Zinica", position: "CASIER" },
  { id: "emp5", name: "Moloci Lacramioara", position: "LUCRATOR COMERCIAL" },
  { id: "emp6", name: "Sterciuc Valeria-Mihaela", position: "VANZATOR COFFE CORNER" },
  { id: "emp7", name: "Graunceanu Mihai", position: "LUCRATOR COMERCIAL" },
  { id: "emp8", name: "Simionesi Elisabeta", position: "VANZATOR MEZELURI" },
  { id: "emp9", name: "Tibu Lucia", position: "VANZATOR MEZELURI" },
];

export const POSITIONS = [
  "SEF MAGAZIN",
  "SEF TURA",
  "CASIER",
  "LUCRATOR COMERCIAL",
  "VANZATOR COFFE CORNER",
  "VANZATOR MEZELURI",
] as const;

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
  // Get day of week for the date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();

  // Convert to ISO format where Monday = 1, Sunday = 7
  const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Find the Monday of the week containing this date
  const monday = new Date(date);
  monday.setDate(date.getDate() - (isoDayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  // Find the Monday of the week containing the first day of the month
  const firstDay = new Date(monthStart);
  firstDay.setHours(0, 0, 0, 0);
  const firstDayOfWeek = firstDay.getDay();
  const firstIsoDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;

  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - (firstIsoDayOfWeek - 1));
  firstMonday.setHours(0, 0, 0, 0);

  // Calculate the difference in weeks
  const diffTime = monday.getTime() - firstMonday.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

  return diffWeeks + 1;
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString("ro-RO", { weekday: "short" });
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
