import React from 'react';
import { EmployeeSnapshot, EvaluationItem } from '../types/hr';
import { finalScore, gradeFromScore, pointsFor, weightsFor, GRADES } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  employees: EmployeeSnapshot[];
  evaluations: Record<string, EvaluationItem>;
  isLocked: boolean;
  onCellChange: (empNo: string, field: string, val: any) => void;
}

export const EvalInputTab: React.FC<Props> = ({
  year, dept, employees, evaluations, isLocked, onCellChange
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center pb-2 border-b print:pb-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 print:text-lg">
            <i className="fa-solid fa-pen-to-square text-blue-600 print:hidden" />
            {year}년 인사평가 결과 입력 ({dept} · {employees.length}명)
            {isLocked && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                <i className="fa-solid fa-lock mr-1" /> 확정 및 마감됨 (수정 불가)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 print:text-[10px]">
            점수를 입력하면 직급별 가중치가 반영되어 최종 환산점수, 최종 등급, 승진 포인트가 자동 산출됩니다.
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 print:text-[10px]">
          <span>등급 기준:</span>
          <span className="text-blue-600 font-bold">S(91점↑) · 10점</span>
          <span className="text-emerald-600 font-bold">A(81점↑) · 8점</span>
          <span className="text-slate-700 font-bold">B(71점↑) · 6점</span>
          <span className="text-amber-600 font-bold">C(61점↑) · 4점</span>
          <span className="text-rose-600 font-bold">D(61점↓) · 2점</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-400">
        <table className="w-full text-left text-xs border-collapse print:text-[10px]">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b print:bg-slate-200">
            <tr>
              <th className="p-2.5 text-center w-12">사번</th>
              <th className="p-2.5 w-20">성명</th>
              <th className="p-2.5 w-20">부서</th>
              <th className="p-2.5 w-28">직위 (가중치)</th>
              <th className="p-2.5 text-center w-24">입사일</th>
              <th className="p-2.5 text-center w-24">최근승진일</th>
              <th className="p-2.5 text-center w-20">역량</th>
              <th className="p-2.5 text-center w-20">성과</th>
              <th className="p-2.5 text-center w-20">자기계발</th>
              <th className="p-2.5 text-center w-20">부하육성</th>
              <th className="p-2.5 text-center w-28">가감점 / 사유</th>
              <th className="p-2.5 text-center w-24 bg-blue-50/50 text-blue-900 font-extrabold">최종 환산점수</th>
              <th className="p-2.5 text-center w-24 bg-amber-50/50 text-amber-900 font-extrabold">최종 등급</th>
              <th className="p-2.5 text-center w-20 font-bold">승진 포인트</th>
              <th className="p-2.5 w-44">특이사항</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-300">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-400 font-medium">
                  해당 부서에 등록된 평가 대상 사원이 없습니다.
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                const ev = evaluations[emp.emp_no] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
                const w = weightsFor(emp.position);
                const score = finalScore(emp.position, ev);
                const autoGrade = gradeFromScore(score);
                const displayGrade = ev.grade || autoGrade;
                const pts = pointsFor(displayGrade);

                return (
                  <tr key={emp.emp_no} className="hover:bg-slate-50/80 transition">
                    <td className="p-2 text-center font-mono text-slate-600">{emp.emp_no}</td>
                    <td className="p-2 font-bold text-slate-900">{emp.name}</td>
                    <td className="p-2 text-slate-600">{emp.dept}</td>
                    <td className="p-2">
                      <span className="font-semibold text-slate-800">{emp.position}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({w.competency*100}/{w.performance*100}/{w.selfDev*100}/{w.mentoring*100})
                      </span>
                    </td>
                    <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{emp.hire_date || '-'}</td>
                    <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{emp.promo_date || '-'}</td>

                    {/* 역량 */}
                    <td className="p-1.5 text-center">
                      {w.competency > 0 ? (
                        <input
                          type="number" min={0} max={100} disabled={isLocked}
                          value={ev.competency !== undefined ? ev.competency : ""}
                          onChange={e => onCellChange(emp.emp_no, "competency", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-14 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    {/* 성과 */}
                    <td className="p-1.5 text-center">
                      {w.performance > 0 ? (
                        <input
                          type="number" min={0} max={100} disabled={isLocked}
                          value={ev.performance !== undefined ? ev.performance : ""}
                          onChange={e => onCellChange(emp.emp_no, "performance", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-14 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    {/* 자기계발 */}
                    <td className="p-1.5 text-center">
                      {w.selfDev > 0 ? (
                        <input
                          type="number" min={0} max={100} disabled={isLocked}
                          value={ev.selfDev !== undefined ? ev.selfDev : ""}
                          onChange={e => onCellChange(emp.emp_no, "selfDev", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-14 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    {/* 부하육성 */}
                    <td className="p-1.5 text-center">
                      {w.mentoring > 0 ? (
                        <input
                          type="number" min={0} max={100} disabled={isLocked}
                          value={ev.mentoring !== undefined ? ev.mentoring : ""}
                          onChange={e => onCellChange(emp.emp_no, "mentoring", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-14 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      ) : <span className="text-slate-300">-</span>}
                    </td>

                    {/* 가감점 및 사유 */}
                    <td className="p-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="0.5" disabled={isLocked}
                          placeholder="±점"
                          value={ev.adjust !== undefined ? ev.adjust : ""}
                          onChange={e => onCellChange(emp.emp_no, "adjust", e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-12 text-center py-1 border border-slate-200 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text" disabled={isLocked}
                          placeholder="사유"
                          value={ev.adjustReason || ""}
                          onChange={e => onCellChange(emp.emp_no, "adjustReason", e.target.value)}
                          className="w-20 px-1 py-1 border border-slate-200 rounded text-[11px] disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* 최종 환산점수 */}
                    <td className="p-2 text-center font-black text-blue-700 bg-blue-50/30 text-sm">
                      {score > 0 ? score.toFixed(1) : '0.0'}
                    </td>

                    {/* 최종 등급 */}
                    <td className="p-1.5 text-center bg-amber-50/30">
                      <select
                        disabled={isLocked}
                        value={displayGrade}
                        onChange={e => onCellChange(emp.emp_no, "grade", e.target.value)}
                        className={`px-2.5 py-1 rounded font-extrabold text-xs border ${
                          displayGrade === 'S' ? 'bg-blue-600 text-white border-blue-600' :
                          displayGrade === 'A' ? 'bg-emerald-600 text-white border-emerald-600' :
                          displayGrade === 'B' ? 'bg-slate-700 text-white border-slate-700' :
                          displayGrade === 'C' ? 'bg-amber-500 text-white border-amber-500' :
                          displayGrade === 'D' ? 'bg-rose-600 text-white border-rose-600' :
                          'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <option value="">등급 선택</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}등급</option>)}
                      </select>
                    </td>

                    {/* 승진 포인트 */}
                    <td className="p-2 text-center font-bold text-slate-800">
                      {pts > 0 ? `${pts}점` : '-'}
                    </td>

                    {/* 특이사항 */}
                    <td className="p-1.5">
                      <input
                        type="text" disabled={isLocked}
                        placeholder="특이사항 메모"
                        value={ev.note || ""}
                        onChange={e => onCellChange(emp.emp_no, "note", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                      />
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
