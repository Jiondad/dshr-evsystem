import React, { useMemo } from 'react';
import { EmployeeSnapshot, EvalStore } from '../types/hr';
import { pointsFor, sortByDeptAndPosition } from '../lib/constants';

interface Props {
  year: number;
  employees: EmployeeSnapshot[];
  evalStore: EvalStore;
}

// 직급별 최소 체류 연한 (연 단위)
const PROMO_REQ_YEARS: Record<string, number> = {
  "사원": 3,  // 사원 -> 대리 3년
  "대리": 4,  // 대리 -> 과장 4년
  "과장": 4,  // 과장 -> 차장 4년
  "차장": 5,  // 차장 -> 부장 5년
  "부장": 5,  // 부장 5년
  "실장": 5   // 실장 5년
};

export const PromoMatrixTab: React.FC<Props> = ({ year, employees, evalStore }) => {
  const sortedEmps = useMemo(() => {
    return [...employees].sort(sortByDeptAndPosition);
  }, [employees]);

  const years = [year - 2, year - 1, year];

  // 최근 승진연도 기산 및 체류연수 계산 함수
  const getTenureInfo = (emp: EmployeeSnapshot) => {
    const baseDateStr = emp.promo_date || emp.hire_date;
    if (!baseDateStr) return { years: 0, status: '미상', isMet: false };

    const baseYear = parseInt(baseDateStr.split('-')[0], 10);
    if (isNaN(baseYear)) return { years: 0, status: '미상', isMet: false };

    // 현재 평가연도 기준 체류연수
    const tenureYears = year - baseYear;
    const reqYears = PROMO_REQ_YEARS[emp.position] || 5;

    const isMet = tenureYears >= reqYears;
    return {
      years: tenureYears,
      status: isMet ? `연한 충족 (${tenureYears}년차)` : `연한 미달 (${tenureYears}/${reqYears}년)`,
      isMet
    };
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center pb-2 border-b">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-award text-blue-600" />
            {year}년도 승진심사 대상 및 최근 3개년({years[0]} ~ {years[2]}) 승진포인트 집계표
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ※ 대성스틸 승진 규정: 승진 당해 연도 포함 이전 평가는 포인트가 리셋되며, 승진 다음 연도부터 새롭게 누적 기산됩니다.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
          <span>기본 배점:</span>
          <span className="text-blue-600 font-bold">S(10점)</span>
          <span className="text-emerald-600 font-bold">A(8점)</span>
          <span className="text-slate-700 font-bold">B(6점)</span>
          <span className="text-amber-600 font-bold">C(4점)</span>
          <span className="text-rose-600 font-bold">D(2점)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-2.5 text-center w-12 whitespace-nowrap">사번</th>
              <th className="p-2.5 w-20 whitespace-nowrap">성명</th>
              <th className="p-2.5 w-16 whitespace-nowrap">부서</th>
              <th className="p-2.5 w-20 whitespace-nowrap">직위</th>
              <th className="p-2.5 text-center w-24 whitespace-nowrap">최근승진일</th>
              <th className="p-2.5 text-center w-28 whitespace-nowrap">체류연한 심사</th>
              {years.map(y => (
                <th key={y} className="p-2.5 text-center w-28 whitespace-nowrap">
                  {y}년 등급(포인트)
                </th>
              ))}
              <th className="p-2.5 text-center w-28 bg-slate-900 text-white font-extrabold whitespace-nowrap">
                승진 누적 포인트 합계
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmps.length === 0 ? (
              <tr>
                <td colSpan={6 + years.length} className="py-12 text-center text-slate-400 font-medium">
                  평가 대상 사원이 없습니다.
                </td>
              </tr>
            ) : (
              sortedEmps.map(emp => {
                const promoYear = emp.promo_date ? parseInt(emp.promo_date.split('-')[0], 10) : 0;
                const tenure = getTenureInfo(emp);

                let totalPoints = 0;

                return (
                  <tr key={emp.emp_no} className="hover:bg-slate-50/80 transition">
                    <td className="p-2 text-center font-mono text-slate-600 whitespace-nowrap">{emp.emp_no}</td>
                    <td className="p-2 font-bold text-slate-900 whitespace-nowrap">{emp.name}</td>
                    <td className="p-2 text-slate-600 whitespace-nowrap">{emp.dept}</td>
                    <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{emp.position}</td>
                    <td className="p-2 text-center text-amber-600 font-mono font-bold whitespace-nowrap">
                      {emp.promo_date || '-'}
                    </td>

                    {/* 직급 체류연한 심사 배지 (전 직급 동일 적용) */}
                    <td className="p-2 text-center whitespace-nowrap">
                      {tenure.isMet ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <i className="fa-solid fa-circle-check mr-1 text-[9px]" />
                          {tenure.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
                          <i className="fa-solid fa-clock mr-1 text-[9px]" />
                          {tenure.status}
                        </span>
                      )}
                    </td>

                    {/* 3개년 포인트 및 리셋 규칙 반영 */}
                    {years.map(y => {
                      const ev = evalStore[y]?.[emp.emp_no];
                      const grade = ev?.grade;
                      const rawPts = pointsFor(grade);

                      // 승진 당해 연도 포함 이전 평가는 포인트 리셋
                      const isReset = promoYear > 0 && y <= promoYear;
                      if (!isReset && rawPts > 0) {
                        totalPoints += rawPts;
                      }

                      return (
                        <td key={y} className="p-2 text-center whitespace-nowrap">
                          {grade ? (
                            isReset ? (
                              <span className="text-slate-300 text-[11px] line-through decoration-slate-300" title={`${promoYear}년 승진으로 리셋`}>
                                {grade}등급 (리셋 0점)
                              </span>
                            ) : (
                              <span className="font-extrabold text-blue-700">
                                {grade}등급 ({rawPts}점)
                              </span>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* 누적 승진포인트 합계 */}
                    <td className="p-2 text-center font-black text-sm text-blue-900 bg-slate-50 whitespace-nowrap">
                      {totalPoints > 0 ? `${totalPoints}점` : '0점'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
