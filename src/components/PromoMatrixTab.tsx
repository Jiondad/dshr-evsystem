import React, { useState, useMemo } from 'react';
import { EmployeeSnapshot, EvalStore } from '../types/hr';
import { pointsFor, sortByDeptAndPosition } from '../lib/constants';

interface Props {
  year: number;
  dept?: string;
  employees: EmployeeSnapshot[];
  evalStore: EvalStore;
}

const PROMO_REQ_YEARS: Record<string, number> = {
  "사원": 3,
  "반장": 3,
  "주임": 3,
  "계장": 3,
  "대리": 3,
  "과장": 4,
  "차장": 4,
  "부장": 0,
  "실장": 0
};

const PROMO_REQ_POINTS: Record<string, number> = {
  "사원": 20,
  "반장": 20,
  "주임": 20,
  "계장": 20,
  "대리": 20,
  "과장": 22,
  "차장": 22,
  "부장": 22,
  "실장": 22
};

export const PromoMatrixTab: React.FC<Props> = ({ year, dept, employees, evalStore }) => {
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const sortedEmps = useMemo(() => {
    return [...employees].sort(sortByDeptAndPosition);
  }, [employees]);

  const years = [year - 2, year - 1, year];

  const getTenureInfo = (emp: EmployeeSnapshot) => {
    const reqYears = PROMO_REQ_YEARS[emp.position] ?? 4;
    
    if (reqYears === 0) {
      return { years: 0, reqYears: 0, status: '체류년한 없음', isMet: true };
    }

    const baseDateStr = emp.promo_date || emp.hire_date;
    if (!baseDateStr) return { years: 0, reqYears, status: '미상', isMet: false };

    const baseYear = parseInt(baseDateStr.split('-')[0], 10);
    if (isNaN(baseYear)) return { years: 0, reqYears, status: '미상', isMet: false };

    // 평가 기준 연도의 다음 연도 1월 1일 기준 (예: 2026년 기준 -> 2027년 1월 1일 - 승진연도)
    const targetCalcYear = year + 1;
    const tenureYears = targetCalcYear - baseYear;
    const isMet = tenureYears >= reqYears;

    return {
      years: tenureYears,
      reqYears,
      status: isMet ? `연한 충족 (${tenureYears}년차)` : `연한 미달 (${tenureYears}/${reqYears}년)`,
      isMet
    };
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-award text-blue-600" />
            {year}년도 승진심사 대상 및 최근 3개년({years[0]} ~ {years[2]}) 승진포인트 집계표
            {dept && dept !== "전체" && (
              <span className="ml-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {dept} ({sortedEmps.length}명)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">
              ※ 직급별 승진기준: [사원~대리·주임] 체류 3년·20P / [과장~차장] 체류 4년·22P / [부장~실장] 체류년한 없음·22P (승진 이전 연도 평가는 리셋)
            </p>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
            >
              <i className="fa-solid fa-circle-info text-blue-600" /> 체류연한 규정 보기
            </button>
          </div>
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
              <th className="p-2.5 text-center w-36 bg-slate-900 text-white font-extrabold whitespace-nowrap">
                승진 누적 포인트 합계
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmps.length === 0 ? (
              <tr>
                <td colSpan={7 + years.length} className="py-12 text-center text-slate-400 font-medium">
                  {year}년도 승진심사 대상 사원 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedEmps.map(emp => {
                const promoYear = emp.promo_date ? parseInt(emp.promo_date.split('-')[0], 10) : 0;
                const tenure = getTenureInfo(emp);
                const reqPoints = PROMO_REQ_POINTS[emp.position] || 22;

                let totalPoints = 0;
                years.forEach(y => {
                  const ev = evalStore[y]?.[emp.emp_no];
                  const grade = ev?.grade;
                  const rawPts = pointsFor(grade);
                  const isReset = promoYear > 0 && y < promoYear;
                  if (!isReset && rawPts > 0) {
                    totalPoints += rawPts;
                  }
                });

                const isPointsMet = totalPoints >= reqPoints;

                return (
                  <tr key={emp.emp_no} className="hover:bg-slate-50/80 transition">
                    <td className="p-2 text-center font-mono text-slate-600 whitespace-nowrap">{emp.emp_no}</td>
                    <td className="p-2 font-bold text-slate-900 whitespace-nowrap">{emp.name}</td>
                    <td className="p-2 text-slate-600 whitespace-nowrap">{emp.dept}</td>
                    <td className="p-2 font-semibold text-slate-800 whitespace-nowrap">{emp.position}</td>
                    <td className="p-2 text-center text-amber-600 font-mono font-bold whitespace-nowrap">
                      {emp.promo_date || '-'}
                    </td>

                    <td className="p-2 text-center whitespace-nowrap">
                      {tenure.reqYears === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          대상 아님 (체류년한 없음)
                        </span>
                      ) : tenure.isMet ? (
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

                    {years.map(y => {
                      const ev = evalStore[y]?.[emp.emp_no];
                      const grade = ev?.grade;
                      const rawPts = pointsFor(grade);
                      const isReset = promoYear > 0 && y < promoYear;

                      return (
                        <td key={y} className="p-2 text-center whitespace-nowrap">
                          {grade ? (
                            isReset ? (
                              <span className="text-slate-300 text-[11px] line-through decoration-slate-300" title={`${promoYear}년 승진 이전 평가이므로 리셋`}>
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

                    <td className="p-2 text-center bg-slate-50 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`font-black text-sm ${isPointsMet ? 'text-emerald-700' : 'text-blue-900'}`}>
                          {totalPoints}점
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          / {reqPoints}P
                        </span>
                        {isPointsMet && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            충족
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  <i className="fa-solid fa-clipboard-list" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">대성스틸 직급별 승진 기준 규정</h3>
                  <p className="text-xs text-slate-400 mt-0.5">표준 체류년한 및 기준 승진포인트 안내</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2.5 text-center">구분 (현재 직위 기준)</th>
                    <th className="p-2.5 text-center">표준체류년한</th>
                    <th className="p-2.5 text-center">승진포인트</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-center font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">부장 ~ 실장</td>
                    <td className="p-2.5 text-slate-400">-</td>
                    <td className="p-2.5 font-extrabold text-blue-700">22P</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">과장 ~ 차장</td>
                    <td className="p-2.5">4년</td>
                    <td className="p-2.5 font-extrabold text-blue-700">22P</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">주임 ~ 대리</td>
                    <td className="p-2.5">3년</td>
                    <td className="p-2.5 font-extrabold text-blue-700">20P</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">사원 (반장·계장 포함)</td>
                    <td className="p-2.5">3년</td>
                    <td className="p-2.5 font-extrabold text-blue-700">20P</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ※ 승진 이전 연도까지의 평가는 포인트가 리셋되며, 승진 당해 연도 평가부터 새 직급의 포인트로 정상 누적 기산됩니다.
            </p>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
