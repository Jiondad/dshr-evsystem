import React, { useRef } from 'react';
import { EmployeeSnapshot, StatusType } from '../types/hr';
import { DEPARTMENTS, POSITIONS } from '../lib/constants';

interface Props {
  year: number;
  employees: EmployeeSnapshot[];
  onCellChange: (rowId: string, field: keyof EmployeeSnapshot, val: any) => void;
  onAddRow: () => void;
  onDeleteRow: (emp: EmployeeSnapshot) => void;
  onCopyPrevYear: () => void;
  onSave: () => void;
}

export const EmployeeMasterTab: React.FC<Props> = ({
  year, employees, onCellChange, onAddRow, onDeleteRow, onCopyPrevYear, onSave
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const prevYear = year === 2024 ? 2025 : year - 1;

  const handleExportCSV = () => {
    let csv = "사번,성명,부서,직위,상태,생년월일,입사일자,최근승진일,비고\n";
    employees.forEach(e => {
      csv += `"${e.emp_no}","${e.name}","${e.dept}","${e.position}","${e.status}","${e.birth_date || ''}","${e.hire_date || ''}","${e.promo_date || ''}","${e.remarks || ''}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `대성스틸_${year}년12월31일기준_사원마스터.csv`;
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
      if (lines.length <= 1) {
        alert("가져올 유효한 데이터 행이 없습니다.");
        return;
      }

      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 4) {
          const empNo = parts[0];
          const name = parts[1];
          const dept = parts[2] || "생산팀";
          const position = parts[3] || "사원";
          const status = (parts[4] as StatusType) || "재직";
          const birthDate = parts[5] || null;
          const hireDate = parts[6] || null;
          const promoDate = parts[7] || null;
          const remarks = parts[8] || "";

          const existing = employees.find(emp => emp.emp_no === empNo);
          if (existing && existing._rowId) {
            onCellChange(existing._rowId, "name", name);
            onCellChange(existing._rowId, "dept", dept);
            onCellChange(existing._rowId, "position", position);
            onCellChange(existing._rowId, "status", status);
            onCellChange(existing._rowId, "birth_date", birthDate);
            onCellChange(existing._rowId, "hire_date", hireDate);
            onCellChange(existing._rowId, "promo_date", promoDate);
            onCellChange(existing._rowId, "remarks", remarks);
          }
          successCount++;
        }
      }
      alert(`CSV 파일에서 총 ${successCount}건을 일괄 반영했습니다. 최종 저장을 눌러 DB에 보관해주세요.`);
    };
    reader.readAsText(file, "UTF-8");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-wrap justify-between items-center gap-4 pb-3 border-b">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-table-list text-emerald-600" />
            {year}년 12월 31일 기준 사원 마스터 ({employees.length}명)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            퇴직자는 행 삭제로 정리하며, 날짜는 달력 아이콘 클릭 또는 8자리 숫자(예: 20260101)로 바로 입력할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-file-arrow-up text-[11px]" /> CSV 일괄 업로드
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 border hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-file-csv text-[11px]" /> 엑셀 다운로드
          </button>
          <button
            onClick={onCopyPrevYear}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 border hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-copy text-[11px]" /> {prevYear}년도 명부 복사
          </button>
          <button
            onClick={onAddRow}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-[11px]" /> 행 추가
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-md transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-floppy-disk text-[11px]" /> 사원마스터 저장
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-2.5 text-center w-12 whitespace-nowrap">No</th>
              <th className="p-2.5 text-center w-24 whitespace-nowrap">사번</th>
              <th className="p-2.5 w-24 whitespace-nowrap">성명</th>
              <th className="p-2.5 w-24 whitespace-nowrap">부서</th>
              <th className="p-2.5 w-24 whitespace-nowrap">직위</th>
              <th className="p-2.5 text-center w-20 whitespace-nowrap">상태</th>
              <th className="p-2.5 text-center w-32 whitespace-nowrap">생년월일</th>
              <th className="p-2.5 text-center w-32 whitespace-nowrap">입사일자</th>
              <th className="p-2.5 text-center w-32 whitespace-nowrap">최근승진일</th>
              <th className="p-2.5 w-48 whitespace-nowrap">비고/담당직무</th>
              <th className="p-2.5 text-center w-12 whitespace-nowrap">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                  {year}년도 등록된 사원 데이터가 없습니다. [행 추가] 또는 [이전년도 명부 복사]를 눌러주세요.
                </td>
              </tr>
            ) : (
              employees.map((emp, idx) => (
                <tr key={emp._rowId || idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-2 text-center font-mono text-slate-400 whitespace-nowrap">{idx + 1}</td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={emp.emp_no}
                      onChange={e => onCellChange(emp._rowId!, "emp_no", e.target.value)}
                      placeholder="사번"
                      className="w-20 text-center font-mono font-bold border border-slate-200 rounded px-1.5 py-1 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={emp.name}
                      onChange={e => onCellChange(emp._rowId!, "name", e.target.value)}
                      placeholder="성명"
                      className="w-20 font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-1 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={emp.dept}
                      onChange={e => onCellChange(emp._rowId!, "dept", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={emp.position}
                      onChange={e => onCellChange(emp._rowId!, "position", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <select
                      value={emp.status}
                      onChange={e => onCellChange(emp._rowId!, "status", e.target.value as StatusType)}
                      className={`border rounded px-2 py-1 font-bold text-xs ${
                        emp.status === '재직' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        emp.status === '휴직' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      <option value="재직">재직</option>
                      <option value="휴직">휴직</option>
                      <option value="퇴직">퇴직</option>
                    </select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="date"
                      value={emp.birth_date || ""}
                      onChange={e => onCellChange(emp._rowId!, "birth_date", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="date"
                      value={emp.hire_date || ""}
                      onChange={e => onCellChange(emp._rowId!, "hire_date", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="date"
                      value={emp.promo_date || ""}
                      onChange={e => onCellChange(emp._rowId!, "promo_date", e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 font-mono text-[11px] text-amber-600 font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={emp.remarks || ""}
                      onChange={e => onCellChange(emp._rowId!, "remarks", e.target.value)}
                      placeholder="비고 / 담당직무"
                      className="w-full border border-slate-200 rounded px-2 py-1 text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => onDeleteRow(emp)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="사원 삭제"
                    >
                      <i className="fa-solid fa-trash-can text-xs" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
