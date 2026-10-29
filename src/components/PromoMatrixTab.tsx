import React from "react";
import { EmployeeSnapshot, EvaluationItem } from "../types/hr";
import { pointsFor } from "../lib/constants";

interface Props {
  year: number;
  employees: EmployeeSnapshot[];
  evalStore: Record<number, Record<string, EvaluationItem>>;
}

export const PromoMatrixTab: React.FC<Props> = ({ year, employees, evalStore }) => {
  // 최근승진일 연도 추출 헬퍼 (예: "2024-03-01" -> 2024)
  const getPromoYear = (promoDate?: string): number | null => {
    if (!promoDate) return null;
    const y = parseInt(promoDate.substring(0, 4), 10);
    return isNaN(y) ? null : y;
  };

  // 승진 리셋 규칙 적용 포인트 산출 함수
  // 대상 평가연도(evalYear)가 최근승진연도 이하이면 리셋(0점), 승진 다음 해부터 점수 유효
  const calcPromoPoints = (evalYear: number, promoYear: number | null, grade: string) => {
    const rawPoint = pointsFor(grade as any);
    if (promoYear !== null && evalYear <= promoYear) {
      return {
        point: 0,
        isReset: true,
        text: `${grade || '-'}등급 (리셋 0점)`
      };
    }
    return {
      point: rawPoint,
      isReset: false,
      text: `${grade || '-'}등급 (${rawPoint}점)`
    };
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-award text-amber-500" />
            {year}년도 승진심사 대상 및 최근 3개년({year-2} ~ {year}) 승진포인트 집계표
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ※ 대성스틸 승진 규정: 승진 당해 연도 포함 이전 평가는 포인트가 리셋되며, <b>승진 다음 연도부터 새롭게 누적</b> 기산됩니다. ({year}년 12월 31일 재직자 기준)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border">
          <span className="text-blue-600 font-bold">기본 배점:</span>
          <span>S(10점) · A(8점) · B(6점) · C(4점) · D(2점)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-3 text-center w-16">사번</th>
              <th className="p-3 w-20">성명</th>
              <th className="p-3 w-24">부서</th>
              <th className="p-3 w-20">직위</th>
              <th className="p-3 text-center w-28 bg-slate-50">입사일</th>
              <th className="p-3 text-center w-28 bg-amber-50/50 text-amber-900">최근승진일</th>
              <th className="p-3 text-center w-36">{year-2}년 등급(포인트)</th>
              <th className="p-3 text-center w-36">{year-1}년 등급(포인트)</th>
              <th className="p-3 text-center w-36 bg-blue-50/50">{year}년 등급(포인트)</th>
              <th className="p-3 text-center w-44 font-black text-white bg-[#0b192c]">승진 누적 포인트 합계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.filter(e => e.status === "재직").map(emp => {
              const promoYear = getPromoYear(emp.promo_date);

              // 2년 전 평가
              const g2 = evalStore[year-2]?.[emp.emp_no]?.grade || "B";
              const p2Info = calcPromoPoints(year - 2, promoYear, g2);

              // 1년 전 평가
              const g1 = evalStore[year-1]?.[emp.emp_no]?.grade || "B";
              const p1Info = calcPromoPoints(year - 1, promoYear, g1);

              // 당해 연도 평가
              const g0 = evalStore[year]?.[emp.emp_no]?.grade || "B";
              const p0Info = calcPromoPoints(year, promoYear, g0);

              // 총 유효 누적 합계 (리셋된 연도는 0점 반영)
              const total = p2Info.point + p1Info.point + p0Info.point;

              return (
                <tr key={emp.emp_no} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-center font-mono text-slate-400 text-[11px]">{emp.emp_no}</td>
                  <td className="p-3 font-bold text-slate-800">{emp.name}</td>
                  <td className="p-3 text-slate-600 font-medium">{emp.dept}</td>
                  <td className="p-3 font-semibold text-slate-700">{emp.position}</td>
                  <td className="p-3 text-center text-slate-500 font-mono text-[11px] bg-slate-50/40">{emp.hire_date || '-'}</td>
                  <td className="p-3 text-center font-mono text-[11px] font-bold text-amber-700 bg-amber-50/20">
                    {emp.promo_date || '-'}
                  </td>

                  {/* year - 2 */}
                  <td className={`p-3 text-center ${p2Info.isReset ? 'text-slate-300 line-through bg-slate-50/50' : 'text-slate-600'}`}>
                    {p2Info.text}
                  </td>

                  {/* year - 1 */}
                  <td className={`p-3 text-center ${p1Info.isReset ? 'text-slate-300 line-through bg-slate-50/50' : 'text-slate-600'}`}>
                    {p1Info.text}
                  </td>

                  {/* year (당해 연도) */}
                  <td className={`p-3 text-center font-bold ${p0Info.isReset ? 'text-slate-400 line-through bg-slate-50' : 'text-blue-600 bg-blue-50/20'}`}>
                    {p0Info.text}
                  </td>

                  {/* 최종 유효 누적 포인트 */}
                  <td className="p-3 text-center font-black text-blue-900 bg-slate-100 text-sm tracking-tight">
                    {total}점
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
