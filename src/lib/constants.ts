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

export const WEIGHT_TABLE: Record<string, WeightItem> = {
  "실장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "부장": { competency: 0.30, performance: 0.60, selfDev: 0.10, mentoring: 0.00 },
  "차장": { competency: 0.50, performance: 0.50, selfDev: 0.00, mentoring: 0.00 },
  "과장": { competency: 0.60, performance: 0.40, selfDev: 0.00, mentoring: 0.00 },
  "대리": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "주임": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "사원": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "반장": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "조장": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "기사": { competency: 0.70, performance: 0.30, selfDev: 0.00, mentoring: 0.00 },
  "임원": { competency: 0.20, performance: 0.70, selfDev: 0.10, mentoring: 0.00 }
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

// 2025년 기본 사원 마스터 스냅샷
export const DEFAULT_SNAPSHOT_2025: EmployeeSnapshot[] = [
  // 관리팀
  { snapshot_year: 2025, emp_no: "010011", name: "김종현", dept: "관리팀", position: "실장", birth_date: "1975-02-06", hire_date: "2001-03-12", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "090005", name: "정승애", dept: "관리팀", position: "과장", birth_date: "1987-08-05", hire_date: "2009-08-06", promo_date: "2025-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "100007", name: "염지원", dept: "관리팀", position: "과장", birth_date: "1981-08-03", hire_date: "2010-05-25", promo_date: "2025-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "230003", name: "강현구", dept: "관리팀", position: "사원", birth_date: "1995-01-10", hire_date: "2023-10-01", promo_date: "2023-10-01", status: "재직", remarks: "" },

  // 영업팀
  { snapshot_year: 2025, emp_no: "010023", name: "이영숙", dept: "영업팀", position: "부장", birth_date: "1980-09-24", hire_date: "2001-08-20", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "130031", name: "유도근", dept: "영업팀", position: "부장", birth_date: "1980-11-16", hire_date: "2010-10-11", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "140017", name: "김영진", dept: "영업팀", position: "부장", birth_date: "1972-10-19", hire_date: "2014-09-01", promo_date: "2025-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "090007", name: "우국진", dept: "영업팀", position: "차장", birth_date: "1983-09-21", hire_date: "2009-08-24", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "150019", name: "김영민", dept: "영업팀", position: "차장", birth_date: "1984-01-25", hire_date: "2007-12-01", promo_date: "2023-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "220002", name: "박성진", dept: "영업팀", position: "과장", birth_date: "1983-12-11", hire_date: "2022-04-01", promo_date: "", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "180003", name: "김영수", dept: "영업팀", position: "과장", birth_date: "1984-07-19", hire_date: "2018-04-16", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "220003", name: "박우호", dept: "영업팀", position: "대리", birth_date: "1990-03-09", hire_date: "2018-04-16", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "220009", name: "허아름", dept: "영업팀", position: "사원", birth_date: "1991-12-23", hire_date: "2022-11-07", promo_date: "", status: "재직", remarks: "" },

  // 생산팀
  { snapshot_year: 2025, emp_no: "140004", name: "임의호", dept: "생산팀", position: "실장", birth_date: "1969-02-15", hire_date: "2014-02-17", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "250002", name: "박명기", dept: "생산팀", position: "차장", birth_date: "1979-11-22", hire_date: "2004-09-13", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "190002", name: "황진석", dept: "생산팀", position: "과장", birth_date: "1978-12-11", hire_date: "2014-07-01", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "190008", name: "정상진", dept: "생산팀", position: "대리", birth_date: "1978-05-16", hire_date: "2019-10-08", promo_date: "", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "080004", name: "이성하", dept: "생산팀", position: "대리", birth_date: "1977-11-03", hire_date: "2008-04-01", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "140010", name: "김성현", dept: "생산팀", position: "대리", birth_date: "1976-02-12", hire_date: "2014-06-30", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "190007", name: "이태섭", dept: "생산팀", position: "대리", birth_date: "1979-11-23", hire_date: "2010-05-03", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "030009", name: "박광순", dept: "생산팀", position: "대리", birth_date: "1979-11-01", hire_date: "2003-05-07", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "200001", name: "이송원", dept: "생산팀", position: "대리", birth_date: "1969-10-15", hire_date: "2014-04-14", promo_date: "2023-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "160010", name: "이규찬", dept: "생산팀", position: "대리", birth_date: "1971-12-29", hire_date: "2003-11-11", promo_date: "2024-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "250004", name: "김영순", dept: "생산팀", position: "주임", birth_date: "1966-01-14", hire_date: "2013-10-14", promo_date: "2023-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "250003", name: "조안근", dept: "생산팀", position: "주임", birth_date: "1974-04-08", hire_date: "2019-06-13", promo_date: "2022-01-01", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "060011", name: "김한일", dept: "생산팀", position: "사원", birth_date: "1968-11-01", hire_date: "2006-11-01", promo_date: "", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "100002", name: "박희강", dept: "생산팀", position: "사원", birth_date: "1974-08-20", hire_date: "2010-01-01", promo_date: "", status: "재직", remarks: "" },
  { snapshot_year: 2025, emp_no: "200002", name: "박권제", dept: "생산팀", position: "사원", birth_date: "1968-05-18", hire_date: "2020-05-01", promo_date: "", status: "재직", remarks: "" }
];

export const DEFAULT_SEED_2025: Record<string, EvaluationItem> = {};
