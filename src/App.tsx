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

  // 최종 대표이사 평가 원장 저장소
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

      if (deptEvalRes.data) {
        const groupedDeptEval: EvalStore = {};
        deptEvalRes.data.forEach((r: any) => {
          const y = Number(r.eval_year);
          if (!groupedDeptEval[y]) groupedDeptEval[y] = {};
          groupedDeptEval[y][r.emp_no] = {
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
        setDeptEvalStore(groupedDeptEval);
        localStorage.setItem("ds_dept_eval_store_v1", JSON.stringify(groupedDeptEval));
      }

      if (lockRes.data) {
        const locks: LockStore = {};
        lockRes.data.forEach((l: any) => {
          locks[Number(l.eval_year)] = !!l.is_locked;
        });
        setLockStore(locks);
      }
    } catch (err) {
      console.error("데이터 로드 예외:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllDataFromDB();
    }
  }, [sbConnected, currentUser]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    sessionStorage.setItem("ds_auth_user", JSON.stringify(user));
    setTab("input");
    if (user.role === 'LV2_DEPT_LEADER' && user.dept) {
      setDept(user.dept);
    } else {
      setDept("전체");
    }
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      sessionStorage.removeItem("ds_auth_user");
      setCurrentUser(null);
    }
  };

  const isCurrentYearLocked = !!lockStore[year];
  const isDeptLeader = currentUser?.role === 'LV2_DEPT_LEADER';
  const isAdmin = currentUser?.role === "LV0_ADMIN";

  const handleToggleLock = async () => {
    if (!isAdmin) {
      alert("평가 잠금 및 해제 권한은 총괄관리자(LV.0)에게만 있습니다.");
      return;
    }
    const nextState = !isCurrentYearLocked;
    const actionText = nextState ? "확정 및 잠금" : "잠금 해제";
    if (!window.confirm(`${year}년도 평가를 [${actionText}] 처리하시겠습니까?`)) return;

    setLockStore(prev => ({ ...prev, [year]: nextState }));
    const sb = getSupabase();
    if (sb) {
      await sb.from("evaluation_locks").upsert({
        eval_year: year,
        is_locked: nextState,
        locked_by: currentUser.name,
        locked_at: new Date().toISOString()
      });
    }
  };

  const handleYearChange = (targetYear: number) => {
    setYear(targetYear);
  };

  const currentYearEmployees = useMemo(() => {
    const rawList = snapshotStore[year] || [];
    return [...rawList].sort(sortByDeptAndPosition);
  }, [snapshotStore, year]);

  const filteredEmps = useMemo(() => {
    return currentYearEmployees.filter(e => {
      const targetDept = isDeptLeader ? (currentUser?.dept || '') : dept;
      const matchDept = targetDept === "전체" || e.dept === targetDept;
      const matchStatus = includeRetired ? true : (e.status === "재직");
      const matchSearch = searchQuery === "" ||
        (e.name && e.name.includes(searchQuery)) ||
        (e.emp_no && e.emp_no.includes(searchQuery)) ||
        (e.position && e.position.includes(searchQuery));
      return matchDept && matchStatus && matchSearch;
    });
  }, [currentYearEmployees, dept, searchQuery, includeRetired, isDeptLeader, currentUser]);

  // ★ 부서장(LV.2)이라도 해당 연도의 dept_evaluations가 없으면 기존 원장(evalStore)을 안전하게 읽어옴
  const currentYearEvals = useMemo(() => {
    if (isDeptLeader) {
      const deptData = deptEvalStore[year] || {};
      if (Object.keys(deptData).length > 0) return deptData;
      return evalStore[year] || {};
    }
    return evalStore[year] || {};
  }, [isDeptLeader, deptEvalStore, evalStore, year]);

  const currentDeptEvals = deptEvalStore[year] || {};

  const counts = useMemo(() => {
    const c: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D:
