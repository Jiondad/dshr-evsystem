import React, { useRef } from "react";
import { EmployeeSnapshot, StatusType } from "../types/hr";
import { DEPARTMENTS, POSITIONS } from "../lib/constants";
import { getSupabase } from "../lib/supabase";

interface Props {
  year: number;
  onYearChange?: (newYear: number) => void;
  employees: EmployeeSnapshot[];
  onCellChange: (empNo: string, field: keyof EmployeeSnapshot, val: any) => void;
  onAddRow: () => void;
  onDeleteRow: (empNo: string) => void;
  onCopyPrevYear: () => void;
  onSave: () => void;
}

const STATUS_LIST: StatusType[] = ["재직", "휴직"];

export const EmployeeMasterTab: React.FC<Props> = ({
  year, onYearChange, employees, onCellChange, onAddRow, onDeleteRow, onCopyPrevYear, onSave
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV 파일 직접 파싱하여 Supabase DB 및 화면에 일괄 적재
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
          alert("유효한 데이터 행이 존재하지 않습니다.");
          return;
        }

        const newParsed: EmployeeSnapshot[] = [];
        // 첫 줄(헤더)을 제외하고 데이터 파싱
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
          if (!cols[0] || !cols[1]) continue; // 사번, 성명 필수

          newParsed.push({
            snapshot_year: year,
            emp_no: cols[0],
            name: cols[1],
            dept: cols[2] || "생산팀",
            position: cols[3] || "사원",
            status: (cols[4] as StatusType) || "재직",
            birth_date: cols[5] ? cols[5].replace(/\//g, '-') : "",
            hire_date: cols[6] ? cols[6].replace(/\//g, '-') : "",
            promo_date: cols[7] ? cols[7].replace(/\//g, '-') : "",
            remarks: cols[8] || ""
          });
        }

        if (newParsed.length === 0) {
          alert("파싱된 유효 데이터가 없습니다. CSV 형식을 확인해주세요.");
          return;
        }

        const sb = getSupabase();
        if (sb) {
          const { error } = await sb.from("employee_snapshots").upsert(newParsed, { onConflict: "snapshot_year,emp_no" });
          if (error) {
            alert("Supabase 적재 오류: " + error.message);
            return;
          }
          alert(`${year}년 사원 마스터 ${newParsed.length}명이 Supabase DB에 성공적으로 일괄 적재되었습니다.`);
          window.location.reload();
        } else {
          alert("DB 미연결 상태입니다. DB 설정 후 다시 시도해주세요.");
        }
      } catch (err: any) {
        alert("파일 처리 중 오류 발생: " + err.message);
      }
    };
    reader.readAsText(file, "EUC-KR"); // 한글 엑셀 CSV 대응
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          {/* 마스터 화면 전용 연도 선택기 */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner">
            <button
              onClick={() => onYearChange && onYearChange(year - 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
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
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-file-excel text-emerald-600" />
              {year}년 12월 31일 기준 사원 마스터 스냅샷 ({employees.length}명)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              퇴사자는 평가 대상이 아니므로 행 삭제로 정리하며, 표 안의 셀을 엑셀처럼 직접 클릭하여 수정합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV 파일 일괄 업로드 숨김 인풋 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-file-arrow-up text-[11px] text-emerald-400" /> CSV 일괄 업로드
          </button>
          <button onClick={onCopyPrevYear} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border flex items-center gap-1.5">
            <i className="fa-solid fa-clone text-[11px]" /> {year === 2024 ? "2025년도 명부 복사" : `${year - 1}년도 명부 복사`}
          </button>
          <button onClick={onAddRow} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm">
            <i className="fa-solid fa-plus text-[11px]" /> 행 추가
          </button>
          <button onClick={onSave} className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm">
            <i className="fa-solid fa-floppy-disk text-[11px]" /> 사원마스터 저장
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
              <th className="p-2.5">비고 / 담당직무</th>
              <th className="p-2.5 text-center w-14">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp, idx) => (
              <tr key={emp.emp_no} className="hover:bg-blue-50/20">
                <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={emp.emp_no}
                    onChange={e => onCellChange(emp.emp_no, "emp_no", e.target.value)}
                    className="w-full px-1 py-0.5 font-mono text-slate-700 bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={emp.name}
                    onChange={e => onCellChange(emp.emp_no, "name", e.target.value)}
                    className="w-full px-1 py-0.5 font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5">
                  <select
                    value={emp.dept}
                    onChange={e => onCellChange(emp.emp_no, "dept", e.target.value)}
                    className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td className="p-1.5">
                  <select
                    value={emp.position}
                    onChange={e => onCellChange(emp.emp_no, "position", e.target.value)}
                    className="w-full px-1 py-0.5 font-semibold bg-transparent focus:bg-white focus:outline-none"
                  >
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="p-1.5 text-center">
                  <select
                    value={emp.status}
                    onChange={e => onCellChange(emp.emp_no, "status", e.target.value as StatusType)}
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
                    onChange={e => onCellChange(emp.emp_no, "birth_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date"
                    value={emp.hire_date || ""}
                    onChange={e => onCellChange(emp.emp_no, "hire_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="date"
                    value={emp.promo_date || ""}
                    onChange={e => onCellChange(emp.emp_no, "promo_date", e.target.value)}
                    className="px-1 py-0.5 text-[11px] bg-transparent focus:bg-white focus:outline-none"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={emp.remarks || ""}
                    placeholder="비고 / 담당직무"
                    onChange={e => onCellChange(emp.emp_no, "remarks", e.target.value)}
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
