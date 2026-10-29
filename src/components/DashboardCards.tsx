import React from 'react';
import { Grade } from '../types/hr';
import { GRADES, GRADE_LIMITS, recommendedCount } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  totalCount: number;
  gradedTotal: number;
  counts: Record<Grade, number>;
  getPct: (count: number) => number;
}

export const DashboardCards: React.FC<Props> = ({
  year,
  dept,
  totalCount,
  gradedTotal,
  counts,
  getPct
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5">
      {/* 총 대상 및 배분 현황 카드 */}
      <div className="bg-[#0b192c] text-white p-4 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>총대상 및 배분현황</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {year}년 · {dept}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white">{gradedTotal}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {totalCount} 명</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">배분율(%)</span>
          <span className="font-extrabold text-blue-400 font-mono">
            {totalCount > 0 ? Math.round((gradedTotal / totalCount) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* S, A, B, C, D 등급별 통계 카드 */}
      {GRADES.map(grade => {
        const c = counts[grade] || 0;
        const pct = getPct(c);
        const limit = GRADE_LIMITS[grade];
        const recObj = recommendedCount(totalCount, grade);
        const isOver = c > recObj.max;

        return (
          <div
            key={grade}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">
                  {grade}등급 (기준 {limit.label})
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOver
                      ? 'bg-rose-100 text-rose-700 font-black'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  }`}
                >
                  {isOver ? '초과' : '적정'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-800">{c}명</span>
                <span className="text-xs text-slate-400 font-semibold font-mono">({pct}%)</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>권장: {recObj.rec}명</span>
              <span>(한도 {recObj.max}명)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
