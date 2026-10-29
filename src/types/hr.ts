export type Grade = "S" | "A" | "B" | "C" | "D";
export type StatusType = "재직" | "휴직" | "퇴직";

export interface WeightItem {
  competency: number;
  performance: number;
  selfDev: number;
  mentoring: number;
}

export interface EmployeeSnapshot {
  _rowId?: string; // 렌더링 포커스 유지용 고유 불변 키
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
