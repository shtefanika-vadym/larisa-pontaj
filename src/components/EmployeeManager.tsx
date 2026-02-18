import { useState } from "react";
import { Employee } from "@/lib/shiftTypes";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

interface EmployeeManagerProps {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
}

export function EmployeeManager({ employees, onChange }: EmployeeManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);

  const updateName = (id: string, name: string) => {
    onChange(employees.map(e => e.id === id ? { ...e, name } : e));
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Users className="h-4 w-4" /> Employees
      </h3>
      <div className="space-y-2">
        {employees.map((emp) => (
          <div key={emp.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5">{employees.indexOf(emp) + 1}.</span>
            {editing === emp.id ? (
              <Input
                value={emp.name}
                onChange={(e) => updateName(emp.id, e.target.value)}
                onBlur={() => setEditing(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                autoFocus
                className="h-8 text-sm"
              />
            ) : (
              <button
                onClick={() => setEditing(emp.id)}
                className="text-sm text-left hover:text-primary transition-colors flex-1 py-1"
              >
                {emp.name}
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">Click a name to edit</p>
    </div>
  );
}
