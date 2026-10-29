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
        (e.position && e.position.includes(search
