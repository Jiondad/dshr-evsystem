import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeSnapshot, EvalStore, SnapshotStore, Grade, AuthUser, LockStore, DeptSubmissionStore } from './types/hr';
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
  const [submissionStore, setSubmissionStore] = useState<DeptSubmissionStore>({});

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

  const [evalStore, setEvalStore] = useState<EvalStore>(() => {
    const saved = localStorage.getItem("ds_eval_store_v10");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

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

      const [empRes, evalRes, deptEvalRes, lockRes, subRes] = await Promise.all([
        sb.from("employee_snapshots").select("*").order("emp_no"),
        sb.from("annual_evaluations").select("*"),
        sb.from("dept_evaluations").select("*"),
        sb.from("evaluation_locks").select("*"),
        sb.from("dept_submissions").select("*")
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

      if (subRes.data) {
        const subs: DeptSubmissionStore = {};
        subRes.data.forEach((s: any) => {
          const y = Number(s.eval_year);
          if (!subs[y]) subs[y] = {};
          subs[y][s.dept] = {
            isSubmitted: !!s.is_submitted,
            submittedBy: s.submitted_by,
            submittedAt: s.submitted_at
          };
        });
        setSubmissionStore(subs);
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

  const currentDeptSubmission = currentUser?.dept ? submissionStore[year]?.[currentUser.dept] : undefined;
  const isCurrentDeptSubmitted = !!currentDeptSubmission?.isSubmitted;

  const handleSubmitDeptEval = async () => {
    if (!isDeptLeader || !currentUser.dept) return;

    const targetEmps = (snapshotStore[year] || []).filter(e => e.dept === currentUser.dept && e.status === "재직" && e.emp_no !== '140004');
    const myDeptEvals = deptEvalStore[year] || {};
    const uncompleted = targetEmps.filter(e => {
      const ev = myDeptEvals[e.emp_no];
      return !ev || ev.competency === "" || ev.performance === "";
    });

    if (uncompleted.length > 0) {
      const names = uncompleted.map(e => e.name).join(", ");
      alert(`[제출 불가] 아직 평가 점수가 입력되지 않은 사원이 있습니다:\n(${names})\n모든 부서원의 평가를 마친 후 제출해주세요.`);
      return;
    }

    if (!window.confirm(`[${currentUser.dept} 1차 인사평가 최종 제출]\n제출 후에는 평가 점수 수정이 잠기며, 대표이사 최종평가로 전달됩니다.\n정말 제출하시겠습니까?`)) {
      return;
    }

    await handleSaveAllEvals();

    const sb = getSupabase();
    if (sb) {
      await sb.from("dept_submissions").upsert({
        eval_year: year,
        dept: currentUser.dept,
        is_submitted: true,
        submitted_by: currentUser.name,
        submitted_at: new Date().toISOString()
      });
      alert(`[제출 완료] ${year}년도 ${currentUser.dept} 1차 인사평가가 성공적으로 제출되었습니다.`);
      await loadAllDataFromDB();
    }
  };

  const handleUnlockDeptSubmission = async (targetDept: string) => {
    if (!isAdmin) return;
    if (!window.confirm(`[${targetDept}] 부서의 1차 평가 제출 상태를 해제하여 부서장의 점수 재수정을 허용하시겠습니까?`)) {
      return;
    }

    const sb = getSupabase();
    if (sb) {
      await sb.from("dept_submissions").upsert({
        eval_year: year,
        dept: targetDept,
        is_submitted: false,
        submitted_by: currentUser.name,
        submitted_at: new Date().toISOString()
      });
      alert(`[수정 허용] ${targetDept} 1차 평가가 재수정 가능한 상태로 변경되었습니다.`);
      await loadAllDataFromDB();
    }
  };

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

  const currentYearEvals = isDeptLeader
    ? (deptEvalStore[year] || {})
    : (evalStore[year] || {});

  const currentDeptEvals = deptEvalStore[year] || {};

  const deptProgressStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; isSubmitted: boolean }> = {};
    DEPARTMENTS.forEach(d => {
      const emps = currentYearEmployees.filter(e => e.dept === d && e.status === '재직' && e.emp_no !== '140004');
      const dEvals = deptEvalStore[year] || {};
      const doneCount = emps.filter(e => {
        const ev = dEvals[e.emp_no];
        return ev && ev.competency !== "" && ev.performance !== "";
      }).length;
      const isSub = !!submissionStore[year]?.[d]?.isSubmitted;
      stats[d] = { total: emps.length, done: doneCount, isSubmitted: isSub };
    });
    return stats;
  }, [currentYearEmployees, deptEvalStore, submissionStore, year]);

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
    if (isCurrentYearLocked) {
      alert("해당 연도의 평가는 확정 및 마감되어 수정할 수 없습니다.");
      return;
    }
    if (isDeptLeader && isCurrentDeptSubmitted) {
      alert("1차 평가가 이미 제출 완료되어 점수를 수정할 수 없습니다. (수정이 필요하면 관리자에게 요청하세요)");
      return;
    }

    if (isDeptLeader) {
      setDeptEvalStore(prev => {
        const yData = prev[year] || {};
        const empEval = yData[empNo] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
        const updated = { ...prev, [year]: { ...yData, [empNo]: { ...empEval, [field]: val } } };
        localStorage.setItem("ds_dept_eval_store_v1", JSON.stringify(updated));
        return updated;
      });
    } else {
      setEvalStore(prev => {
        const yData = prev[year] || {};
        const empEval = yData[empNo] || { competency: "", performance: "", selfDev: "", mentoring: "", adjust: "", adjustReason: "", grade: "", note: "" };
        const updated = { ...prev, [year]: { ...yData, [empNo]: { ...empEval, [field]: val } } };
        localStorage.setItem("ds_eval_store_v10", JSON.stringify(updated));
        return updated;
      });
    }
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
    if (!window.confirm(`[${year}년 사원 마스터]\n${empLabel} 님을 마스터에서 삭제하시겠습니까?`)) return;

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
    if (error) alert("저장 실패: " + error.message);
    else {
      alert(`${year}년도 사원마스터(${cleanData.length}명)가 Supabase에 영구 보관되었습니다.`);
      await loadAllDataFromDB();
    }
  };

  const handleSaveAllEvals = async () => {
    if (isCurrentYearLocked) {
      alert("해당 연도의 평가는 확정 및 마감되어 저장할 수 없습니다.");
      return;
    }
    if (isDeptLeader && isCurrentDeptSubmitted) {
      alert("1차 평가가 이미 제출 완료되어 저장할 수 없습니다.");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      alert("Supabase 설정이 없어 브라우저에만 저장되었습니다.");
      return;
    }

    if (isDeptLeader) {
      const records = filteredEmps.map(e => {
        const ev = currentYearEvals[e.emp_no] || {};
        return {
          eval_year: year,
          emp_no: e.emp_no,
          dept: e.dept,
          evaluator_id: currentUser?.id,
          comp_score: ev.competency === "" ? null : ev.competency,
          perf_score: ev.performance === "" ? null : ev.performance,
          self_dev_score: ev.selfDev === "" ? null : ev.selfDev,
          leadership_score: ev.mentoring === "" ? null : ev.mentoring,
          adj_score: ev.adjust === "" ? null : ev.adjust,
          adj_reason: ev.adjustReason || null,
          final_score: finalScore(e.position, ev),
          final_grade: ev.grade || null,
          remarks: ev.note || null
        };
      });

      const { error } = await sb.from("dept_evaluations").upsert(records, { onConflict: "eval_year,emp_no" });
      if (error) alert("부서장 평가 저장 실패: " + error.message);
      else {
        alert(`${year}년도 ${currentUser?.dept} 1차 부서장 평가(${records.length}명)가 임시 저장되었습니다.`);
        await loadAllDataFromDB();
      }
    } else {
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
      if (error) alert("최종 평가 저장 실패: " + error.message);
      else {
        alert(`${year}년도 최종 인사평가 원장(${records.length}명)이 Supabase에 안전하게 보관되었습니다.`);
        await loadAllDataFromDB();
      }
    }
  };

  const handleExportEvalExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"></head>
      <body>
        <table border="1">
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th>사번</th><th>성명</th><th>부서</th><th>직위</th>
            ${!isDeptLeader ? '<th>부서장 점수</th><th>부서장 등급</th><th>부서장 의견</th>' : ''}
            <th>역량</th><th>성과</th><th>자기계발</th><th>부하육성</th><th>가감점</th><th>가감사유</th>
            <th>환산점수</th><th>등급</th>${!isDeptLeader ? '<th>승진포인트</th>' : ''}<th>특이사항</th>
          </tr>
    `;

    filteredEmps.forEach(e => {
      const ev = currentYearEvals[e.emp_no] || {};
      const deptEv = currentDeptEvals[e.emp_no] || {};
      const fScore = finalScore(e.position, ev);
      const grade = ev.grade || gradeFromScore(fScore);
      const pts = pointsFor(grade);

      const dScore = finalScore(e.position, deptEv);
      const dGrade = deptEv.grade || gradeFromScore(dScore);

      excelContent += `
        <tr>
          <td style="mso-number-format:'\\@';">${e.emp_no}</td>
          <td>${e.name}</td>
          <td>${e.dept}</td>
          <td>${e.position}</td>
          ${!isDeptLeader ? `<td>${dScore > 0 ? dScore.toFixed(1) : ''}</td><td>${dGrade || ''}</td><td>${deptEv.note || ''}</td>` : ''}
          <td>${ev.competency || ''}</td>
          <td>${ev.performance || ''}</td>
          <td>${ev.selfDev || ''}</td>
          <td>${ev.mentoring || ''}</td>
          <td>${ev.adjust || ''}</td>
          <td>${ev.adjustReason || ''}</td>
          <td style="font-weight: bold;">${fScore > 0 ? fScore.toFixed(1) : '0.0'}</td>
          <td style="font-weight: bold;">${grade}</td>
          ${!isDeptLeader ? `<td>${pts > 0 ? pts : ''}</td>` : ''}
          <td>${ev.note || ''}</td>
        </tr>
      `;
    });

    excelContent += `</table></body></html>`;
    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `대성스틸_${year}년_${isDeptLeader ? `${currentUser?.dept}_1차평가` : '최종인사평가'}.xls`;
    link.click();
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-[1880px] w-full mx-auto p-4 space-y-4 print:p-0 print:m-0 print:max-w-none">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body { background: white !important; font-size: 10px !important; }
          header, .no-print { display: none !important; }
        }
      `}</style>

      {/* 헤더 */}
      <header className="bg-[#0b192c] text-white rounded-2xl p-4 shadow-xl flex flex-wrap justify-between items-center gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <i className="fa-solid fa-layer-group text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              대성스틸 인사평가 및 승진심사 관리시스템
              <span className={`px-2.5 py-0.5 text-[10.5px] font-bold rounded-full ${
                isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                isDeptLeader ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}>
                {isAdmin ? '관리자 (LV.0)' : isDeptLeader ? `${currentUser.dept}장 (LV.2)` : '최종평가 (LV.1)'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDeptLeader ? `소속 [${currentUser.dept}] 1차 직무/역량 평가 수행` : '10개년 평가 원본 보존 · 사원 스냅샷 마스터 · 과거 3개년 승진 포인트 연동'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* ★ '평가 결과 입력' 탭 또는 '승진심사 매트릭스' 탭에서 연도 전환 컨트롤러 표시 */}
          {(tab === "input" || tab === "promo") && (
            <div className="flex items-center bg-[#1e293b] rounded-xl p-1 border border-slate-700/80 shadow-inner">
              <button
                onClick={() => handleYearChange(year - 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="이전 연도"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <span className="px-3 py-1 font-bold text-xs tracking-wider text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
                <i className="fa-regular fa-calendar-check" />
                {tab === "promo" ? `${year}년 승진심사` : `${year}년 평가`}
              </span>
              <button
                onClick={() => handleYearChange(year + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title="다음 연도"
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
              <i className="fa-solid fa-pen-to-square text-[11px]" />
              {isDeptLeader ? '1차 부서평가 입력' : '평가 결과 입력'}
            </button>

            {!isDeptLeader && (
              <button
                onClick={() => setTab("promo")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === 'promo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <i className="fa-solid fa-award text-[11px]" /> 승진심사 매트릭스(3개년)
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setTab("snapshot_master")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${tab === 'snapshot_master' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-white'}`}
              >
                <i className="fa-solid fa-table-list text-[11px]" /> 연도별 사원마스터(12.31)
              </button>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsConfigOpen(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border ${sbConnected ? "bg-slate-800 text-emerald-400 border-emerald-500/40" : "bg-amber-600 text-white border-transparent"}`}
            >
              <i className="fa-solid fa-database text-[11px]" /> {sbConnected ? "DB 연결됨" : "DB 설정"}
            </button>
          )}

          <div className="flex items-center pl-2 border-l border-slate-700 gap-2">
            <span className="text-xs text-slate-300 font-semibold">{currentUser.name} 님</span>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition text-xs" title="로그아웃">
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600 mb-3" />
          <p className="text-sm font-bold text-slate-700">Supabase DB에서 데이터를 동기화하는 중입니다...</p>
        </div>
      ) : (
        <>
          {tab === "input" && (
            <div className="space-y-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-3 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <i className="fa-solid fa-users text-[11px]" /> 부서 필터
                  </span>

                  {isDeptLeader ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 text-xs font-black rounded-xl bg-purple-100 text-purple-900 border border-purple-200">
                        {currentUser.dept} 전용 ({filteredEmps.length}명)
                      </span>
                      {isCurrentDeptSubmitted && (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <i className="fa-solid fa-check-circle text-blue-600" /> 제출완료 ({currentDeptSubmission?.submittedAt?.slice(0, 10)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setDept("전체")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${dept === '전체' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        전체 부서 ({currentYearEmployees.length})
                      </button>
                      {DEPARTMENTS.map(d => {
                        const count = currentYearEmployees.filter(e => e.dept === d).length;
                        const p = deptProgressStats[d];
                        return (
                          <button
                            key={d} onClick={() => setDept(d)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${dept === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            <span>{d} ({count})</span>
                            {p && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                p.isSubmitted ? 'bg-blue-600 text-white' :
                                p.done === p.total && p.total > 0 ? 'bg-emerald-600 text-white' :
                                'bg-slate-300 text-slate-700'
                              }`}>
                                {p.isSubmitted ? '제출됨' : `${p.done}/${p.total}`}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {isAdmin && dept !== "전체" && submissionStore[year]?.[dept]?.isSubmitted && (
                        <button
                          onClick={() => handleUnlockDeptSubmission(dept)}
                          className="ml-2 px-2.5 py-1 text-[11px] font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                          title="부서장의 1차 평가 점수 수정을 다시 허용합니다"
                        >
                          <i className="fa-solid fa-lock-open text-[10px]" /> [{dept}] 제출 취소/수정 허용
                        </button>
                      )}
                    </>
                  )}

                  {!isDeptLeader && (
                    <label className="ml-3 flex items-center gap-1.5 text-xs text-slate-500 font-semibold cursor-pointer">
                      <input type="checkbox" checked={includeRetired} onChange={e => setIncludeRetired(e.target.checked)} className="rounded text-blue-600" />
                      퇴사자 포함
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text" placeholder="사번, 성명 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl w-36 bg-slate-50 focus:bg-white"
                  />
                  <button onClick={() => setIsWeightGuideOpen(true)} className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 border">
                    가중치표
                  </button>
                  <button onClick={handleExportEvalExcel} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <i className="fa-solid fa-file-excel mr-1" /> 엑셀 다운로드
                  </button>
                  {!isDeptLeader && (
                    <button onClick={() => window.print()} className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-800 border">
                      <i className="fa-solid fa-print mr-1" /> 출력
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={handleToggleLock}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border ${isCurrentYearLocked ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}
                    >
                      <i className={`fa-solid ${isCurrentYearLocked ? 'fa-lock mr-1 text-rose-600' : 'fa-lock-open mr-1'} text-[11px]`} />
                      {isCurrentYearLocked ? `${year}년 잠김` : `${year}년 잠금`}
                    </button>
                  )}

                  <button
                    onClick={handleSaveAllEvals}
                    disabled={isCurrentYearLocked || (isDeptLeader && isCurrentDeptSubmitted)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl text-white ${
                      isCurrentYearLocked || (isDeptLeader && isCurrentDeptSubmitted)
                        ? 'bg-slate-400 cursor-not-allowed'
                        : isDeptLeader ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    <i className="fa-solid fa-cloud-arrow-up mr-1" />
                    {isDeptLeader ? '1차 평가 임시저장' : '최종 평가 저장'}
                  </button>

                  {isDeptLeader && (
                    <button
                      onClick={handleSubmitDeptEval}
                      disabled={isCurrentYearLocked || isCurrentDeptSubmitted}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 ${
                        isCurrentYearLocked || isCurrentDeptSubmitted
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'
                      }`}
                    >
                      <i className="fa-solid fa-paper-plane text-[11px]" />
                      {isCurrentDeptSubmitted ? '제출 완료됨' : '1차 평가 최종 제출'}
                    </button>
                  )}
                </div>
              </div>

              <div className="no-print">
                <DashboardCards year={year} dept={dept} totalCount={totalCount} gradedTotal={gradedTotal} counts={counts} getPct={getPct} />
              </div>

              <EvalInputTab
                year={year} dept={isDeptLeader ? (currentUser.dept || '') : dept}
                userRole={currentUser.role}
                employees={filteredEmps}
                evaluations={currentYearEvals}
                deptEvaluations={currentDeptEvals}
                isLocked={isCurrentYearLocked}
                isDeptSubmitted={isCurrentDeptSubmitted}
                onCellChange={handleEvalCellChange}
              />
            </div>
          )}

          {/* ★ 승진심사 매트릭스에 onYearChange 연결 */}
          {tab === "promo" && !isDeptLeader && (
            <PromoMatrixTab
              year={year}
              onYearChange={handleYearChange}
              employees={filteredEmps}
              evalStore={evalStore}
            />
          )}

          {tab === "snapshot_master" && isAdmin && (
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
        onConfigSaved={() => { setSbConnected(true); loadAllDataFromDB(); }}
      />
    </div>
  );
}
