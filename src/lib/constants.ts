import { WeightItem, EmployeeSnapshot, EvaluationItem, Grade } from "../types/hr";

// 요청하신 부서 구성 및 정렬 순서 고정: 임원 -> 관리팀 -> 영업팀 -> 생산팀
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

// 부서 순서 (임원 -> 관리팀 -> 영업팀 -> 생산팀) 우선 정렬 헬퍼
export function sortByDeptAndPosition(a: EmployeeSnapshot, b: EmployeeSnapshot): number {
  const deptA = DEPT_ORDER[a.dept] || 99;
  const deptB = DEPT_ORDER[b.dept] || 99;
  if (deptA !== deptB) return deptA - deptB;

  const posA = POSITION_ORDER[a.position] || 99;
  const posB = POSITION_ORDER[b.position] || 99;
  if (posA !== posB) return posA - posB;

  return a.emp_no.localeCompare(b.emp_no);
}

// 2025년 기본 사원 마스터 스냅샷 (부서 기준 재배치)
export const DEFAULT_SNAPSHOT_2025: EmployeeSnapshot[] = [
  // 관리팀
  { snapshot_year: 2025, emp_no: "DS-1001", name: "김종현", dept: "관리팀", position: "실장", birth_date: "1975-02-06", hire_date: "2001-03-12", promo_date: "2021-03-01", status: "재직", remarks: "경영총괄" },
  { snapshot_year: 2025, emp_no: "DS-1002", name: "정승애", dept: "관리팀", position: "과장", birth_date: "1987-08-05", hire_date: "2009-08-06", promo_date: "2022-03-01", status: "재직", remarks: "회계결산" },
  { snapshot_year: 2025, emp_no: "DS-1003", name: "염지원", dept: "관리팀", position: "과장", birth_date: "1981-08-03", hire_date: "2010-05-25", promo_date: "2023-03-01", status: "재직", remarks: "노무총무" },
  { snapshot_year: 2025, emp_no: "DS-1004", name: "강현구", dept: "관리팀", position: "사원", birth_date: "1995-01-10", hire_date: "2023-10-01", promo_date: "2024-01-15", status: "재직", remarks: "출납/전표" },

  // 영업팀
  { snapshot_year: 2025, emp_no: "DS-2001", name: "이영숙", dept: "영업팀", position: "부장", birth_date: "1980-09-24", hire_date: "2001-08-20", promo_date: "2020-03-01", status: "재직", remarks: "영업총괄" },
  { snapshot_year: 2025, emp_no: "DS-2002", name: "유도근", dept: "영업팀", position: "부장", birth_date: "1980-11-16", hire_date: "2010-10-11", promo_date: "2021-03-01", status: "재직", remarks: "유통관리" },
  { snapshot_year: 2025, emp_no: "DS-2003", name: "김영진", dept: "영업팀", position: "부장", birth_date: "1972-10-19", hire_date: "2014-09-01", promo_date: "2021-09-01", status: "재직", remarks: "신규수주" },
  { snapshot_year: 2025, emp_no: "DS-2004", name: "우국진", dept: "영업팀", position: "차장", birth_date: "1983-09-21", hire_date: "2009-08-24", promo_date: "2022-03-01", status: "재직", remarks: "특수강" },
  { snapshot_year: 2025, emp_no: "DS-2005", name: "김영민", dept: "영업팀", position: "차장", birth_date: "1984-01-25", hire_date: "2007-12-01", promo_date: "2022-09-01", status: "재직", remarks: "지방영업" },
  { snapshot_year: 2025, emp_no: "DS-2006", name: "박성진", dept: "영업팀", position: "과장", birth_date: "1983-12-11", hire_date: "2022-04-01", promo_date: "2022-03-01", status: "재직", remarks: "여신채권" },
  { snapshot_year: 2025, emp_no: "DS-2007", name: "김영수", dept: "영업팀", position: "과장", birth_date: "1984-07-19", hire_date: "2018-04-16", promo_date: "2024-01-01", status: "재직", remarks: "수주견적" },
  { snapshot_year: 2025, emp_no: "DS-2008", name: "배대호", dept: "영업팀", position: "과장", birth_date: "1982-01-05", hire_date: "2016-06-20", promo_date: "2025-01-01", status: "재직", remarks: "거래처개발" },
  { snapshot_year: 2025, emp_no: "DS-2009", name: "김상문", dept: "영업팀", position: "대리", birth_date: "1987-03-24", hire_date: "2021-08-01", promo_date: "2023-01-01", status: "재직", remarks: "영업지원" },

  // 생산팀 (기존 생산관리팀 인원도 생산팀으로 통합)
  { snapshot_year: 2025, emp_no: "DS-3001", name: "윤종길", dept: "생산팀", position: "부장", birth_date: "1976-08-27", hire_date: "2018-09-17", promo_date: "2024-01-01", status: "재직", remarks: "공정수급" },
  { snapshot_year: 2025, emp_no: "DS-3002", name: "김명수", dept: "생산팀", position: "차장", birth_date: "1982-12-08", hire_date: "2013-03-04", promo_date: "2023-01-01", status: "재직", remarks: "계획출하" },
  { snapshot_year: 2025, emp_no: "DS-3003", name: "백현아", dept: "생산팀", position: "대리", birth_date: "1994-08-16", hire_date: "2019-09-02", promo_date: "2024-01-01", status: "재직", remarks: "원자재관리" },
  { snapshot_year: 2025, emp_no: "DS-4001", name: "이명재", dept: "생산팀", position: "부장", birth_date: "1977-03-10", hire_date: "2007-06-18", promo_date: "2021-01-01", status: "재직", remarks: "포승공장 총괄" },
  { snapshot_year: 2025, emp_no: "DS-4002", name: "이상칠", dept: "생산팀", position: "차장", birth_date: "1976-07-28", hire_date: "2008-09-01", promo_date: "2022-01-01", status: "재직", remarks: "설비보전" },
  { snapshot_year: 2025, emp_no: "DS-4003", name: "김태연", dept: "생산팀", position: "과장", birth_date: "1984-06-25", hire_date: "2015-10-12", promo_date: "2023-01-01", status: "재직", remarks: "슬리터 1라인" },
  { snapshot_year: 2025, emp_no: "DS-4004", name: "김동주", dept: "생산팀", position: "과장", birth_date: "1986-04-18", hire_date: "2016-04-01", promo_date: "2024-01-01", status: "재직", remarks: "시어 1라인" },
  { snapshot_year: 2025, emp_no: "DS-4005", name: "박정환", dept: "생산팀", position: "반장", birth_date: "1988-11-09", hire_date: "2017-03-15", promo_date: "2022-01-01", status: "재직", remarks: "슬리터 반장" },
  { snapshot_year: 2025, emp_no: "DS-4006", name: "정진우", dept: "생산팀", position: "반장", birth_date: "1989-02-23", hire_date: "2018-05-02", promo_date: "2023-01-01", status: "재직", remarks: "시어 반장" },
  { snapshot_year: 2025, emp_no: "DS-4007", name: "최원석", dept: "생산팀", position: "조장", birth_date: "1992-09-14", hire_date: "2020-07-01", promo_date: "2023-07-01", status: "재직", remarks: "원자재 검수" },
  { snapshot_year: 2025, emp_no: "DS-4008", name: "한상철", dept: "생산팀", position: "조장", birth_date: "1993-05-30", hire_date: "2021-02-15", promo_date: "2024-01-01", status: "재직", remarks: "포장/출하" },
  { snapshot_year: 2025, emp_no: "DS-4009", name: "오동훈", dept: "생산팀", position: "기사", birth_date: "1995-12-03", hire_date: "2022-11-01", promo_date: "2022-11-01", status: "재직", remarks: "슬리터 오퍼레이터" },
  { snapshot_year: 2025, emp_no: "DS-4010", name: "장민수", dept: "생산팀", position: "기사", birth_date: "1996-08-19", hire_date: "2023-04-10", promo_date: "2023-04-10", status: "재직", remarks: "시어 오퍼레이터" },
  { snapshot_year: 2025, emp_no: "DS-4011", name: "황준혁", dept: "생산팀", position: "기사", birth_date: "1998-03-27", hire_date: "2024-02-01", promo_date: "2024-02-01", status: "재직", remarks: "천장크레인" },
  { snapshot_year: 2025, emp_no: "DS-4012", name: "강동원", dept: "생산팀", position: "기사", birth_date: "1999-10-15", hire_date: "2024-06-15", promo_date: "2024-06-15", status: "재직", remarks: "코일 야드관리" }
];

export const DEFAULT_SEED_2025: Record<string, EvaluationItem> = {};
