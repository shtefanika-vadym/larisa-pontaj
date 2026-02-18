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

export function getMonthViewDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Determine start: first Monday of the first week containing the month.
  // If month starts on Sunday (isolated single day before the first full Mon-Sun week), skip it.
  let startDate: Date;
  if (firstDayOfWeek === 0) {
    // Month starts on Sunday – start from the next Monday instead
    startDate = new Date(year, month, 2);
  } else if (firstDayOfWeek === 1) {
    // Month starts on Monday – start from day 1
    startDate = new Date(year, month, 1);
  } else {
    // Month starts on Tue–Sat – go back to the previous Monday (prev month days)
    startDate = new Date(year, month, 1);
    startDate.setDate(1 - (firstDayOfWeek - 1));
  }

  // Determine end: the first Sunday on or after the last day of the month.
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDay.getDay();
  const endDate = new Date(lastDay);
  if (lastDayOfWeek !== 0) {
    endDate.setDate(lastDay.getDate() + (7 - lastDayOfWeek));
  }

  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
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

export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function getISOWeeksInYear(year: number): number {
  // A year has 53 weeks if Dec 31 or Jan 1 falls on Thursday
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const day = dec31.getUTCDay() || 7;
  return day === 4 || (day === 3 && isLeapYear(year)) ? 53 : 52;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
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
