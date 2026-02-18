import { useState, useEffect } from "react";
import axios from "axios";

interface Holiday {
  name: string;
  date: Array<{ date: string; weekday: string }>;
}

export function useHolidays(days: Date[]): Map<string, string> {
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (days.length === 0) return;

    const years = new Set<number>();
    days.forEach(d => years.add(d.getFullYear()));

    const holidayMap = new Map<string, string>();

    Promise.all(
      Array.from(years).map(year =>
        axios.get<Holiday[]>(`/api/holidays/${year}`)
          .then(({ data }) => {
            data.forEach(holiday => {
              holiday.date.forEach(dateInfo => {
                const [y, m, d] = dateInfo.date.split("/");
                const key = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                holidayMap.set(key, holiday.name);
              });
            });
          })
          .catch(() => {})
      )
    ).then(() => setHolidays(new Map(holidayMap)));
  }, [days]);

  return holidays;
}
