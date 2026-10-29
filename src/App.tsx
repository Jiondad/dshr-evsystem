import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeSnapshot, EvalStore, SnapshotStore, Grade, AuthUser, LockStore } from './types/hr';
import { DEPARTMENTS, finalScore, pointsFor, sortByDeptAndPosition, gradeFromScore } from './lib/constants';
import { getSupabase } from './lib/supabase';
import { DashboardCards } from './components/DashboardCards';
import { EvalInputTab } from './components/EvalInputTab';
import { PromoMatrixTab } from './components/PromoMatrixTab';
import { EmployeeMasterTab } from './components/EmployeeMasterTab';
import { Modals } from './components/Modals';
import { LoginView } from './components/LoginView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = sessionStorage.getItem("ds_auth_user");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [dept, setDept] = useState<string>("전체");
  const [tab, setTab] = useState<"input" | "promo" | "snapshot_master">("input");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeRetired, setIncludeRetired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [lockStore, setLockStore] = useState<LockStore>({});
  const [isWeightGuideOpen, setIsWeightGuideOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [sbConnected, setSbConnected] = useState(() => !!getSupabase());

  const [snapshotStore, setSnapshotStore] = useState<SnapshotStore>(() => {
    const saved = localStorage.getItem("ds_snapshot_store_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // 최종 대표이사 평가 저장소
  const [evalStore, setEvalStore] = useState<EvalStore>(() => {
    const saved = localStorage.getItem("ds_eval_store_v10");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // 1차 부서장 평가 저장소
  const [deptEvalStore, setDeptEvalStore] = useState<EvalStore>(() => {
    const saved = localStorage.getItem("ds_dept_eval_store_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const loadAllDataFromDB = async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      if (Object.keys(snapshotStore).length === 0) {
        setIsLoading(true);
      }

      const [empRes, evalRes, deptEvalRes, lockRes] = await Promise.all([
        sb.from("employee_snapshots").select("*").order("emp_no"),
        sb.from("annual_evaluations").select("*"),
        sb.from("dept_evaluations").select("*"),
        sb.from("evaluation_locks").select("*")
      ]);

      if (empRes.data) {
        const groupedSnap: SnapshotStore = {};
        empRes.data.forEach((e: any) => {
          const y = Number(e.snapshot_year);
          if (!groupedSnap[y]) groupedSnap[y] = [];
          groupedSnap[y].push({ ...e, _rowId: `${e.snapshot_year}_${e.emp_no}` });
        });
        setSnapshotStore(groupedSnap);
        localStorage.setItem("ds_snapshot_store_v1", JSON.stringify(groupedSnap));
      }

      if (evalRes.data) {
        const groupedEval: EvalStore = {};
        evalRes.data.forEach((r: any) => {
          const y = Number(r.eval_year);
          if (!groupedEval[y]) groupedEval[y] = {};
          groupedEval[y][r.emp_no] = {
            competency: r.comp_score !== null ? r.comp_score : "",
            performance: r.perf_score !== null ? r.perf_score : "",
            self
