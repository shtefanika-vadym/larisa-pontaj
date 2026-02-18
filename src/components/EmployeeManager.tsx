import { useState } from "react";
import { Employee, POSITIONS } from "@/lib/shiftTypes";
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
import { Users, GripVertical, Trash2, Plus } from "lucide-react";

interface EmployeeManagerProps {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
  onAdd?: (employee: Employee) => void;
  onRemove?: (employeeId: string) => void;
}

export function EmployeeManager({ employees, onChange, onAdd, onRemove }: EmployeeManagerProps) {
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
    onChange(employees.map(e => e.id === id ? { ...e, name } : e));
  };

  const updatePosition = (id: string, position: string) => {
    onChange(employees.map(e => e.id === id ? { ...e, position } : e));
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

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newEmployees = [...employees];
    const draggedEmployee = newEmployees[draggedIndex];

    // Remove dragged item
    newEmployees.splice(draggedIndex, 1);

    // Insert at new position
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

    // Reset form
    setNewEmployeeName("");
    setNewEmployeePosition(POSITIONS[1]);
    setShowAddForm(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Users className="h-4 w-4" /> Angajați
      </h3>
      <div className="space-y-2">
        {employees.map((emp, index) => (
          <div
            key={emp.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2 rounded transition-colors ${
              draggedIndex === index ? "opacity-50" : ""
            } ${
              dragOverIndex === index && draggedIndex !== index
                ? "bg-accent border-2 border-primary"
                : "hover:bg-accent/50"
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
            <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{index + 1}.</span>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {editingName === emp.id ? (
                <Input
                  value={emp.name}
                  onChange={(e) => updateName(emp.id, e.target.value)}
                  onBlur={() => setEditingName(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingName(null)}
                  autoFocus
                  className="h-8 text-sm"
                  placeholder="Nume"
                />
              ) : (
                <button
                  onClick={() => setEditingName(emp.id)}
                  className="text-sm text-left hover:text-primary transition-colors py-1 truncate"
                >
                  {emp.name}
                </button>
              )}
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
                    <SelectValue placeholder="Selectează funcția" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((position) => {
                      // Matei Larisa can't change from SEF MAGAZIN
                      const isMateiLarisa = emp.name === "Matei Larisa";
                      const isSefMagazin = position === "SEF MAGAZIN";

                      // Hide SEF MAGAZIN for everyone except Matei Larisa
                      if (isSefMagazin && !isMateiLarisa) {
                        return null;
                      }

                      // Matei Larisa can only see SEF MAGAZIN
                      if (isMateiLarisa && !isSefMagazin) {
                        return null;
                      }

                      return (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <button
                  onClick={() => {
                    // Matei Larisa can't change position
                    if (emp.name !== "Matei Larisa") {
                      setEditingPosition(emp.id);
                    }
                  }}
                  className={`text-sm text-left transition-colors py-1 text-muted-foreground truncate ${
                    emp.name !== "Matei Larisa" ? "hover:text-primary cursor-pointer" : "cursor-not-allowed opacity-70"
                  }`}
                  disabled={emp.name === "Matei Larisa"}
                >
                  {emp.position}
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDeleteClick(emp)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Employee Form */}
      {showAddForm ? (
        <div className="mt-4 p-3 border rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-2">
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
                <SelectValue placeholder="Selectează funcția" />
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
      )}

      <p className="text-[11px] text-muted-foreground mt-3">
        Apasă pe nume sau funcție pentru a edita • Trage pentru a reordona
      </p>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi angajatul <strong>{employeeToDelete?.name}</strong>?
              <br />
              Această acțiune va șterge și toate înregistrările de pontaj pentru acest angajat.
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
