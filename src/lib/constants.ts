import { WeightItem, EmployeeSnapshot, EvaluationItem, Grade } from "../types/hr";

// 부서 구성 및 정렬 순서 고정: 임원 -> 관리팀 -> 영업팀 -> 생산팀
export const DEPARTMENTS = ["임원", "관리팀", "영업팀", "생산팀"] as const;

export const DEPT_ORDER: Record<string, number> = {
  "임원": 1,
  "관리팀": 2,
  "영업팀": 3,
  "생산팀": 4
};

export const POSITIONS = [
  "대표이사",
  "전무",
  "상무",
  "이사",
  "실장",
  "부장",
  "차장",
  "과장",
  "대리",
  "주임",
  "사원",
  "반장",
  "조장",
  "기사"
] as const;

export const POSITION_ORDER: Record<string, number> = {
  "대표이사": 1,
  "전무": 2,
  "상무": 3,
  "이사": 4,
  "실장": 5,
  "부장": 6,
  "차장": 7,
  "과장": 8,
  "대리": 9,
  "주임": 10,
  "사원": 11,
  "반장": 12,
  "조장": 13,
  "기사": 14
};

export const GRADES: Grade[] = ["S", "A", "B", "C", "D"];

export const GRADE_POINTS: Record<Grade, number> = {
  S: 10,
  A: 8,
  B: 6,
  C: 4,
  D: 2
};

export const GRADE_LIMITS = {
  S: { pct: 5, label: "5%" },
  A: { pct: 15, label: "15%" },
  B: { pct: 65, label: "65%" },
  C: { pct: 10, label: "10%" },
  D: { pct: 5, label: "5%" }
};

// DashboardCards용 목표 배분 비율 및 권장 인원 산출 함수
export const GRADE_TARGET_RATE: Record<Grade, number> = {
  S: 0.05,
  A: 0.15,
  B: 0.65,
  C: 0.10,
  D: 0.05
};

export function recommendedCount(total: number, grade: Grade): { rec: number; max: number } {
  const rate = GRADE_TARGET_RATE[grade];
  const rec = Math.round(total * rate * 10) / 10;
  const max = Math.round(total * rate);
  return { rec, max: Math.max(1, max) };
}

// 직급별 평가항목 가중치 산출기준표 완벽 일치 반영 (실장·부장·차장 통일)
export const WEIGHT_TABLE: Record<string, WeightItem> = {
  "실장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "부장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "차장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 }, // 차장: 역량 30%, 성과 60%, 자기계발 10% 반영
  "과장": { competency: 0.60, performance: 0.40, selfDev: 0.00, mentoring: 0.00 },
  "대리": { competency: 0.60, performance: 0.40, selfDev: 0.00, mentoring: 0.00 },
  "주임": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "사원": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "반장": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "조장": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "기사": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "임원": { competency: 0.00, performance: 0.80, selfDev: 0.10, mentoring: 0.10 } // 임원: 성과 80%, 자기계발 10%, 부하육성 10%
};

export function weightsFor(pos: string): WeightItem {
  if (pos === "대표이사" || pos === "전무" || pos === "상무" || pos === "이사") {
    return WEIGHT_TABLE["임원"];
  }
  return WEIGHT_TABLE[pos] || { competency: 0.5, performance: 0.5, selfDev: 0, mentoring: 0 };
}

export function finalScore(pos: string, item: EvaluationItem): number {
  const w = weightsFor(pos);
  const c = typeof item.competency === "number" ? item.competency : 0;
  const p = typeof item.performance === "number" ? item.performance : 0;
  const s = typeof item.selfDev === "number" ? item.selfDev : 0;
  const m = typeof item.mentoring === "number" ? item.mentoring : 0;
  const a = typeof item.adjust === "number" ? item.adjust : 0;
  
  const base = (c * w.competency) + (p * w.performance) + (s * w.selfDev) + (m * w.mentoring);
  const total = base + a;
  return Math.round(total * 10) / 10;
}

// 엑셀 수식 기반 점수별 등급 자동 판정 함수
// =IF(AE4>=91,"S",IF(AE4>=81,"A",IF(AE4>=71,"B",IF(AE4>=61,"C","D"))))
export function gradeFromScore(score: number): Grade | "" {
  if (score <= 0) return "";
  if (score >= 91) return "S";
  if (score >= 81) return "A";
  if (score >= 71) return "B";
  if (score >= 61) return "C";
  return "D";
}

export function pointsFor(grade?: Grade | ""): number {
  if (!grade) return 0;
  return GRADE_POINTS[grade] || 0;
}

// 부서 순서 (임원 -> 관리팀 -> 영업팀 -> 생산팀) 및 직위 순서 우선 정렬 헬퍼
export function sortByDeptAndPosition(a: EmployeeSnapshot, b: EmployeeSnapshot): number {
  const deptA = DEPT_ORDER[a.dept] || 99;
  const deptB = DEPT_ORDER[b.dept] || 99;
  if (deptA !== deptB) return deptA - deptB;

  const posA = POSITION_ORDER[a.position] || 99;
  const posB = POSITION_ORDER[b.position] || 99;
  if (posA !== posB) return posA - posB;

  return a.emp_no.localeCompare(b.emp_no);
}

// 기본 스냅샷 상수
export const DEFAULT_SNAPSHOT_2025: EmployeeSnapshot[] = [];
export const DEFAULT_SEED_2025: Record<string, EvaluationItem> = {};
