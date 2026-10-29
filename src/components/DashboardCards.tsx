import React from "react";
import { GRADES, GRADE_TARGET_RATE, recommendedCount } from "../lib/constants";
import { Grade } from "../types/hr";

interface Props {
  year: number;
  dept: string;
  totalCount: number;
  gradedTotal: number;
  counts: Record<Grade, number>;
  getPct: (c: number) => number;
}

export const DashboardCards: React.FC<Props> = ({ year, dept, totalCount, gradedTotal, counts, getPct }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
      <div className="bg-[#0b192c] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between border border-slate-800">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-semibold text-slate-400">총대상 및 배분현황</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{year}년 · {dept}</span>
        </div>
        <div className="my-2">
          <span className="text-2xl font-black text-white">{gradedTotal}</span>
          <span className="text-sm text-slate-400 font-semibold mx-1">/</span>
          <span className="text-lg text-slate-400 font-bold">{totalCount}</span>
          <span className="text-xs text-slate-400 ml-1">명</span>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>배분율(%)</span>
            <span className="font-bold text-blue-400">{getPct(gradedTotal)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(getPct(gradedTotal), 100)}%` }} />
          </div>
        </div>
      </div>

      {GRADES.map(grade => {
        const targetRate = GRADE_TARGET_RATE[grade];
        const recCount = recommendedCount(totalCount, grade);
        const curCount = counts[grade];
        const curRate = getPct(curCount);
        const isOver = curCount > Math.round(parseFloat(recCount));

        return (
          <div
            key={grade}
            className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all ${
              isOver && curCount > 0 ? "border-amber-400 bg-amber-50/20" : "border-slate-200/80"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-black text-sm text-slate-800">{grade}등급 (기준 {targetRate}%)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOver && curCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
              }`}>
                {isOver && curCount > 0 ? "초과주의" : "적정"}
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{curCount}명</span>
                <span className="text-xs font-bold text-slate-500">({curRate}%)</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-amber-500" : "bg-blue-600"}`}
                  style={{ width: `${Math.min(curRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
              <span>권장: <b className="text-slate-700">{recCount}명</b></span>
              <span>(한도 {Math.round(parseFloat(recCount))}명)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};