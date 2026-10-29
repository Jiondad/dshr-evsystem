export type Grade = "S" | "A" | "B" | "C" | "D";
export type StatusType = "재직" | "휴직" | "퇴직";
export type UserRole = "LV0_ADMIN" | "LV1_EVALUATOR";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface WeightItem {
  competency: number;
  performance: number;
  selfDev: number;
  mentoring: number;
}

export interface EmployeeSnapshot {
  _rowId?: string;
  snapshot_year: number;
  emp_no: string;
  name: string;
  dept: string;
  position: string;
  birth_date?: string | null;
  hire_date?: string | null;
  promo_date?: string | null;
  retire_date?: string | null;
  status: StatusType;
  remarks?: string;
}

export interface EvaluationItem {
  competency: number | "";
  performance: number | "";
  selfDev: number | "";
  mentoring: number | "";
  adjust: number | "";
  adjustReason: string;
  grade: Grade | "";
  note: string;
}

export type SnapshotStore = Record<number, EmployeeSnapshot[]>;
export type EvalStore = Record<number, Record<string, EvaluationItem>>;
export type LockStore = Record<number, boolean>;
