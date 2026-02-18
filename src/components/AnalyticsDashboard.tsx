import { useState } from "react";
import { Employee, ShiftAssignment, getEmployeeStats, POSITIONS } from "@/lib/shiftTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GripVertical, Trash2, Plus } from "lucide-react";

interface AnalyticsDashboardProps {
  employees: Employee[];
  days: Date[];
  assignments: ShiftAssignment;
  onChange?: (employees: Employee[]) => void;
  onAdd?: (employee: Employee) => void;
  onRemove?: (employeeId: string) => void;
}

export function AnalyticsDashboard({
  employees,
  days,
  assignments,
  onChange,
  onAdd,
  onRemove
}: AnalyticsDashboardProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePosition, setNewEmployeePosition] = useState<string>(POSITIONS[1]);

  const updateName = (id: string, name: string) => {
    if (onChange) {
      onChange(employees.map(e => e.id === id ? { ...e, name } : e));
    }
  };

  const updatePosition = (id: string, position: string) => {
    if (onChange) {
      onChange(employees.map(e => e.id === id ? { ...e, position } : e));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex || !onChange) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newEmployees = [...employees];
    const draggedEmployee = newEmployees[draggedIndex];

    newEmployees.splice(draggedIndex, 1);
    newEmployees.splice(dropIndex, 0, draggedEmployee);

    onChange(newEmployees);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDeleteClick = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete && onRemove) {
      onRemove(employeeToDelete.id);
    }
    setShowDeleteDialog(false);
    setEmployeeToDelete(null);
  };

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim() || !onAdd) return;

    const newEmployee: Employee = {
      id: `emp${Date.now()}`,
      name: newEmployeeName.trim(),
      position: newEmployeePosition,
    };

    onAdd(newEmployee);

    setNewEmployeeName("");
    setNewEmployeePosition(POSITIONS[1]);
    setShowAddForm(false);
  };
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Sumar Lunar & Management Angajați</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="w-8"></th>
              <th className="text-left py-2 px-3 font-medium">Angajat</th>
              <th className="text-left py-2 px-3 font-medium">Funcție</th>
              <th className="text-center py-2 px-3 font-medium">Zile Lucrate</th>
              <th className="text-center py-2 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Tura 1
                </span>
              </th>
              <th className="text-center py-2 px-3 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Tura 2
                </span>
              </th>
              <th className="text-center py-2 px-3 font-medium">Zile Libere</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => {
              const stats = getEmployeeStats(assignments, emp.id, days);
              const daysOff = days.length - stats.totalWorked;
              const isMateiLarisa = emp.name === "Matei Larisa";

              return (
                <tr
                  key={emp.id}
                  draggable={onChange !== undefined}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-b last:border-0 transition-colors ${
                    draggedIndex === index ? "opacity-50" : ""
                  } ${
                    dragOverIndex === index && draggedIndex !== index
                      ? "bg-accent border-2 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <td className="py-2 px-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  </td>
                  <td className="py-2 px-3">
                    {editingName === emp.id ? (
                      <Input
                        value={emp.name}
                        onChange={(e) => updateName(emp.id, e.target.value)}
                        onBlur={() => setEditingName(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingName(null)}
                        autoFocus
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div
                        onClick={() => onChange && setEditingName(emp.id)}
                        className={`font-medium ${onChange ? "cursor-pointer hover:text-primary" : ""}`}
                      >
                        {emp.name}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {editingPosition === emp.id ? (
                      <Select
                        value={emp.position}
                        onValueChange={(value) => {
                          updatePosition(emp.id, value);
                          setEditingPosition(null);
                        }}
                        onOpenChange={(open) => {
                          if (!open) setEditingPosition(null);
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((position) => {
                            const isSefMagazin = position === "SEF MAGAZIN";
                            if (isSefMagazin && !isMateiLarisa) return null;
                            if (isMateiLarisa && !isSefMagazin) return null;
                            return (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div
                        onClick={() => {
                          if (onChange && !isMateiLarisa) {
                            setEditingPosition(emp.id);
                          }
                        }}
                        className={`text-sm text-muted-foreground ${
                          onChange && !isMateiLarisa
                            ? "cursor-pointer hover:text-primary"
                            : isMateiLarisa
                            ? "opacity-70"
                            : ""
                        }`}
                      >
                        {emp.position}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-semibold">{stats.totalWorked}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-blue-500 text-white rounded px-2 py-0.5 font-semibold text-xs">
                      {stats.groupA}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-orange-500 text-white rounded px-2 py-0.5 font-semibold text-xs">
                      {stats.groupB}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{daysOff}</td>
                  <td className="py-2 px-2">
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(emp)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Employee Form */}
      {onAdd && (
        showAddForm ? (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nume angajat"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                className="h-9"
              />
              <Select
                value={newEmployeePosition}
                onValueChange={setNewEmployeePosition}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.filter(p => p !== "SEF MAGAZIN").map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddEmployee}
                disabled={!newEmployeeName.trim()}
                className="flex-1"
              >
                Adaugă
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewEmployeeName("");
                  setNewEmployeePosition(POSITIONS[1]);
                }}
                className="flex-1"
              >
                Anulează
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full mt-3 gap-2"
          >
            <Plus className="h-4 w-4" />
            Adaugă angajat nou
          </Button>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi angajatul <strong>{employeeToDelete?.name}</strong>?
              <br />
              Această acțiune va șterge și toate înregistrările de pontaj.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
