import { Grade, WeightItem, EmployeeSnapshot, EvaluationItem } from '../types/hr';

export const DEPARTMENTS = ["관리팀", "영업팀", "생산팀"];

// 직위 서열 목록: 반장을 사원 위로 배치
export const POSITIONS = [
  "회장", "부회장", "사장", "부사장", "전무", "상무", "이사",
  "실장", "부장", "차장", "과장", "대리", "주임", "반장", "사원"
];

export const GRADES: Grade[] = ["S", "A", "B", "C", "D"];

// 정렬용 인덱스 매핑 (숫자가 작을수록 상위 직급)
export const POSITION_ORDER: Record<string, number> = {
  "회장": 1,
  "부회장": 2,
  "사장": 3,
  "부사장": 4,
  "전무": 5,
  "상무": 6,
  "이사": 7,
  "실장": 8,
  "부장": 9,
  "차장": 10,
  "과장": 11,
  "대리": 12,
  "주임": 13,
  "반장": 14, // 주임 아래, 사원 위
  "사원": 15
};

// 부서 정렬 순서
export const DEPT_ORDER: Record<string, number> = {
  "임원": 1,
  "관리팀": 2,
  "영업팀": 3,
  "생산팀": 4
};

// 직위별 평가 가중치 (역량 / 성과 / 자기계발 / 부하육성)
export const POSITION_WEIGHTS: Record<string, WeightItem> = {
  "실장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "부장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "차장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "과장": { competency: 0.60, performance: 0.40, selfDev: 0.00, mentoring: 0.00 },
  "대리": { competency: 0.60, performance: 0.40, selfDev: 0.00, mentoring: 0.00 },
  "주임": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "반장": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "사원": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 }
};

export function weightsFor(pos: string): WeightItem {
  return POSITION_WEIGHTS[pos] || { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 };
}

export function pointsFor(grade?: Grade | ""): number {
  switch (grade) {
    case "S": return 10;
    case "A": return 8;
    case "B": return 6;
    case "C": return 4;
    case "D": return 2;
    default: return 0;
  }
}

export function gradeFromScore(score: number): Grade | "" {
  if (score >= 91) return "S";
  if (score >= 81) return "A";
  if (score >= 71) return "B";
  if (score >= 61) return "C";
  if (score > 0) return "D";
  return "";
}

export function finalScore(pos: string, ev?: EvaluationItem): number {
  if (!ev) return 0;
  const w = weightsFor(pos);
  const c = typeof ev.competency === "number" ? ev.competency : 0;
  const p = typeof ev.performance === "number" ? ev.performance : 0;
  const s = typeof ev.selfDev === "number" ? ev.selfDev : 0;
  const m = typeof ev.mentoring === "number" ? ev.mentoring : 0;
  const adj = typeof ev.adjust === "number" ? ev.adjust : 0;

  // 점수가 하나도 입력되지 않은 경우 0
  if (ev.competency === "" && ev.performance === "" && ev.selfDev === "" && ev.mentoring === "") {
    return 0;
  }

  const base = (c * w.competency) + (p * w.performance) + (s * w.selfDev) + (m * w.mentoring);
  const total = Math.max(0, Math.min(100, base + adj));
  return Math.round(total * 10) / 10;
}

// 부서 및 직위 서열 기반 정렬 함수
export function sortByDeptAndPosition(a: EmployeeSnapshot, b: EmployeeSnapshot): number {
  const deptA = DEPT_ORDER[a.dept] || 99;
  const deptB = DEPT_ORDER[b.dept] || 99;
  if (deptA !== deptB) return deptA - deptB;

  const posA = POSITION_ORDER[a.position] || 99;
  const posB = POSITION_ORDER[b.position] || 99;
  if (posA !== posB) return posA - posB;

  // 직위까지 같으면 입사일자 순
  return (a.hire_date || "").localeCompare(b.hire_date || "");
}
