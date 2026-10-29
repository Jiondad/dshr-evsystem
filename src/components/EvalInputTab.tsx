import React from 'react';
import { EmployeeSnapshot, EvaluationItem, UserRole } from '../types/hr';
import { finalScore, gradeFromScore, pointsFor, weightsFor, GRADES } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  userRole: UserRole;
  employees: EmployeeSnapshot[];
  evaluations: Record<string, EvaluationItem>;
  deptEvaluations: Record<string, EvaluationItem>; // 1차 부서장평가 데이터
  isLocked: boolean;
  onCellChange: (empNo: string, field: string, val: any) => void;
}

export const EvalInputTab: React.FC<Props> = ({
  year, dept, userRole, employees, evaluations, deptEvaluations, isLocked, onCellChange
}) => {
  const isDeptLeader = userRole === 'LV2_DEPT_LEADER';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center pb-2 border-b print:pb-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 print:text-lg">
            <i className="fa-solid fa-pen-to-square text-blue-600 print:hidden" />
            {year}년 {isDeptLeader ? `1차 부서장 인사평가 (${dept} 전용)` : `최종 인사평가 (${dept})`} ({employees.length}명)
            {isLocked && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                <i className="fa-solid fa-lock mr-1" /> 확정 및 마감됨 (수정 불가)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 print:text-[10px]">
            {isDeptLeader 
              ? "소속 부서원에 대한 1차 역량/성과 평가 점수를 입력합니다. 입력된 점수는 최종평가자에게 참고자료로 제공됩니다."
              : "보라색 열의 1차 부서장 평가결과를 참고하여 최종 평가 점수를 산출합니다. (부서장 점수는 최종점수에 자동 반영되지 않는 순수 참고용입니다.)"}
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 print:text-[10px]">
          <span>등급 기준:</span>
          <span className="text-blue-600 font-bold">S(91↑)·10점</span>
          <span className="text-emerald-600 font-bold">A(81↑)·8점</span>
          <span className="text-slate-700 font-bold">B(71↑)·6점</span>
          <span className="text-amber-600 font-bold">C(61↑)·4점</span>
          <span className="text-rose-600 font-bold">D(61↓)·2점</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-400">
        <table className="w-full text-left text-xs border-collapse print:text-[10px]">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b print:bg-slate-200">
            <tr>
              <th className="p-2.5 text-center w-12" rowSpan={2}>사번</th>
              <th className="p-2.5 w-20" rowSpan={2}>성명</th>
              <th className="p-2.5 w-16" rowSpan={2}>부서</th>
              <th className="p-2.5 w-24" rowSpan={2}>직위 (가중치)</th>
              <th className="p-2.5 text-center w-20" rowSpan={2}>입사일</th>
              <th className="p-2.5 text-center w-20" rowSpan={2}>최근승진일</th>

              {/* 최종평가 화면일 경우: 1차 부서장평가 참고 컬럼 표시 */}
              {!isDeptLeader && (
                <th colSpan={3} className="p-2 text-center bg-purple-50 text-purple-900 border-l border-r border-purple-200">
                  <i className="fa-solid fa-clipboard-user mr-1" /> 1차 부서장 평가 (참고자료)
                </th>
              )}

              {/* 현재 입력/평가 컬럼 */}
              <th colSpan={7} className={`p-2 text-center ${isDeptLeader ? 'bg-blue-50 text-blue-900' : 'bg-slate-100 text-slate-800'}`}>
                {isDeptLeader ? '부서장 1차 평가 입력' : '최종 대표이사 평가'}
              </th>
            </tr>
            <tr>
              {/* 1차 부서장 참고 하위 헤더 */}
              {!isDeptLeader && (
                <>
                  <th className="p-1.5 text-center bg-purple-50/70 text-purple-800 border-l border-purple-200 w-16">환산점수</th>
                  <th className="p-1.5 text-center bg-purple-50/70 text-purple-800 w-14">등급</th>
                  <th className="p-1.5 bg-purple-50/70 text-purple-800 border-r border-purple-200 w-32">부서장 의견</th>
                </>
              )}

              {/* 점수 입력 항목 */}
              <th className="p-2 text-center w-16">역량</th>
              <th className="p-2 text-center w-16">성과</th>
              <th className="p-2 text-center w-16">자기계발</th>
              <th className="p-2 text-center w-16">부하육성</th>
              <th className="p-2 text-center w-28">가감점 / 사유</th>
              <th className="p-2 text-center w-20 bg-blue-50/50 text-blue-900 font-extrabold">환산점수</th>
              <th className="p-2 text-center w-20 bg-amber-50/50 text-amber-900 font-extrabold">최종등급</th>
              {!isDeptLeader && <th className="p-2 text-center w-16 font-bold">승진포인트</th>}
              <th className="p-2 w-36">특이사항/비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-300">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={isDeptLeader ? 14 : 17} className="py-12 text-center text-slate-400 font-medium">
                  평가 대상 사원이 없습니다.
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                // 부서장 평가 데이터 (참고용)
                const deptEv = deptEvaluations[emp.emp_no] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
                const deptScore = finalScore(emp.position, deptEv);
                const deptAutoGrade = gradeFromScore(deptScore);
                const deptGrade = deptEv.grade || (deptScore > 0 ? deptAutoGrade : '-');

                // 현재 평가자가 입력 중인 평가 데이터
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

                    {/* [최종평가 화면 전용] 1차 부서장평가 참고 표시 컬럼 */}
                    {!isDeptLeader && (
                      <>
                        <td className="p-2 text-center bg-purple-50/40 font-bold text-purple-900 border-l border-purple-200">
                          {deptScore > 0 ? deptScore.toFixed(1) : '-'}
                        </td>
                        <td className="p-2 text-center bg-purple-50/40">
                          {deptGrade && deptGrade !== '-' ? (
                            <span className="px-2 py-0.5 rounded font-extrabold text-[11px] bg-purple-200 text-purple-900">
                              {deptGrade}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-2 text-[11px] bg-purple-50/40 text-slate-600 border-r border-purple-200 truncate max-w-[120px]" title={deptEv.note || ''}>
                          {deptEv.note || '-'}
                        </td>
                      </>
                    )}

                    {/* 점수 입력 필드 */}
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
                          className="w-16 px-1 py-1 border border-slate-200 rounded text-[11px] disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </td>

                    <td className="p-2 text-center font-black text-blue-700 bg-blue-50/30 text-sm">
                      {score > 0 ? score.toFixed(1) : '0.0'}
                    </td>

                    <td className="p-1.5 text-center bg-amber-50/30">
                      <select
                        disabled={isLocked}
                        value={displayGrade}
                        onChange={e => onCellChange(emp.emp_no, "grade", e.target.value)}
                        className={`px-2 py-1 rounded font-extrabold text-xs border ${
                          displayGrade === 'S' ? 'bg-blue-600 text-white border-blue-600' :
                          displayGrade === 'A' ? 'bg-emerald-600 text-white border-emerald-600' :
                          displayGrade === 'B' ? 'bg-slate-700 text-white border-slate-700' :
                          displayGrade === 'C' ? 'bg-amber-500 text-white border-amber-500' :
                          displayGrade === 'D' ? 'bg-rose-600 text-white border-rose-600' :
                          'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <option value="">선택</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}등급</option>)}
                      </select>
                    </td>

                    {!isDeptLeader && (
                      <td className="p-2 text-center font-bold text-slate-800">
                        {pts > 0 ? `${pts}점` : '-'}
                      </td>
                    )}

                    <td className="p-1.5">
                      <input
                        type="text" disabled={isLocked}
                        placeholder={isDeptLeader ? "부서장 의견 메모" : "특이사항 메모"}
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
