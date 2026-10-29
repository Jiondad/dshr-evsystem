import React, { useState } from 'react';
import { EmployeeSnapshot, EvaluationItem, UserRole } from '../types/hr';
import { finalScore, gradeFromScore, pointsFor, weightsFor, GRADES } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  userRole: UserRole;
  employees: EmployeeSnapshot[];
  evaluations: Record<string, EvaluationItem>;
  deptEvaluations: Record<string, EvaluationItem>;
  isLocked: boolean;
  isDeptSubmitted: boolean;
  onCellChange: (empNo: string, field: string, val: any) => void;
}

export const EvalInputTab: React.FC<Props> = ({
  year, dept, userRole, employees, evaluations, deptEvaluations, isLocked, isDeptSubmitted, onCellChange
}) => {
  const isDeptLeader = userRole === 'LV2_DEPT_LEADER';
  const [modalData, setModalData] = useState<{ name: string; dept: string; note: string } | null>(null);

  const isInputDisabled = isDeptLeader ? (isLocked || isDeptSubmitted) : isLocked;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center pb-2 border-b print:pb-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 print:text-lg">
            <i className="fa-solid fa-pen-to-square text-blue-600 print:hidden" />
            {year}년 {isDeptLeader ? `1차 부서장 인사평가 (${dept} 전용)` : `최종 인사평가 (${dept})`} ({employees.length}명)
            {isLocked && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                <i className="fa-solid fa-lock mr-1" /> 최종 확정 마감됨
              </span>
            )}
            {isDeptLeader && isDeptSubmitted && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-300">
                <i className="fa-solid fa-check-double mr-1" /> 1차 평가 제출 완료 (수정 잠김)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 print:text-[10px]">
            {isDeptLeader 
              ? "소속 부서원에 대한 1차 역량/성과 평가 점수를 입력합니다. (생산팀 임의호 실장은 대표이사 단독 평가 대상이므로 1차 평가에서 제외됩니다.)"
              : "보라색 영역의 1차 부서장 평가결과(역량·성과·자기계발·부하육성 및 의견)를 참고하여 독립적으로 최종 점수를 평가합니다."}
          </p>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 print:text-[10px] whitespace-nowrap">
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
              <th className="p-2 text-center w-12 whitespace-nowrap" rowSpan={2}>사번</th>
              <th className="p-2 w-16 whitespace-nowrap" rowSpan={2}>성명</th>
              <th className="p-2 w-14 whitespace-nowrap" rowSpan={2}>부서</th>
              <th className="p-2 w-24 whitespace-nowrap" rowSpan={2}>직위 (가중치)</th>
              <th className="p-2 text-center w-20 whitespace-nowrap" rowSpan={2}>입사일</th>
              <th className="p-2 text-center w-20 whitespace-nowrap" rowSpan={2}>최근승진일</th>

              {!isDeptLeader && (
                <th colSpan={7} className="p-1.5 text-center bg-purple-100/80 text-purple-950 border-l border-r border-purple-200 font-extrabold whitespace-nowrap">
                  <i className="fa-solid fa-clipboard-user mr-1 text-purple-700" /> 1차 부서장 평가 (참고자료)
                </th>
              )}

              <th colSpan={7} className={`p-1.5 text-center font-extrabold whitespace-nowrap ${isDeptLeader ? 'bg-blue-100/70 text-blue-950' : 'bg-slate-200/80 text-slate-900'}`}>
                {isDeptLeader ? '부서장 1차 평가 입력' : '최종 대표이사 평가'}
              </th>

              {/* 승진포인트: 너비를 w-20(80px)으로 타이트하게 고정 */}
              {!isDeptLeader && (
                <th className="p-2 text-center w-20 whitespace-nowrap bg-slate-200/80 text-slate-900 font-extrabold" rowSpan={2}>
                  승진포인트
                </th>
              )}

              {/* 특이사항/비고: 고정 너비(w-44)를 빼서 테이블 남는 공간을 최대로 차지하도록 설정 */}
              <th className="p-2 whitespace-nowrap min-w-[200px]" rowSpan={2}>
                {isDeptLeader ? '부서장 의견/비고' : '특이사항/비고'}
              </th>
            </tr>
            <tr>
              {!isDeptLeader && (
                <>
                  <th className="p-1 text-center bg-purple-50 text-purple-900 border-l border-purple-200 w-11 whitespace-nowrap font-bold">역량</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-900 w-11 whitespace-nowrap font-bold">성과</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-900 w-11 whitespace-nowrap font-bold">계발</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-900 w-11 whitespace-nowrap font-bold">육성</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-950 font-black w-14 whitespace-nowrap border-l border-purple-200">환산점</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-950 font-black w-12 whitespace-nowrap">등급</th>
                  <th className="p-1 text-center bg-purple-50 text-purple-900 border-r border-purple-200 w-14 whitespace-nowrap font-bold">의견</th>
                </>
              )}

              <th className="p-1 text-center w-14 whitespace-nowrap">역량</th>
              <th className="p-1 text-center w-14 whitespace-nowrap">성과</th>
              <th className="p-1 text-center w-14 whitespace-nowrap">자기계발</th>
              <th className="p-1 text-center w-14 whitespace-nowrap">부하육성</th>
              <th className="p-1 text-center w-24 whitespace-nowrap">가감점/사유</th>
              <th className="p-1 text-center w-16 bg-blue-50 text-blue-900 font-black whitespace-nowrap">환산점수</th>
              <th className="p-1 text-center w-20 bg-amber-50 text-amber-900 font-black whitespace-nowrap">최종등급</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-300">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={isDeptLeader ? 15 : 21} className="py-12 text-center text-slate-400 font-medium">
                  평가 대상 사원이 없습니다.
                </td>
              </tr>
            ) : (
              employees.map(emp => {
                const isImUiHoInDeptEval = isDeptLeader && emp.emp_no === '140004';
                const deptEv = deptEvaluations[emp.emp_no] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
                const deptScore = finalScore(emp.position, deptEv);
                const deptAutoGrade = gradeFromScore(deptScore);
                const deptGrade = deptEv.grade || (deptScore > 0 ? deptAutoGrade : '');

                const ev = evaluations[emp.emp_no] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
                const w = weightsFor(emp.position);
                const score = finalScore(emp.position, ev);
                const autoGrade = gradeFromScore(score);
                const displayGrade = ev.grade || autoGrade;
                const pts = pointsFor(displayGrade);

                return (
                  <tr key={emp.emp_no} className={`hover:bg-slate-50/80 transition ${isImUiHoInDeptEval ? 'bg-slate-50/70' : ''}`}>
                    <td className="p-1.5 text-center font-mono text-slate-600 whitespace-nowrap">{emp.emp_no}</td>
                    <td className="p-1.5 font-bold text-slate-900 whitespace-nowrap">
                      {emp.name}
                      {isImUiHoInDeptEval && (
                        <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-slate-200 text-slate-600 font-normal">부서장</span>
                      )}
                    </td>
                    <td className="p-1.5 text-slate-600 whitespace-nowrap">{emp.dept}</td>
                    <td className="p-1.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{emp.position}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ({w.competency*100}/{w.performance*100}/{w.selfDev*100}/{w.mentoring*100})
                      </span>
                    </td>
                    <td className="p-1.5 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">{emp.hire_date || '-'}</td>
                    <td className="p-1.5 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">{emp.promo_date || '-'}</td>

                    {!isDeptLeader && (
                      <>
                        {emp.emp_no === '140004' ? (
                          <td colSpan={7} className="p-1 text-center bg-slate-100 text-slate-500 text-[11px] font-semibold border-l border-r border-purple-200">
                            부서장(임의호 실장) - 1차 평가 제외 / 대표이사 직접 평가 대상
                          </td>
                        ) : (
                          <>
                            <td className="p-1 text-center bg-purple-50/40 font-mono text-purple-900 border-l border-purple-200">
                              {deptEv.competency !== "" && deptEv.competency !== undefined ? deptEv.competency : "-"}
                            </td>
                            <td className="p-1 text-center bg-purple-50/40 font-mono text-purple-900">
                              {deptEv.performance !== "" && deptEv.performance !== undefined ? deptEv.performance : "-"}
                            </td>
                            <td className="p-1 text-center bg-purple-50/40 font-mono text-purple-900">
                              {deptEv.selfDev !== "" && deptEv.selfDev !== undefined ? deptEv.selfDev : "-"}
                            </td>
                            <td className="p-1 text-center bg-purple-50/40 font-mono text-purple-900">
                              {deptEv.mentoring !== "" && deptEv.mentoring !== undefined ? deptEv.mentoring : "-"}
                            </td>
                            <td className="p-1 text-center bg-purple-100/50 font-black text-purple-950 border-l border-purple-200 font-mono">
                              {deptScore > 0 ? deptScore.toFixed(1) : '-'}
                            </td>
                            <td className="p-1 text-center bg-purple-100/50">
                              {deptGrade ? (
                                <span className="px-1.5 py-0.5 rounded font-black text-[11px] bg-purple-200 text-purple-900">
                                  {deptGrade}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-1 text-center bg-purple-50/40 border-r border-purple-200">
                              {deptEv.note && deptEv.note.trim() !== "" ? (
                                <button
                                  onClick={() => setModalData({ name: emp.name, dept: emp.dept, note: deptEv.note })}
                                  className="px-2 py-0.5 text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded border border-purple-300 transition"
                                  title="부서장 의견 전체보기"
                                >
                                  <i className="fa-regular fa-comment-dots mr-0.5" /> 보기
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </>
                        )}
                      </>
                    )}

                    {isImUiHoInDeptEval ? (
                      <>
                        <td colSpan={7} className="p-2 text-center bg-slate-100 text-slate-500 font-semibold text-[11px]">
                          <i className="fa-solid fa-ban text-slate-400 mr-1.5" />
                          부서장 본인 - 대표이사 단독 평가 대상 (1차 평가 제외)
                        </td>
                        <td className="p-1 text-center bg-slate-100 text-slate-400 text-[11px]">-</td>
                      </>
                    ) : (
                      <>
                        <td className="p-1 text-center">
                          {w.competency > 0 ? (
                            <input
                              type="number" min={0} max={100} disabled={isInputDisabled}
                              value={ev.competency !== undefined ? ev.competency : ""}
                              onChange={e => onCellChange(emp.emp_no, "competency", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-12 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          ) : <span className="text-slate-300">-</span>}
                        </td>

                        <td className="p-1 text-center">
                          {w.performance > 0 ? (
                            <input
                              type="number" min={0} max={100} disabled={isInputDisabled}
                              value={ev.performance !== undefined ? ev.performance : ""}
                              onChange={e => onCellChange(emp.emp_no, "performance", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-12 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          ) : <span className="text-slate-300">-</span>}
                        </td>

                        <td className="p-1 text-center">
                          {w.selfDev > 0 ? (
                            <input
                              type="number" min={0} max={100} disabled={isInputDisabled}
                              value={ev.selfDev !== undefined ? ev.selfDev : ""}
                              onChange={e => onCellChange(emp.emp_no, "selfDev", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-12 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          ) : <span className="text-slate-300">-</span>}
                        </td>

                        <td className="p-1 text-center">
                          {w.mentoring > 0 ? (
                            <input
                              type="number" min={0} max={100} disabled={isInputDisabled}
                              value={ev.mentoring !== undefined ? ev.mentoring : ""}
                              onChange={e => onCellChange(emp.emp_no, "mentoring", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-12 text-center py-1 border border-slate-200 rounded font-bold bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          ) : <span className="text-slate-300">-</span>}
                        </td>

                        <td className="p-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number" step="0.5" disabled={isInputDisabled}
                              placeholder="±점"
                              value={ev.adjust !== undefined ? ev.adjust : ""}
                              onChange={e => onCellChange(emp.emp_no, "adjust", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-11 text-center py-1 border border-slate-200 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                            <input
                              type="text" disabled={isInputDisabled}
                              placeholder="사유"
                              value={ev.adjustReason || ""}
                              onChange={e => onCellChange(emp.emp_no, "adjustReason", e.target.value)}
                              className="w-12 px-1 py-1 border border-slate-200 rounded text-[11px] disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </td>

                        <td className="p-1 text-center font-black text-blue-700 bg-blue-50/40 text-sm whitespace-nowrap font-mono">
                          {score > 0 ? score.toFixed(1) : '0.0'}
                        </td>

                        <td className="p-1 text-center bg-amber-50/40 whitespace-nowrap">
                          <select
                            disabled={isInputDisabled}
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

                        {/* 승진포인트: w-20 고정 너비로 낭비 제거 */}
                        {!isDeptLeader && (
                          <td className="p-1 text-center font-extrabold text-slate-800 whitespace-nowrap w-20">
                            {pts > 0 ? `${pts}점` : '-'}
                          </td>
                        )}

                        {/* 특이사항/비고: 남은 공간 전체를 자연스럽게 채우도록 w-full 적용 */}
                        <td className="p-1">
                          <input
                            type="text" disabled={isInputDisabled}
                            placeholder={isDeptLeader ? "부서장 평가의견 작성" : "특이사항 메모"}
                            value={ev.note || ""}
                            onChange={e => onCellChange(emp.emp_no, "note", e.target.value)}
                            className="w-full min-w-[200px] px-3 py-1.5 border border-slate-200 rounded text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none transition"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  <i className="fa-solid fa-comment-dots" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {modalData.dept} {modalData.name} 사원
                  </h3>
                  <p className="text-[11px] text-purple-600 font-semibold">1차 부서장 종합 평가 의견</p>
                </div>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {modalData.note}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
