import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeSnapshot, EvalStore, SnapshotStore, Grade } from './types/hr';
import { DEPARTMENTS, finalScore, pointsFor, sortByDeptAndPosition } from './lib/constants';
import { getSupabase } from './lib/supabase';
import { DashboardCards } from './components/DashboardCards';
import { EvalInputTab } from './components/EvalInputTab';
import { PromoMatrixTab } from './components/PromoMatrixTab';
import { EmployeeMasterTab } from './components/EmployeeMasterTab';
import { Modals } from './components/Modals';

export default function App() {
  const [year, setYear] = useState<number>(2026);
  const [dept, setDept] = useState<string>("전체");
  const [tab, setTab] = useState<"input" | "promo" | "snapshot_master">("promo");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeRetired, setIncludeRetired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isWeightGuideOpen, setIsWeightGuideOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sbConnected, setSbConnected] = useState(() => !!getSupabase());

  // 초기 렌더링 지연을 막기 위해 로컬 캐시가 있으면 즉시 띄움
  const [snapshotStore, setSnapshotStore] = useState<SnapshotStore>(() => {
    const saved = localStorage.getItem("ds_snapshot_store_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [evalStore, setEvalStore] = useState<EvalStore>(() => {
    const saved = localStorage.getItem("ds_eval_store_v10");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // DB에서 데이터 병렬(Parallel) 즉시 로드 (3초 이상 지연 원천 차단)
  const loadAllDataFromDB = async () => {
    const sb = getSupabase();
    if (!sb) {
      setIsLoading(false);
      return;
    }

    try {
      // 로컬에 이미 데이터가 있으면 로딩 스피너 없이 백그라운드 갱신
      if (Object.keys(snapshotStore).length === 0) {
        setIsLoading(true);
      }

      // 두 쿼리를 병렬로 동시 실행
      const [empRes, evalRes] = await Promise.all([
        sb.from("employee_snapshots").select("*").order("emp_no"),
        sb.from("annual_evaluations").select("*")
      ]);

      if (empRes.error) {
        console.error("사원 스냅샷 조회 에러:", empRes.error);
      } else if (empRes.data) {
        const groupedSnap: SnapshotStore = {};
        empRes.data.forEach((e: any) => {
          const y = Number(e.snapshot_year);
          if (!groupedSnap[y]) groupedSnap[y] = [];
          groupedSnap[y].push({
            ...e,
            _rowId: `${e.snapshot_year}_${e.emp_no}`
          });
        });
        setSnapshotStore(groupedSnap);
        localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(groupedSnap));
      }

      if (evalRes.error) {
        console.error("평가 데이터 조회 에러:", evalRes.error);
      } else if (evalRes.data) {
        const groupedEval: EvalStore = {};
        evalRes.data.forEach((r: any) => {
          const y = Number(r.eval_year);
          if (!groupedEval[y]) groupedEval[y] = {};
          groupedEval[y][r.emp_no] = {
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
        setEvalStore(groupedEval);
        localStorage.setItem("ds_eval_store_v10", JSON.stringify(groupedEval));
      }
    } catch (err) {
      console.error("동기화 예외 발생:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllDataFromDB();
  }, [sbConnected]);

  const handleYearChange = (targetYear: number) => {
    setYear(targetYear);
  };

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

  const handleSnapshotCellChange = (rowId: string, field: keyof EmployeeSnapshot, val: any) => {
    setSnapshotStore(prev => {
      const list = prev[year] || [];
      const updatedList = list.map(e => e._rowId === rowId ? { ...e, [field]: val } : e);
      const updated = { ...prev, [year]: updatedList };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddRow = () => {
    const newEmp: EmployeeSnapshot = {
      _rowId: `new_${Date.now()}_${Math.random()}`,
      snapshot_year: year,
      emp_no: "",
      name: "",
      dept: "생산팀",
      position: "사원",
      birth_date: null,
      hire_date: null,
      promo_date: null,
      status: "재직",
      remarks: ""
    };
    setSnapshotStore(prev => {
      const updated = { ...prev, [year]: [...(prev[year] || []), newEmp] };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRow = async (targetEmp: EmployeeSnapshot) => {
    const empLabel = targetEmp?.name ? `${targetEmp.name}(${targetEmp.emp_no || '미지정'})` : (targetEmp.emp_no || '해당 사원');

    if (!window.confirm(`[${year}년 사원 마스터]\n${empLabel} 님을 마스터에서 삭제하시겠습니까?`)) {
      return;
    }

    setSnapshotStore(prev => {
      const list = (prev[year] || []).filter(e => e._rowId !== targetEmp._rowId);
      const updated = { ...prev, [year]: list };
      localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(updated));
      return updated;
    });

    if (targetEmp.emp_no) {
      const sb = getSupabase();
      if (sb) {
        await sb.from("employee_snapshots").delete().match({ snapshot_year: year, emp_no: targetEmp.emp_no });
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
    const copied = baseList.map(e => ({
      ...e,
      snapshot_year: year,
      _rowId: `${year}_${e.emp_no}_${Math.random()}`
    }));
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

    const emptyNo = currentYearEmployees.some(e => !e.emp_no || e.emp_no.trim() === "");
    if (emptyNo) {
      alert("사번이 입력되지 않은 행이 있습니다. 모든 사원의 사번을 입력한 후 저장해주세요.");
      return;
    }

    const cleanData = currentYearEmployees.map(e => ({
      snapshot_year: e.snapshot_year,
      emp_no: e.emp_no.trim(),
      name: e.name || "",
      dept: e.dept || "생산팀",
      position: e.position || "사원",
      birth_date: e.birth_date && String(e.birth_date).trim() !== "" ? e.birth_date : null,
      hire_date: e.hire_date && String(e.hire_date).trim() !== "" ? e.hire_date : null,
      promo_date: e.promo_date && String(e.promo_date).trim() !== "" ? e.promo_date : null,
      status: e.status || "재직",
      remarks: e.remarks || ""
    }));

    const { error } = await sb.from("employee_snapshots").upsert(cleanData, { onConflict: "snapshot_year,emp_no" });
    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert(`${year}년도 사원마스터(${cleanData.length}명)가 Supabase에 영구 보관되었습니다.`);
      await loadAllDataFromDB();
    }
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
    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert(`${year}년도 평가데이터(${records.length}명)가 Supabase에 10년 보존 원장으로 기록되었습니다.`);
      await loadAllDataFromDB();
    }
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
          {tab === "input" && (
            <div className="flex items-center bg-[#1e293b] rounded-xl p-1 border border-slate-700/80 shadow-inner">
              <button
                onClick={() => handleYearChange(year - 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="이전 연도 평가"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <span className="px-3 py-1 font-bold text-xs tracking-wider text-amber-400 flex items-center gap-1.5">
                <i className="fa-regular fa-calendar-check" />{year}년 평가
              </span>
              <button
                onClick={() => handleYearChange(year + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="다음 연도 평가"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          )}

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

      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600 mb-3" />
          <p className="text-sm font-bold text-slate-700">Supabase DB에서 10년치 원장 데이터를 동기화하는 중입니다...</p>
        </div>
      ) : (
        <>
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
        </>
      )}

      <Modals
        isWeightGuideOpen={isWeightGuideOpen} isConfigOpen={isConfigOpen}
        onCloseWeightGuide={() => setIsWeightGuideOpen(false)} onCloseConfig={() => setIsConfigOpen(false)}
        onConfigSaved={() => {
          setSbConnected(true);
          loadAllDataFromDB();
        }}
      />
    </div>
  );
}
