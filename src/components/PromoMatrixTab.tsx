import React from "react";
import { EmployeeSnapshot, EvaluationItem } from "../types/hr";
import { pointsFor } from "../lib/constants";

interface Props {
  year: number;
  employees: EmployeeSnapshot[];
  evalStore: Record<number, Record<string, EvaluationItem>>;
}

export const PromoMatrixTab: React.FC<Props> = ({ year, employees, evalStore }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-award text-amber-500" />
            {year}년도 승진심사 대상 및 최근 3개년({year-2} ~ {year}) 승진포인트 집계표
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            승진심사는 최근 3개년 평가를 기준으로 산출됩니다. ({year}년 12월 31일 재직자 명부 기준)
          </p>
        </div>
        <span className="text-xs text-slate-400 font-semibold">S(10점) · A(8점) · B(6점) · C(4점) · D(2점)</span>
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
              <th className="p-3 text-center w-28">최근승진일</th>
              <th className="p-3 text-center w-36">{year-2}년 등급(포인트)</th>
              <th className="p-3 text-center w-36">{year-1}년 등급(포인트)</th>
              <th className="p-3 text-center w-36 bg-blue-50/50">{year}년 등급(포인트)</th>
              <th className="p-3 text-center w-40 font-black text-white bg-[#0b192c]">최근 3개년 누적 포인트 합계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.filter(e => e.status === "재직").map(emp => {
              const y0 = evalStore[year]?.[emp.emp_no]?.grade || "B";
              const p0 = pointsFor(y0);
              const y1 = evalStore[year-1]?.[emp.emp_no]?.grade || "B";
              const p1 = pointsFor(y1);
              const y2 = evalStore[year-2]?.[emp.emp_no]?.grade || "B";
              const p2 = pointsFor(y2);
              const total = p0 + p1 + p2;

              return (
                <tr key={emp.emp_no} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-center font-mono text-slate-400 text-[11px]">{emp.emp_no}</td>
                  <td className="p-3 font-bold text-slate-800">{emp.name}</td>
                  <td className="p-3 text-slate-600 font-medium">{emp.dept}</td>
                  <td className="p-3 font-semibold text-slate-700">{emp.position}</td>
                  <td className="p-3 text-center text-slate-500 font-mono text-[11px] bg-slate-50/40">{emp.hire_date || '-'}</td>
                  <td className="p-3 text-center text-slate-500 font-mono text-[11px]">{emp.promo_date || '-'}</td>
                  <td className="p-3 text-center text-slate-600">{y2}등급 ({p2}점)</td>
                  <td className="p-3 text-center text-slate-600">{y1}등급 ({p1}점)</td>
                  <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/20">{y0}등급 ({p0}점)</td>
                  <td className="p-3 text-center font-black text-blue-900 bg-slate-100 text-sm tracking-tight">{total}점</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
