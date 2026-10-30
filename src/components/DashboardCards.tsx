import React from 'react';
import { Grade } from '../types/hr';
import { GRADES, GRADE_LIMITS, recommendedCount } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  totalCount: number;
  gradedTotal: number;
  counts: Record<Grade, number>;
  getPct: (c: number) => number;
}

export const DashboardCards: React.FC<Props> = ({
  year, dept, totalCount, gradedTotal, counts, getPct
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {/* 총 대상 및 배분현황 카드 */}
      <div className="bg-[#0b192c] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between border border-slate-800">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-400">총대상 및 배분현황</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {year}년 · {dept}
            </span>
          </div>
          <div className="text-2xl font-black tracking-tight flex items-baseline gap-1.5 mt-1">
            <span>{gradedTotal}</span>
            <span className="text-xs text-slate-400 font-normal">/ {totalCount}명</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-slate-400">배분율(%)</span>
            <span className="font-bold font-mono text-blue-400">
              {totalCount > 0 ? Math.round((gradedTotal / totalCount) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? Math.min(100, Math.round((gradedTotal / totalCount) * 100)) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* S, A, B, C, D 등급 카드 */}
      {GRADES.map(g => {
        const count = counts[g] || 0;
        const pct = getPct(count);
        const limit = GRADE_LIMITS[g];
        const recCount = recommendedCount(totalCount, limit.targetPct);
        const roundedCount = Math.round(recCount);
        
        // 반올림된 정수 인원(roundedCount)을 기준으로 한도 초과 여부 판단
        const isOver = count > roundedCount;

        return (
          <div key={g} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-extrabold text-slate-700">{g}등급 (기준)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isOver ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {isOver ? '한도초과' : '적정'}
                </span>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 flex items-baseline gap-1 mt-1">
                <span>{count}명</span>
                <span className="text-xs text-slate-400 font-normal">({pct}%)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
              <span>그룹기준 인원:</span>
              <span className="font-bold font-mono text-slate-700">
                {recCount}명 <span className="text-slate-400 font-normal">({roundedCount}명)</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
