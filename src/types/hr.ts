export type Grade = "S" | "A" | "B" | "C" | "D";
export type StatusType = "재직" | "휴직" | "퇴직";

export interface WeightItem {
  competency: number;
  performance: number;
  selfDev: number;
  mentoring: number;
}

export interface EmployeeSnapshot {
  snapshot_year: number;
  emp_no: string;
  name: string;
  dept: string;
  position: string;
  birth_date?: string;
  hire_date?: string;
  promo_date?: string;
  retire_date?: string;
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
