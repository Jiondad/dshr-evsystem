import { Grade, EmployeeSnapshot } from '../types/hr';

export const GRADES: Grade[] = ["S", "A", "B", "C", "D"];
export const GRADE_POINTS: Record<Grade, number> = { S: 10, A: 8, B: 6, C: 4, D: 2 };
export const pointsFor = (g: Grade | "" | undefined): number => (g ? GRADE_POINTS[g] || 0 : 0);

export const GRADE_TARGET_RATE: Record<Grade, number> = { S: 5, A: 15, B: 65, C: 10, D: 5 };
export const recommendedCount = (n: number, g: Grade): string => (Math.round(n * (GRADE_TARGET_RATE[g] / 100) * 10) / 10).toFixed(1);

export const DEPARTMENTS = ["관리팀", "영업팀", "생산관리팀", "생산팀"];
export const POSITIONS = ["사장", "부사장", "전무", "상무", "이사", "실장", "부장", "차장", "과장", "대리", "주임", "사원"];

export function weightsFor(position: string) {
  if (["사장", "부사장", "전무", "상무", "이사"].includes(position)) {
    return { competency: 0, performance: 0.8, selfDev: 0.1, mentoring: 0.1 };
  }
  if (["실장", "부장", "차장"].includes(position)) {
    return { competency: 0.3, performance: 0.6, selfDev: 0.1, mentoring: 0 };
  }
  if (["과장", "대리"].includes(position)) {
    return { competency: 0.6, performance: 0.4, selfDev: 0, mentoring: 0 };
  }
  return { competency: 0.7, performance: 0.3, selfDev: 0, mentoring: 0 };
}

export function finalScore(position: string, ev: any): number {
  const w = weightsFor(position);
  const n = (v: any) => (v === "" || v === null || isNaN(v) ? 0 : parseFloat(v));
  const sum = (n(ev.competency) * w.competency) +
              (n(ev.performance) * w.performance) +
              (n(ev.selfDev) * w.selfDev) +
              (n(ev.mentoring) * w.mentoring);
  return Math.round((sum + n(ev.adjust)) * 10) / 10;
}

export const DEFAULT_SNAPSHOT_2025: EmployeeSnapshot[] = [
  { snapshot_year: 2025, emp_no: "DS-1001", name: "김종현", dept: "관리팀", position: "실장", birth_date: "1975-02-06", hire_date: "2001-03-12", promo_date: "2021-03-01", retire_date: "", status: "재직", remarks: "경영총괄" },
  { snapshot_year: 2025, emp_no: "DS-1002", name: "정승애", dept: "관리팀", position: "과장", birth_date: "1987-08-05", hire_date: "2009-08-06", promo_date: "2022-03-01", retire_date: "", status: "재직", remarks: "회계결산" },
  { snapshot_year: 2025, emp_no: "DS-1003", name: "염지원", dept: "관리팀", position: "과장", birth_date: "1981-08-03", hire_date: "2010-05-25", promo_date: "2023-03-01", retire_date: "", status: "재직", remarks: "노무총무" },
  { snapshot_year: 2025, emp_no: "DS-1004", name: "강현구", dept: "관리팀", position: "사원", birth_date: "1995-01-10", hire_date: "2023-10-01", promo_date: "2024-01-15", retire_date: "", status: "재직", remarks: "출납/전표" },
  { snapshot_year: 2025, emp_no: "DS-2001", name: "이영숙", dept: "영업팀", position: "부장", birth_date: "1980-09-24", hire_date: "2001-08-20", promo_date: "2020-03-01", retire_date: "", status: "재직", remarks: "영업총괄" },
  { snapshot_year: 2025, emp_no: "DS-2002", name: "유도근", dept: "영업팀", position: "부장", birth_date: "1980-11-16", hire_date: "2010-10-11", promo_date: "2021-03-01", retire_date: "", status: "재직", remarks: "유통관리" },
  { snapshot_year: 2025, emp_no: "DS-2003", name: "김영진", dept: "영업팀", position: "부장", birth_date: "1972-10-19", hire_date: "2014-09-01", promo_date: "2021-09-01", retire_date: "", status: "재직", remarks: "신규수주" },
  { snapshot_year: 2025, emp_no: "DS-2004", name: "우국진", dept: "영업팀", position: "차장", birth_date: "1983-09-21", hire_date: "2009-08-24", promo_date: "2022-03-01", retire_date: "", status: "재직", remarks: "특수강" },
  { snapshot_year: 2025, emp_no: "DS-2005", name: "김영민", dept: "영업팀", position: "차장", birth_date: "1984-01-25", hire_date: "2007-12-01", promo_date: "2022-09-01", retire_date: "", status: "재직", remarks: "지방영업" },
  { snapshot_year: 2025, emp_no: "DS-2006", name: "박성진", dept: "영업팀", position: "과장", birth_date: "1983-12-11", hire_date: "2022-04-01", promo_date: "2022-03-01", retire_date: "", status: "재직", remarks: "여신채권" },
  { snapshot_year: 2025, emp_no: "DS-2007", name: "김영수", dept: "영업팀", position: "과장", birth_date: "1984-07-19", hire_date: "2018-04-16", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "수주견적" },
  { snapshot_year: 2025, emp_no: "DS-2008", name: "배대호", dept: "영업팀", position: "과장", birth_date: "1982-01-05", hire_date: "2016-06-20", promo_date: "2025-01-01", retire_date: "", status: "재직", remarks: "거래처개발" },
  { snapshot_year: 2025, emp_no: "DS-2009", name: "김상문", dept: "영업팀", position: "대리", birth_date: "1987-03-24", hire_date: "2021-08-01", promo_date: "2023-01-01", retire_date: "", status: "재직", remarks: "영업지원" },
  { snapshot_year: 2025, emp_no: "DS-3001", name: "윤종길", dept: "생산관리팀", position: "부장", birth_date: "1976-08-27", hire_date: "2018-09-17", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "공정수급" },
  { snapshot_year: 2025, emp_no: "DS-3002", name: "김명수", dept: "생산관리팀", position: "차장", birth_date: "1982-12-08", hire_date: "2013-03-04", promo_date: "2023-01-01", retire_date: "", status: "재직", remarks: "계획출하" },
  { snapshot_year: 2025, emp_no: "DS-3003", name: "송병섭", dept: "생산관리팀", position: "대리", birth_date: "1994-06-21", hire_date: "2022-06-01", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "납기관리" },
  { snapshot_year: 2025, emp_no: "DS-4001", name: "조원일", dept: "생산팀", position: "부장", birth_date: "1980-07-28", hire_date: "2001-08-16", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "생산총괄" },
  { snapshot_year: 2025, emp_no: "DS-4002", name: "서재천", dept: "생산팀", position: "차장", birth_date: "1982-02-12", hire_date: "2008-09-01", promo_date: "2023-01-01", retire_date: "", status: "재직", remarks: "1공장가동" },
  { snapshot_year: 2025, emp_no: "DS-4003", name: "문정식", dept: "생산팀", position: "차장", birth_date: "1983-02-09", hire_date: "2010-09-01", promo_date: "2025-01-01", retire_date: "", status: "재직", remarks: "2공장설비" },
  { snapshot_year: 2025, emp_no: "DS-4004", name: "정태현", dept: "생산팀", position: "과장", birth_date: "1981-06-15", hire_date: "2011-09-01", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "슬리팅가공" },
  { snapshot_year: 2025, emp_no: "DS-4005", name: "안상호", dept: "생산팀", position: "과장", birth_date: "1981-12-07", hire_date: "2013-03-01", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "쉬어라인" },
  { snapshot_year: 2025, emp_no: "DS-4006", name: "송성민", dept: "생산팀", position: "과장", birth_date: "1985-05-24", hire_date: "2015-03-09", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "품질검사" },
  { snapshot_year: 2025, emp_no: "DS-4007", name: "김동훈", dept: "생산팀", position: "과장", birth_date: "1985-08-15", hire_date: "2017-01-02", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "현장관리" },
  { snapshot_year: 2025, emp_no: "DS-4008", name: "김영호", dept: "생산팀", position: "과장", birth_date: "1987-10-18", hire_date: "2017-08-01", promo_date: "2025-01-01", retire_date: "", status: "재직", remarks: "설비보전" },
  { snapshot_year: 2025, emp_no: "DS-4009", name: "문태환", dept: "생산팀", position: "과장", birth_date: "1987-03-04", hire_date: "2018-09-17", promo_date: "2025-01-01", retire_date: "", status: "재직", remarks: "오퍼레이팅" },
  { snapshot_year: 2025, emp_no: "DS-4010", name: "장민석", dept: "생산팀", position: "대리", birth_date: "1994-06-03", hire_date: "2021-06-01", promo_date: "2024-01-01", retire_date: "", status: "재직", remarks: "포장결속" },
  { snapshot_year: 2025, emp_no: "DS-4011", name: "김형진", dept: "생산팀", position: "주임", birth_date: "1994-07-28", hire_date: "2023-04-01", promo_date: "2025-01-01", retire_date: "", status: "재직", remarks: "자재운반" },
  { snapshot_year: 2025, emp_no: "DS-4012", name: "이현규", dept: "생산팀", position: "사원", birth_date: "1998-03-10", hire_date: "2023-12-01", promo_date: "2023-12-01", retire_date: "", status: "재직", remarks: "현장보조" }
];

export const DEFAULT_SEED_2025: Record<string, any> = {
  "DS-1001": { competency: 92, performance: 95, selfDev: 90, mentoring: "", adjust: 2, adjustReason: "전사 ERP 고도화 및 내부통", grade: "S", note: "핵심 관리역량 최우수 / 경영지원 총괄" },
  "DS-1002": { competency: 88, performance: 90, selfDev: "", mentoring: "", adjust: 1, adjustReason: "결산 자동화 프로세스 단축", grade: "A", note: "회계·세무 실무 핵심 인재" },
  "DS-1003": { competency: 82, performance: 84, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "노무 및 총무 안정적 운영" },
  "DS-1004": { competency: 79, performance: 80, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "신규 입사 후 빠른 업무 적응" },
  "DS-2001": { competency: 93, performance: 93, selfDev: 88, mentoring: "", adjust: 1.5, adjustReason: "신규 대형 철강 고객사 3곳", grade: "A", note: "영업1파트 매출 목표 110% 달성" },
  "DS-2002": { competency: 84, performance: 85, selfDev: 82, mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "기존 거래처 여신관리 양호" },
  "DS-2003": { competency: 81, performance: 83, selfDev: 80, mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "내수 유통망 안정적 유지" },
  "DS-2004": { competency: 89, performance: 91, selfDev: 86, mentoring: "", adjust: 1, adjustReason: "자동차 부품향 특수강 매출", grade: "A", note: "차기 부장 승진 핵심 후보" },
  "DS-2005": { competency: 80, performance: 82, selfDev: 79, mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "영남권 거점 거래처 관리" },
  "DS-2006": { competency: 83, performance: 85, selfDev: "", mentoring: "", adjust: 0.5, adjustReason: "미수채권 조기 회수 기여", grade: "B", note: "채권리스크 관리 우수" },
  "DS-2007": { competency: 78, performance: 79, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "수주 납기 대응 준수" },
  "DS-2008": { competency: 71, performance: 68, selfDev: "", mentoring: "", adjust: -1, adjustReason: "분반기 매출 목표 미달성", grade: "C", note: "신규 거래선 발굴 독려 필요" },
  "DS-2009": { competency: 82, performance: 81, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "영업지원 및 견적 응대 우수" },
  "DS-3001": { competency: 85, performance: 86, selfDev: 84, mentoring: "", adjust: 0.5, adjustReason: "원자재 재고 회전율 12% 개", grade: "B", note: "수급 계획 총괄 안정적 수행" },
  "DS-3002": { competency: 88, performance: 90, selfDev: 87, mentoring: "", adjust: 1, adjustReason: "코일 슬리팅 공정 리드타임", grade: "A", note: "생산계획 최적화 우수" },
  "DS-3003": { competency: 80, performance: 82, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "출하 배차 및 납기율 관리 양호" },
  "DS-4001": { competency: 84, performance: 86, selfDev: 82, mentoring: "", adjust: 0.5, adjustReason: "무재해 사업장 안전보건 목", grade: "B", note: "현장 안전 및 설비 총괄" },
  "DS-4002": { competency: 82, performance: 84, selfDev: 80, mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "1공장 라인 가동률 안정 유지" },
  "DS-4003": { competency: 79, performance: 81, selfDev: 78, mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "2공장 설비 예방보전 수행" },
  "DS-4004": { competency: 78, performance: 80, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "절단 정밀도 개선 기여" },
  "DS-4005": { competency: 80, performance: 82, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "야간 교대조 현장 리딩" },
  "DS-4006": { competency: 81, performance: 83, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "후판 가공 불량률 저감" },
  "DS-4007": { competency: 79, performance: 80, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "현장 5S 환경개선 주도" },
  "DS-4008": { competency: 78, performance: 79, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "설비 트러블 조기 조치" },
  "DS-4009": { competency: 77, performance: 78, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "신입 오퍼레이터 직무 교육" },
  "DS-4010": { competency: 81, performance: 82, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "B", note: "자동 결속기 운용 숙련" },
  "DS-4011": { competency: 72, performance: 70, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "C", note: "기본 작업수칙 숙지 지도" },
  "DS-4012": { competency: 68, performance: 65, selfDev: "", mentoring: "", adjust: 0, adjustReason: "", grade: "D", note: "근태 관리 및 직무 교육 집중 요망" }
};