import React, { useRef } from "react";
import { EmployeeSnapshot, StatusType } from "../types/hr";
import { DEPARTMENTS, POSITIONS } from "../lib/constants";
import { getSupabase } from "../lib/supabase";

interface Props {
  year: number;
  onYearChange?: (newYear: number) => void;
  employees: EmployeeSnapshot[];
  onCellChange: (rowId: string, field: keyof EmployeeSnapshot, val: any) => void;
  onAddRow: () => void;
  onDeleteRow: (emp: EmployeeSnapshot) => void;
  onCopyPrevYear: () => void;
  onSave: () => void;
}

const STATUS_LIST: StatusType[] = ["재직", "휴직"];

export const EmployeeMasterTab: React.FC<Props> = ({
  year, onYearChange, employees, onCellChange, onAddRow, onDeleteRow, onCopyPrevYear, onSave
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사원 마스터 엑셀 다운로드 함수
  const handleExportExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"></head>
      <body>
        <table border="1">
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th>No</th><th>사번</th><th>성명</th><th>부서</th><th>직위</th><th>상태</th><th>생년월일</th><th>입사일자</th><th>최근승진일</th><th>비고/담당직무</th>
          </tr>
    `;

    employees.forEach((e, idx) => {
      excelContent += `
        <tr>
          <td>${idx + 1}</td>
          <td style="mso-number-format:'\\@';">${e.emp_no || ''}</td>
          <td>${e.name || ''}</td>
          <td>${e.dept || ''}</td>
          <td>${e.position || ''}</td>
          <td>${e.status || ''}</td>
          <td>${e.birth_date || ''}</td>
          <td>${e.hire_date || ''}</td>
          <td>${e.promo_date || ''}</td>
          <td>${e.remarks || ''}</td>
        </tr>
      `;
    });

    excelContent += `</table></body></html>`;
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `대성스틸_${year}년_사원마스터_명부.xls`;
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: ProgressEvent<FileReader>) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== "string") return;

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
          alert("유효한 데이터 행이 존재하지 않습니다.");
          return;
        }

        const newParsed: EmployeeSnapshot[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
          if (!cols[0] || !cols[1]) continue;

          newParsed.push({
            _rowId: `${year}_${cols[0]}_${Math.random()}`,
            snapshot_year: year,
            emp_no: cols[0],
            name: cols[1],
            dept: cols[2] || "생산팀",
            position: cols[3] || "사원",
            status: (cols[4] as StatusType) || "재직",
            birth_date: cols[5] ? cols[5].replace(/\//g, '-') : null,
            hire_date: cols[6] ? cols[6].replace(/\//g, '-') : null,
            promo_date: cols[7] ? cols[7].replace(/\//g, '-') : null,
            remarks: cols[8] || ""
          });
        }

        if (newParsed.length === 0) {
          alert("파싱된 유효 데이터가 없습니다. CSV 형식을 확인해주세요.");
          return;
        }

        const sb = getSupabase();
        if (sb) {
          const cleanParsed = newParsed.map(e => ({
            snapshot_year: e.snapshot_year,
            emp_no: e.emp_no,
            name: e.name,
            dept: e.dept,
            position: e.position,
            status: e.status,
            birth_date: e.birth_date || null,
            hire_date: e.hire_date || null,
            promo_date: e.promo_date || null,
            remarks: e.remarks
          }));
          const { error } = await sb.from("employee_snapshots").upsert(cleanParsed, { onConflict: "snapshot_year,emp_no" });
          if (error) {
            alert("Supabase 적재 오류: " + error.message);
            return;
          }
          alert(`${year}년 사원 마스터 ${cleanParsed.length}명이 Supabase DB에 성공적으로 일괄 적재되었습니다.`);
          window.location.reload();
        } else {
          alert("DB 미연결 상태입니다. DB 설정 후 다시 시도해주세요.");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert("파일 처리 중 오류 발생: " + err.message);
        } else {
          alert("파일 처리 중 알 수 없는 오류가 발생했습니다.");
        }
      }
    };
    reader.readAsText(file, "EUC-KR");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner">
            <button
              onClick={() => onYearChange && onYearChange(year - 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
              title="이전 연도"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <span className="px-3 py-1 font-black text-xs text-blue-700 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-check" />
              {year}년 12.31 명부
            </span>
            <button
              onClick={() => onYearChange && onYearChange(year + 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
              title="다음 연도"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-file-excel text-emerald-600" />
              {year}년 12월 31일 기준 사원 마스터 ({employees.length}명)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              퇴사자는 평가 대상이 아니므로 행 삭제로 정리하며, 표 안의 셀을 엑셀처럼 직접 클릭하여 수정합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <i className="fa-solid fa-file-arrow-up text-[11px] text-emerald-400" /> CSV 일괄 업로드
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition"
          >
            <i className="fa-solid fa-file-excel text-[11px]" /> 엑셀 다운로드
          </button>
          <button onClick={onCopyPrevYear} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border flex items-center gap-1.5 transition">
            <i className="fa-solid fa-clone text-[11px]" /> {year === 2024 ? "2025년도 명부 복사" : `${year - 1}년도 명부 복사`}
          </button>
          <button onClick={onAddRow} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition">
            <i className="fa-solid fa-plus text-[11px]" /> 행 추가
          </button>
          <button onClick={onSave} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition">
            <i className="fa-solid fa-floppy-disk text-[11px]" /> 사원마스터 저장
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b">
            <tr>
              <th className="p-2.5 text-center w-12">No</th>
              <th className="p-2.5 w-28">사번</th>
              <th className="p-2.5 w-24">성명</th>
              <th className="p-2.5 w-28">부서</th>
              <th className="p-2.5 w-24">직위</th>
              <th className="p-2.5 text-center w-24">상태</th>
              <th className="p-2.5 text-center w-28">생년월일</th>
              <th className="p-2.5 text-center w-28">입사일자</th>
              <th className="p-2.5 text-center w-28">최근승진일</th>
              <th className="p-2.5">비고 / 담당직무</th>
              <th className="p-2.5 text-center w-16 text-rose-600">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                  등록된 사원 마스터 데이터가 없습니다. [행 추가] 또는 [CSV 일괄 업로드]를 이용해주세요.
                </td>
              </tr>
            ) : (
              employees.map((emp, idx) => {
                const rowKey = emp._rowId || `row_${emp.snapshot_year}_${emp.emp_no || idx}`;
                return (
                  <tr key={rowKey} className="hover:bg-blue-50/20 transition">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={emp.emp_no || ""}
                        placeholder="사번 입력"
                        onChange={e => onCellChange(rowKey, "emp_no", e.target.value)}
                        className="w-full px-2 py-1 font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={emp.name || ""}
                        placeholder="성명"
                        onChange={e => onCellChange(rowKey, "name", e.target.value)}
                        className="w-full px-1.5 py-0.5 font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        value={emp.dept}
                        onChange={e => onCellChange(rowKey, "dept", e.target.value)}
                        className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none rounded"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <select
                        value={emp.position}
                        onChange={e => onCellChange(rowKey, "position", e.target.value)}
                        className="w-full px-1 py-0.5 font-semibold bg-transparent focus:bg-white focus:outline-none rounded"
                      >
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5 text-center">
                      <select
                        value={emp.status}
                        onChange={e => onCellChange(rowKey, "status", e.target.value as StatusType)}
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          emp.status === "재직" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="date"
                        value={emp.birth_date || ""}
                        onChange={e => onCellChange(rowKey, "birth_date", e.target.value)}
                        className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none rounded"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="date"
                        value={emp.hire_date || ""}
                        onChange={e => onCellChange(rowKey, "hire_date", e.target.value)}
                        className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none rounded"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="date"
                        value={emp.promo_date || ""}
                        onChange={e => onCellChange(rowKey, "promo_date", e.target.value)}
                        className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none rounded"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={emp.remarks || ""}
                        placeholder="비고 / 담당직무"
                        onChange={e => onCellChange(rowKey, "remarks", e.target.value)}
                        className="w-full px-1 py-0.5 text-slate-600 bg-transparent focus:bg-white focus:outline-none rounded"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        onClick={() => onDeleteRow(emp)}
                        className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title={`${emp.name || '사원'} 삭제`}
                      >
                        <i className="fa-regular fa-trash-can text-sm" />
                      </button>
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
