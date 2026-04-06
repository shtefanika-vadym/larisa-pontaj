import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee, ShiftAssignment, DEFAULT_EMPLOYEES } from "@/lib/shiftTypes";

export function useFirebaseData(year?: number, month?: number) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment>({});

  // Track loading for both data sources independently
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Derived loading state: true until both are finished
  const loading = !initialized || employeesLoading || assignmentsLoading;

  // 1. Initialize default employees if collection is empty
  useEffect(() => {
    const initializeEmployees = async () => {
      try {
        const snapshot = await getDocs(collection(db, "employees"));

        if (snapshot.empty) {
          console.log("Initializing default employees...");
          for (let i = 0; i < DEFAULT_EMPLOYEES.length; i++) {
            const emp = DEFAULT_EMPLOYEES[i];
            await setDoc(doc(db, "employees", emp.id), {
              ...emp,
              order: i,
            });
          }
        }
      } catch (error) {
        console.error("Error initializing employees:", error);
      } finally {
        setInitialized(true);
      }
    };

    initializeEmployees();
  }, []);

  // 2. Load employees from Firebase (Real-time)
  useEffect(() => {
    if (!initialized) return;

    // Use Firestore query for sorting directly if possible
    const q = query(collection(db, "employees"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const employeesData: Employee[] = [];
          snapshot.forEach((doc) => {
            employeesData.push({ ...doc.data() } as Employee);
          });

          setEmployees(employeesData);
          setEmployeesLoading(false);
        },
        (error) => {
          console.error("Error loading employees:", error);
          setEmployeesLoading(false); // Stop loading even on error
        }
    );

    return () => unsubscribe();
  }, [initialized]);

  // 3. Load assignments from Firebase for selected month (Real-time)
  useEffect(() => {
    if (year === undefined || month === undefined) {
      setAssignmentsLoading(false);
      return;
    }

    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    const unsubscribe = onSnapshot(
        doc(db, "assignments", monthKey),
        (docSnap) => {
          if (docSnap.exists()) {
            setAssignments(docSnap.data() as ShiftAssignment);
          } else {
            setAssignments({});
          }
          setAssignmentsLoading(false);
        },
        (error) => {
          console.error("Error loading assignments:", error);
          setAssignments({});
          setAssignmentsLoading(false);
        }
    );

    return () => unsubscribe();
  }, [year, month]);

  // --- Actions ---

  const saveEmployees = useCallback(async (employeesData: Employee[]) => {
    try {
      const batchPromises = employeesData.map((emp, index) => {
        const empWithOrder = { ...emp, order: index };
        return setDoc(doc(db, "employees", emp.id), empWithOrder);
      });
      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Error saving employees:", error);
      throw error;
    }
  }, []);

  const addEmployee = useCallback(async (employee: Employee) => {
    try {
      const employeeWithOrder = {
        ...employee,
        order: employees.length,
      };
      await setDoc(doc(db, "employees", employee.id), employeeWithOrder);
    } catch (error) {
      console.error("Error adding employee:", error);
      throw error;
    }
  }, [employees.length]);

  const removeEmployee = useCallback(async (employeeId: string) => {
    try {
      await deleteDoc(doc(db, "employees", employeeId));

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const assignmentDoc = await getDoc(doc(db, "assignments", monthKey));

      if (assignmentDoc.exists()) {
        const currentAssignments = assignmentDoc.data() as ShiftAssignment;
        const { [employeeId]: _, ...updatedAssignments } = currentAssignments;
        await setDoc(doc(db, "assignments", monthKey), updatedAssignments);
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      throw error;
    }
  }, []);

  const saveAssignments = useCallback(async (
      assignmentsData: ShiftAssignment,
      year: number,
      month: number
  ) => {
    try {
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      await setDoc(doc(db, "assignments", monthKey), assignmentsData);
    } catch (error) {
      console.error("Error saving assignments:", error);
      throw error;
    }
  }, []);

  const loadAssignmentsForMonth = useCallback(async (year: number, month: number) => {
    setAssignmentsLoading(true);
    try {
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const assignmentDoc = await getDoc(doc(db, "assignments", monthKey));

      if (assignmentDoc.exists()) {
        setAssignments(assignmentDoc.data() as ShiftAssignment);
      } else {
        setAssignments({});
      }
    } catch (error) {
      console.error("Error loading assignments for month:", error);
      setAssignments({});
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  const getMonthAssignments = useCallback(async (year: number, month: number): Promise<ShiftAssignment> => {
    try {
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const docSnap = await getDoc(doc(db, "assignments", monthKey));
      return docSnap.exists() ? (docSnap.data() as ShiftAssignment) : {};
    } catch (error) {
      console.error("Error fetching month assignments:", error);
      return {};
    }
  }, []);

  const saveAssignmentEntry = useCallback(async (
    employeeId: string,
    dateKey: string,
    shift: ShiftType,
    targetYear: number,
    targetMonth: number
  ) => {
    try {
      const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
      const docRef = doc(db, "assignments", monthKey);
      const docSnap = await getDoc(docRef);
      const existing = docSnap.exists() ? (docSnap.data() as ShiftAssignment) : {};
      const updated = {
        ...existing,
        [employeeId]: { ...existing[employeeId], [dateKey]: shift },
      };
      await setDoc(docRef, updated);
    } catch (error) {
      console.error("Error saving assignment entry:", error);
      throw error;
    }
  }, []);

  return {
    employees,
    assignments,
    loading,
    saveEmployees,
    addEmployee,
    removeEmployee,
    saveAssignments,
    loadAssignmentsForMonth,
    getMonthAssignments,
    saveAssignmentEntry,
  };
}
