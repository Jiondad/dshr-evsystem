import React from "react";
import { EmployeeSnapshot, EvaluationItem, Grade } from "../types/hr";
import { GRADES, weightsFor, finalScore, pointsFor } from "../lib/constants";

interface Props {
  year: number;
  dept: string;
  employees: EmployeeSnapshot[];
  evaluations: Record<string, EvaluationItem>;
  onCellChange: (empNo: string, field: keyof EvaluationItem, val: any) => void;
}

export const EvalInputTab: React.FC<Props> = ({ year, dept, employees, evaluations, onCellChange }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/70 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-slate-800">
            {year}년 인사평가 결과 입력 ({dept} · {employees.length}명)
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            대표이사 최종 결정 원점수를 입력하면 직급별 가중치가 자동 반영되어 소수점 첫째 자리의 최종 환산점수와 승진 포인트가 산출됩니다.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
          <span>S등급: <b className="text-blue-600">10점</b></span>
          <span>A등급: <b className="text-emerald-600">8점</b></span>
          <span>B등급: <b className="text-indigo-600">6점</b></span>
          <span>C등급: <b className="text-amber-600">4점</b></span>
          <span>D등급: <b className="text-rose-600">2점</b></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200/80">
            <tr>
              <th className="p-3 text-center w-16">사번</th>
              <th className="p-3 w-20">성명</th>
              <th className="p-3 w-24">부서</th>
              <th className="p-3 w-24">직위</th>
              <th className="p-3 text-center w-24 bg-slate-50">입사일</th>
              <th className="p-3 text-center w-24 bg-slate-50">최근승진일</th>
              <th className="p-2 text-center w-16 bg-blue-50/40">역량</th>
              <th className="p-2 text-center w-16 bg-blue-50/40">성과</th>
              <th className="p-2 text-center w-16 bg-blue-50/40">자기계발</th>
              <th className="p-2 text-center w-16 bg-blue-50/40">부하육성</th>
              <th className="p-2 text-center w-36">가감점 / 사유</th>
              <th className="p-3 text-center w-24 bg-slate-200/70 font-black text-slate-800">최종 환산점수</th>
              <th className="p-3 text-center w-20">최종 등급</th>
              <th className="p-3 text-center w-20">승진 포인트</th>
              <th className="p-3 w-40">특이사항</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => {
              const ev = evaluations[emp.emp_no] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
              const w = weightsFor(emp.position);
              const fScore = finalScore(emp.position, ev);
              const points = pointsFor(ev.grade);

              return (
                <tr key={emp.emp_no} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">{emp.emp_no}</td>
                  <td className="p-2.5 font-bold text-slate-800">{emp.name}</td>
                  <td className="p-2.5 text-slate-600 font-medium">{emp.dept}</td>
                  <td className="p-2.5">
                    <div className="font-semibold text-slate-700">{emp.position}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ({w.competency * 100}/{w.performance * 100}/{w.selfDev * 100}/{w.mentoring * 100})
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-500 text-[11px] bg-slate-50/40">
                    {emp.hire_date || '-'}
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-500 text-[11px] bg-slate-50/40">
                    {emp.promo_date || '-'}
                  </td>

                  <td className="p-2 text-center bg-blue-50/20">
                    {w.competency > 0 ? (
                      <input
                        type="number"
                        step="0.5"
                        value={ev.competency}
                        onChange={e => onCellChange(emp.emp_no, 'competency', e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    ) : <span className="text-slate-300 font-bold">-</span>}
                  </td>

                  <td className="p-2 text-center bg-blue-50/20">
                    {w.performance > 0 ? (
                      <input
                        type="number"
                        step="0.5"
                        value={ev.performance}
                        onChange={e => onCellChange(emp.emp_no, 'performance', e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    ) : <span className="text-slate-300 font-bold">-</span>}
                  </td>

                  <td className="p-2 text-center bg-blue-50/20">
                    {w.selfDev > 0 ? (
                      <input
                        type="number"
                        step="0.5"
                        value={ev.selfDev}
                        onChange={e => onCellChange(emp.emp_no, 'selfDev', e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    ) : <span className="text-slate-300 font-bold">-</span>}
                  </td>

                  <td className="p-2 text-center bg-blue-50/20">
                    {w.mentoring > 0 ? (
                      <input
                        type="number"
                        step="0.5"
                        value={ev.mentoring}
                        onChange={e => onCellChange(emp.emp_no, 'mentoring', e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    ) : <span className="text-slate-300 font-bold">-</span>}
                  </td>

                  <td className="p-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="±"
                        value={ev.adjust}
                        onChange={e => onCellChange(emp.emp_no, 'adjust', e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-11 border border-slate-200 rounded-lg px-1 py-1 text-center font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="사유"
                        value={ev.adjustReason}
                        onChange={e => onCellChange(emp.emp_no, 'adjustReason', e.target.value)}
                        className="w-20 border border-slate-200 rounded-lg px-1.5 py-1 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                    </div>
                  </td>

                  <td className="p-2.5 text-center font-black text-blue-700 bg-slate-100/60 text-sm tracking-tight">
                    {fScore.toFixed(1)}
                  </td>

                  <td className="p-2 text-center">
                    <select
                      value={ev.grade}
                      onChange={e => onCellChange(emp.emp_no, 'grade', e.target.value as Grade)}
                      className="border border-slate-300 rounded-lg px-1.5 py-1 font-extrabold bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}등급</option>)}
                    </select>
                  </td>

                  <td className="p-2.5 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/60">
                      {points}점
                    </span>
                  </td>

                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="특이사항 메모"
                      value={ev.note}
                      onChange={e => onCellChange(emp.emp_no, 'note', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
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
