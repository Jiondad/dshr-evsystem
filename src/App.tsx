import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeSnapshot, EvalStore, SnapshotStore, Grade } from './types/hr';
import { DEPARTMENTS, DEFAULT_SNAPSHOT_2025, DEFAULT_SEED_2025, finalScore, pointsFor, sortByDeptAndPosition } from './lib/constants';
import { getSupabase } from './lib/supabase';
import { DashboardCards } from './components/DashboardCards';
import { EvalInputTab } from './components/EvalInputTab';
import { PromoMatrixTab } from './components/PromoMatrixTab';
import { EmployeeMasterTab } from './components/EmployeeMasterTab';
import { Modals } from './components/Modals';

export default function App() {
  const [year, setYear] = useState<number>(2025);
  const [dept, setDept] = useState<string>("전체");
  const [tab, setTab] = useState<"input" | "promo" | "snapshot_master">("input");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeRetired, setIncludeRetired] = useState<boolean>(false);

  const [isWeightGuideOpen, setIsWeightGuideOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sbConnected, setSbConnected] = useState(() => !!getSupabase());

  const [snapshotStore, setSnapshotStore] = useState<SnapshotStore>(() => {
    const saved = localStorage.getItem("ds_snapshot_store_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return { 2025: DEFAULT_SNAPSHOT_2025 };
  });

  const [evalStore, setEvalStore] = useState<EvalStore>(() => {
    const saved = localStorage.getItem("ds_eval_store_v10");
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return { 2025: DEFAULT_SEED_2025 };
  });

  // DB에서 해당 연도 사원 명부 및 평가 데이터 즉시 불러오기
  const loadYearDataFromDB = async (targetYear: number) => {
    const sb = getSupabase();
    if (!sb) return;

    // 1. 사원 스냅샷 조회
    const { data: empData, error: empErr } = await sb
      .from("employee_snapshots")
      .select("*")
      .eq("snapshot_year", targetYear)
      .order("emp_no");

    if (!empErr && empData && empData.length > 0) {
      setSnapshotStore(prev => {
        const updated = { ...prev, [targetYear]: empData };
        localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
        return updated;
      });
    }

    // 2. 평가 데이터 조회
    const { data: evalData, error: evalErr } = await sb
      .from("annual_evaluations")
      .select("*")
      .eq("eval_year", targetYear);

    if (!evalErr && evalData && evalData.length > 0) {
      const loaded: Record<string, any> = {};
      evalData.forEach((r: any) => {
        loaded[r.emp_no] = {
          competency: r.comp_score !== null ? r.comp_score : "",
          performance: r.perf_score !== null ? r.perf_score : "",
          selfDev: r.self_dev_score !== null ? r.self_dev_score : "",
          mentoring: r.leadership_score !== null ? r.leadership_score : "",
          adjust: r.adj_score !== null ? r.adj_score : "",
          adjustReason: r.adj_reason || "",
          grade: r.final_grade || "",
          note: r.remarks || ""
        };
      });
      setEvalStore(prev => {
        const updated = { ...prev, [targetYear]: loaded };
        localStorage.setItem("ds_eval_store_v10", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // 연도 변경 시 실행
  const handleYearChange = (targetYear: number) => {
    setYear(targetYear);
    loadYearDataFromDB(targetYear);
  };

  useEffect(() => {
    loadYearDataFromDB(year);
  }, [year, sbConnected]);

  // 임원 -> 관리팀 -> 영업팀 -> 생산팀 우선 정렬 사원 목록
  const currentYearEmployees = useMemo(() => {
    const rawList = snapshotStore[year] || [];
    return [...rawList].sort(sortByDeptAndPosition);
  }, [snapshotStore, year]);

  const filteredEmps = useMemo(() => {
    return currentYearEmployees.filter(e => {
      const matchDept = dept === "전체" || e.dept === dept;
      const matchStatus = includeRetired ? true : (e.status === "재직");
      const matchSearch = searchQuery === "" ||
        (e.name && e.name.includes(searchQuery)) ||
        (e.emp_no && e.emp_no.includes(searchQuery)) ||
        (e.position && e.position.includes(searchQuery));
      return matchDept && matchStatus && matchSearch;
    });
  }, [currentYearEmployees, dept, searchQuery, includeRetired]);

  const currentYearEvals = evalStore[year] || {};
  const counts = useMemo(() => {
    const c: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    filteredEmps.forEach(e => {
      const g = currentYearEvals[e.emp_no]?.grade;
      if (g && c[g] !== undefined) c[g]++;
    });
    return c;
  }, [filteredEmps, currentYearEvals]);

  const totalCount = filteredEmps.length;
  const gradedTotal = (['S', 'A', 'B', 'C', 'D'] as Grade[]).reduce((s, g) => s + counts[g], 0);
  const getPct = (c: number) => (totalCount > 0 ? Math.round((c / totalCount) * 1000) / 10 : 0);

  const handleEvalCellChange = (empNo: string, field: string, val: any) => {
    setEvalStore(prev => {
      const yData = prev[year] || {};
      const empEval = yData[empNo] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
      const updated = { ...prev, [year]: { ...yData, [empNo]: { ...empEval, [field]: val } } };
      localStorage.setItem("ds_eval_store_v10", JSON.stringify(updated));
      return updated;
    });
  };

  // 행별 인덱스 기반으로 셀 값 수정 지원 (사번이 비어있어도 수정 가능)
  const handleSnapshotCellChange = (targetIndex: number, field: keyof EmployeeSnapshot, val: any) => {
    setSnapshotStore(prev => {
      const list = [...(prev[year] || [])];
      if (list[targetIndex]) {
        list[targetIndex] = { ...list[targetIndex], [field]: val };
      }
      const updated = { ...prev, [year]: list };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });
  };

  // 행 추가 시 사번을 빈값("")으로 초기 생성
  const handleAddRow = () => {
    const newEmp: EmployeeSnapshot = {
      snapshot_year: year,
      emp_no: "", // 사번 초기 빈값
      name: "",
      dept: "생산팀",
      position: "사원",
      birth_date: "",
      hire_date: "",
      promo_date: "",
      status: "재직",
      remarks: ""
    };
    setSnapshotStore(prev => {
      const updated = { ...prev, [year]: [...(prev[year] || []), newEmp] };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });
  };

  // 인덱스 및 사번 기반 삭제
  const handleDeleteRow = async (targetIndex: number, empNo: string) => {
    const targetEmp = (snapshotStore[year] || [])[targetIndex];
    const empLabel = targetEmp?.name ? `${targetEmp.name}(${targetEmp.emp_no || '미지정'})` : (empNo || '해당 행');

    if (!window.confirm(`[${year}년 사원 마스터]\n${empLabel}을(를) 마스터에서 삭제하시겠습니까?`)) {
      return;
    }

    setSnapshotStore(prev => {
      const list = [...(prev[year] || [])];
      list.splice(targetIndex, 1);
      const updated = { ...prev, [year]: list };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });

    if (empNo) {
      const sb = getSupabase();
      if (sb) {
        await sb.from("employee_snapshots").delete().match({ snapshot_year: year, emp_no: empNo });
      }
    }
  };

  const handleCopyPrevYear = () => {
    const prevYear = year === 2024 ? 2025 : year - 1;
    const baseList = snapshotStore[prevYear] || [];
    if (baseList.length === 0) {
      alert(`${prevYear}년도 사원 마스터가 존재하지 않습니다.`);
      return;
    }
    const copied = baseList.map(e => ({ ...e, snapshot_year: year }));
    setSnapshotStore(prev => {
      const updated = { ...prev, [year]: copied };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });
    alert(`${prevYear}년도 명부(${copied.length}명)를 ${year}년도 스냅샷으로 복사했습니다.`);
  };

  const handleSaveSnapshotMaster = async () => {
    const sb = getSupabase();
    if (!sb) {
      alert("Supabase 설정이 없어 브라우저에만 저장되었습니다.");
      return;
    }

    // 사번 미입력 검증
    const emptyNo = currentYearEmployees.some(e => !e.emp_no || e.emp_no.trim() === "");
    if (emptyNo) {
      alert("사번이 입력되지 않은 행이 있습니다. 모든 사원의 사번을 입력한 후 저장해주세요.");
      return;
    }

    const { error } = await sb.from("employee_snapshots").upsert(currentYearEmployees, { onConflict: "snapshot_year,emp_no" });
    if (error) alert("저장 실패: " + error.message);
    else alert(`${year}년도 사원마스터(${currentYearEmployees.length}명)가 Supabase에 영구 보관되었습니다.`);
  };

  const handleSaveAllEvals = async () => {
    const sb = getSupabase();
    if (!sb) {
      alert("Supabase 설정이 없어 로컬에만 저장되었습니다.");
      return;
    }
    const records = filteredEmps.map(e => {
      const ev = currentYearEvals[e.emp_no] || {};
      return {
        eval_year: year,
        emp_no: e.emp_no,
        comp_score: ev.competency === "" ? null : ev.competency,
        perf_score: ev.performance === "" ? null : ev.performance,
        self_dev_score: ev.selfDev === "" ? null : ev.selfDev,
        leadership_score: ev.mentoring === "" ? null : ev.mentoring,
        adj_score: ev.adjust === "" ? null : ev.adjust,
        adj_reason: ev.adjustReason || null,
        final_score: finalScore(e.position, ev),
        final_grade: ev.grade || null,
        promo_points: pointsFor(ev.grade),
        remarks: ev.note || null
      };
    });

    const { error } = await sb.from("annual_evaluations").upsert(records, { onConflict: "eval_year,emp_no" });
    if (error) alert("저장 실패: " + error.message);
    else alert(`${year}년도 평가데이터(${records.length}명)가 Supabase에 10년 보존 원장으로 기록되었습니다.`);
  };

  const handleExportCSV = () => {
    let csv = "\uFEFF사번,성명,부서,직위,입사일,최근승진일,역량,성과,자기계발,부하육성,가감점,가감사유,최종환산점수,최종등급,승진포인트,특이사항\n";
    filteredEmps.forEach(e => {
      const ev = currentYearEvals[e.emp_no] || {};
      const fScore = finalScore(e.position, ev);
      const pts = pointsFor(ev.grade);
      csv += `"${e.emp_no}","${e.name}","${e.dept}","${e.position}","${e.hire_date||''}","${e.promo_date||''}","${ev.competency||''}","${ev.performance||''}","${ev.selfDev||''}","${ev.mentoring||''}","${ev.adjust||''}","${ev.adjustReason||''}","${fScore}","${ev.grade||''}","${pts}","${ev.note||''}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `대성스틸_${year}년_인사평가결과_${dept}.csv`;
    link.click();
  };

  return (
    <div className="max-w-[1650px] mx-auto p-6 space-y-5">
      <header className="bg-[#0b192c] text-white rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i className="fa-solid fa-layer-group text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">대성스틸 인사평가 및 승진심사 관리시스템</h1>
            <p className="text-xs text-slate-400 mt-0.5">10개년 인사평가 원본 보존 · 연도별(12.31) 사원 스냅샷 마스터 · 과거 3개년 승진 포인트 연동</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#1e293b] rounded-xl p-1 border border-slate-700/80 shadow-inner">
            <button onClick={() => handleYearChange(year - 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <span className="px-3 py-1 font-bold text-xs tracking-wider text-amber-400 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-check" />{year}년 평가
            </span>
            <button onClick={() => handleYearChange(year + 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>

          <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setTab("input")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === 'input' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <i className="fa-solid fa-pen-to-square text-[11px]" /> 평가 결과 입력
            </button>
            <button
              onClick={() => setTab("promo")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === 'promo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <i className="fa-solid fa-award text-[11px]" /> 승진심사 매트릭스(3개년)
            </button>
            <button
              onClick={() => setTab("snapshot_master")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === 'snapshot_master' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-table-list text-[11px]" /> 연도별 사원마스터(12.31)
            </button>
          </div>

          <button
            onClick={() => setIsConfigOpen(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border ${sbConnected ? "bg-slate-800 text-emerald-400 border-emerald-500/40" : "bg-amber-600 text-white border-transparent"}`}
          >
            <i className="fa-solid fa-database text-[11px]" /> {sbConnected ? "DB 연결됨" : "DB 설정"}
          </button>
        </div>
      </header>

      {tab === "input" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
                <i className="fa-solid fa-users text-[11px]" /> 부서 필터
              </span>
              <button
                onClick={() => setDept("전체")}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${dept === '전체' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                전체 부서 ({filteredEmps.length})
              </button>
              {DEPARTMENTS.map(d => {
                const count = currentYearEmployees.filter(e => (includeRetired ? true : e.status === '재직') && e.dept === d).length;
                return (
                  <button
                    key={d} onClick={() => setDept(d)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${dept === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {d} ({count})
                  </button>
                );
              })}
              <label className="ml-3 flex items-center gap-1.5 text-xs text-slate-500 font-semibold cursor-pointer">
                <input
                  type="checkbox" checked={includeRetired} onChange={e => setIncludeRetired(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                퇴사자 포함 조회
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text" placeholder="사번, 성명, 직위 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-48 bg-slate-50 focus:bg-white"
              />
              <button
                onClick={() => setIsWeightGuideOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 border"
              >
                <i className="fa-solid fa-scale-balanced text-[11px]" /> 가중치 산출표
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-file-excel text-[11px]" /> CSV 내보내기
              </button>
              <button
                onClick={handleSaveAllEvals}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm"
              >
                <i className="fa-solid fa-cloud-arrow-up text-[11px]" /> 평가데이터 저장
              </button>
            </div>
          </div>

          <DashboardCards year={year} dept={dept} totalCount={totalCount} gradedTotal={gradedTotal} counts={counts} getPct={getPct} />
          <EvalInputTab year={year} dept={dept} employees={filteredEmps} evaluations={currentYearEvals} onCellChange={handleEvalCellChange} />
        </div>
      )}

      {tab === "promo" && <PromoMatrixTab year={year} employees={filteredEmps} evalStore={evalStore} />}
      {tab === "snapshot_master" && (
        <EmployeeMasterTab
          year={year}
          onYearChange={handleYearChange}
          employees={currentYearEmployees}
          onCellChange={handleSnapshotCellChange}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
          onCopyPrevYear={handleCopyPrevYear}
          onSave={handleSaveSnapshotMaster}
        />
      )}

      <Modals
        isWeightGuideOpen={isWeightGuideOpen} isConfigOpen={isConfigOpen}
        onCloseWeightGuide={() => setIsWeightGuideOpen(false)} onCloseConfig={() => setIsConfigOpen(false)}
        onConfigSaved={() => {
          setSbConnected(true);
          loadYearDataFromDB(year);
        }}
      />
    </div>
  );
}
