import React from "react";
import { EmployeeSnapshot, StatusType } from "../types/hr";
import { DEPARTMENTS, POSITIONS } from "../lib/constants";

interface Props {
  year: number;
  employees: EmployeeSnapshot[];
  onCellChange: (empNo: string, field: keyof EmployeeSnapshot, val: any) => void;
  onAddRow: () => void;
  onDeleteRow: (empNo: string) => void;
  onCopyPrevYear: () => void;
  onSave: () => void;
}

const STATUS_LIST: StatusType[] = ["재직", "퇴사", "휴직"];

export const EmployeeMasterTab: React.FC<Props> = ({
  year, employees, onCellChange, onAddRow, onDeleteRow, onCopyPrevYear, onSave
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-file-excel text-emerald-600" />
            {year}년 12월 31일 기준 사원 마스터 스냅샷 ({employees.length}명)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            엑셀 시트처럼 직접 수정 가능하며, 퇴사자는 삭제 대신 '상태'를 퇴사로 변경하고 퇴사일자를 기재합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCopyPrevYear} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border">
            <i className="fa-solid fa-clone mr-1" /> {year - 1}년도 명부 복사
          </button>
          <button onClick={onAddRow} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
            <i className="fa-solid fa-plus mr-1" /> 행 추가
          </button>
          <button onClick={onSave} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm">
            <i className="fa-solid fa-floppy-disk mr-1" /> 사원마스터 저장
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-2.5 text-center w-12">No</th>
              <th className="p-2.5 w-24">사번</th>
              <th className="p-2.5 w-24">성명</th>
              <th className="p-2.5 w-28">부서</th>
              <th className="p-2.5 w-24">직위</th>
              <th className="p-2.5 text-center w-24">상태</th>
              <th className="p-2.5 text-center w-28">생년월일</th>
              <th className="p-2.5 text-center w-28">입사일자</th>
              <th className="p-2.5 text-center w-28">최근승진일</th>
              <th className="p-2.5 text-center w-28">퇴사일자</th>
              <th className="p-2.5">비고 / 직무</th>
              <th className="p-2.5 text-center w-14">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp, idx) => (
              <tr key={emp.emp_no} className={`hover:bg-blue-50/20 ${emp.status === "퇴사" ? "bg-rose-50/30" : ""}`}>
                <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="p-1.5">
                  <input
                    type="text" value={emp.emp_no} onChange={e => onCellChange(emp.emp_no, "emp_no", e.target.value)}
                    className="w-full px-1 py-0.5 font-mono text-slate-700 bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text" value={emp.name} onChange={e => onCellChange(emp.emp_no, "name", e.target.value)}
                    className="w-full px-1 py-0.5 font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5">
                  <select
                    value={emp.dept} onChange={e => onCellChange(emp.emp_no, "dept", e.target.value)}
                    className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <select
                    value={emp.position} onChange={e => onCellChange(emp.emp_no, "position", e.target.value)}
                    className="w-full px-1 py-0.5 font-semibold bg-transparent focus:bg-white focus:outline-none"
                  >
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="p-1.5 text-center">
                  <select
                    value={emp.status} onChange={e => onCellChange(emp.emp_no, "status", e.target.value as StatusType)}
                    className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      emp.status === "재직" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date" value={emp.birth_date || ""} onChange={e => onCellChange(emp.emp_no, "birth_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date" value={emp.hire_date || ""} onChange={e => onCellChange(emp.emp_no, "hire_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date" value={emp.promo_date || ""} onChange={e => onCellChange(emp.emp_no, "promo_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date" value={emp.retire_date || ""} onChange={e => onCellChange(emp.emp_no, "retire_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none text-rose-600"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text" value={emp.remarks || ""} placeholder="비고 입력" onChange={e => onCellChange(emp.emp_no, "remarks", e.target.value)}
                    className="w-full px-1 py-0.5 text-slate-600 bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <button onClick={() => onDeleteRow(emp.emp_no)} className="text-slate-300 hover:text-rose-600">
                    <i className="fa-regular fa-trash-can" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};