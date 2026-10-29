import React from 'react';
import { EmployeeSnapshot, EvaluationItem, Grade } from '../types/hr';
import { finalScore, pointsFor, weightsFor, gradeFromScore, GRADES } from '../lib/constants';

interface Props {
  year: number;
  dept: string;
  employees: EmployeeSnapshot[];
  evaluations: Record<string, EvaluationItem>;
  onCellChange: (empNo: string, field: string, val: any) => void;
}

export const EvalInputTab: React.FC<Props> = ({
  year,
  dept,
  employees,
  evaluations,
  onCellChange
}) => {
  // 점수(역량, 성과, 자기계발, 부하육성, 가감점) 변경 시 등급까지 실시간 자동 계산
  const handleScoreChange = (emp: EmployeeSnapshot, field: string, rawVal: string) => {
    const val = rawVal === '' ? '' : parseFloat(rawVal) || 0;
    const currentEval = evaluations[emp.emp_no] || {
      competency: '',
      performance: '',
      selfDev: '',
      mentoring: '',
      adjust: '',
      adjustReason: '',
      grade: '',
      note: ''
    };

    const nextEval: EvaluationItem = {
      ...currentEval,
      [field]: val
    };

    // 점수 변경 후 즉시 새 환산점수 및 자동 등급 산출
    const computedScore = finalScore(emp.position, nextEval);
    const autoGrade = gradeFromScore(computedScore);

    // 필드 값 반영
    onCellChange(emp.emp_no, field, val);
    // 산출된 등급 자동 반영
    onCellChange(emp.emp_no, 'grade', autoGrade);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-blue-600" />
            {year}년 인사평가 결과 입력 ({dept} · {employees.length}명)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            점수를 입력하면 직급별 가중치가 반영되어 <b>최종 환산점수, 최종 등급, 승진 포인트</b>가 자동 산출됩니다.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border">
          <span className="text-slate-500 font-bold">등급 기준:</span>
          <span className="text-blue-600">S(91점↑) · 10점</span>
          <span className="text-emerald-600">A(81점↑) · 8점</span>
          <span className="text-slate-700">B(71점↑) · 6점</span>
          <span className="text-amber-600">C(61점↑) · 4점</span>
          <span className="text-rose-600">D(61점↓) · 2점</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-2.5 text-center w-14">사번</th>
              <th className="p-2.5 w-20">성명</th>
              <th className="p-2.5 w-20">부서</th>
              <th className="p-2.5 w-28">직위 (가중치)</th>
              <th className="p-2.5 text-center w-24">입사일</th>
              <th className="p-2.5 text-center w-24">최근승진일</th>
              <th className="p-2.5 text-center w-20 bg-blue-50/50">역량</th>
              <th className="p-2.5 text-center w-20 bg-blue-50/50">성과</th>
              <th className="p-2.5 text-center w-20 bg-blue-50/50">자기계발</th>
              <th className="p-2.5 text-center w-20 bg-blue-50/50">부하육성</th>
              <th className="p-2.5 text-center w-36">가감점 / 사유</th>
              <th className="p-2.5 text-center w-24 font-black bg-blue-50 text-blue-900">최종 환산점수</th>
              <th className="p-2.5 text-center w-24 font-black bg-amber-50 text-amber-900">최종 등급</th>
              <th className="p-2.5 text-center w-20">승진 포인트</th>
              <th className="p-2.5">특이사항</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => {
              const ev = evaluations[emp.emp_no] || {
                competency: '',
                performance: '',
                selfDev: '',
                mentoring: '',
                adjust: '',
                adjustReason: '',
                grade: '',
                note: ''
              };

              const w = weightsFor(emp.position);
              const fScore = finalScore(emp.position, ev);
              const pts = pointsFor(ev.grade);

              return (
                <tr key={emp.emp_no} className="hover:bg-slate-50 transition">
                  <td className="p-2 text-center font-mono text-slate-400 text-[11px]">{emp.emp_no}</td>
                  <td className="p-2 font-bold text-slate-800">{emp.name}</td>
                  <td className="p-2 text-slate-600">{emp.dept}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.position}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({w.competency*100}/{w.performance*100}/{w.selfDev*100}/{w.mentoring*100})
                    </span>
                  </td>
                  <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{emp.hire_date || '-'}</td>
                  <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{emp.promo_date || '-'}</td>

                  {/* 역량 */}
                  <td className="p-1.5 text-center bg-blue-50/20">
                    <input
                      type="number"
                      value={ev.competency !== '' ? ev.competency : ''}
                      onChange={e => handleScoreChange(emp, 'competency', e.target.value)}
                      placeholder="-"
                      className="w-14 text-center py-1 px-1 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:bg-white"
                    />
                  </td>

                  {/* 성과 */}
                  <td className="p-1.5 text-center bg-blue-50/20">
                    <input
                      type="number"
                      value={ev.performance !== '' ? ev.performance : ''}
                      onChange={e => handleScoreChange(emp, 'performance', e.target.value)}
                      placeholder="-"
                      className="w-14 text-center py-1 px-1 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:bg-white"
                    />
                  </td>

                  {/* 자기계발 (해당 직위 가중치 0이면 비활성화) */}
                  <td className="p-1.5 text-center bg-blue-50/20">
                    {w.selfDev > 0 ? (
                      <input
                        type="number"
                        value={ev.selfDev !== '' ? ev.selfDev : ''}
                        onChange={e => handleScoreChange(emp, 'selfDev', e.target.value)}
                        placeholder="-"
                        className="w-14 text-center py-1 px-1 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:bg-white"
                      />
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* 부하육성 (해당 직위 가중치 0이면 비활성화) */}
                  <td className="p-1.5 text-center bg-blue-50/20">
                    {w.mentoring > 0 ? (
                      <input
                        type="number"
                        value={ev.mentoring !== '' ? ev.mentoring : ''}
                        onChange={e => handleScoreChange(emp, 'mentoring', e.target.value)}
                        placeholder="-"
                        className="w-14 text-center py-1 px-1 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:bg-white"
                      />
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* 가감점 / 사유 */}
                  <td className="p-1.5 text-center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={ev.adjust !== '' ? ev.adjust : ''}
                        onChange={e => handleScoreChange(emp, 'adjust', e.target.value)}
                        placeholder="±"
                        className="w-11 text-center py-1 px-0.5 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={ev.adjustReason || ''}
                        onChange={e => onCellChange(emp.emp_no, 'adjustReason', e.target.value)}
                        placeholder="사유"
                        className="w-20 py-1 px-1 border border-slate-200 rounded-lg text-[11px] focus:border-blue-500"
                      />
                    </div>
                  </td>

                  {/* 최종 환산점수 */}
                  <td className="p-2 text-center font-black text-blue-700 bg-blue-50/40 text-sm font-mono">
                    {fScore > 0 ? fScore.toFixed(1) : '0.0'}
                  </td>

                  {/* 최종 등급 (자동 산출 & 필요 시 수동 조정 가능) */}
                  <td className="p-1.5 text-center bg-amber-50/40">
                    <select
                      value={ev.grade || ''}
                      onChange={e => onCellChange(emp.emp_no, 'grade', e.target.value as Grade)}
                      className={`px-2 py-1 rounded-lg font-black text-xs border ${
                        ev.grade === 'S' ? 'bg-blue-600 text-white border-blue-600' :
                        ev.grade === 'A' ? 'bg-emerald-600 text-white border-emerald-600' :
                        ev.grade === 'B' ? 'bg-slate-700 text-white border-slate-700' :
                        ev.grade === 'C' ? 'bg-amber-500 text-white border-amber-500' :
                        ev.grade === 'D' ? 'bg-rose-600 text-white border-rose-600' :
                        'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      <option value="">-</option>
                      {GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>

                  {/* 승진 포인트 */}
                  <td className="p-2 text-center font-extrabold text-blue-600 font-mono">
                    {pts}점
                  </td>

                  {/* 특이사항 */}
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={ev.note || ''}
                      onChange={e => onCellChange(emp.emp_no, 'note', e.target.value)}
                      placeholder="특이사항 메모"
                      className="w-full py-1 px-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:border-blue-500"
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
