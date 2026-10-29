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

    // 1. 현재 화면에 존재하는 사번 목록 수집
    const currentEmpNos = currentYearEmployees.map(e => e.emp_no.trim());

    // 2. DB에서 해당 연도에 등록되어 있던 기존 사번 목록 조회
    const { data: dbExisting, error: fetchError } = await sb
      .from("employee_snapshots")
      .select("emp_no")
      .eq("snapshot_year", year);

    if (fetchError) {
      alert("기존 데이터 확인 실패: " + fetchError.message);
      return;
    }

    // 3. 사번 수정/삭제로 인해 화면에서 사라진 옛 사번(Orphan) 추출 후 DB 삭제 처리
    if (dbExisting && dbExisting.length > 0) {
      const removedEmpNos = dbExisting
        .map((r: any) => r.emp_no)
        .filter((dbNo: string) => !currentEmpNos.includes(dbNo));

      if (removedEmpNos.length > 0) {
        await sb
          .from("employee_snapshots")
          .delete()
          .eq("snapshot_year", year)
          .in("emp_no", removedEmpNos);
      }
    }

    // 4. 최신 사원 명부 적재 (Upsert)
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

    const { error: upsertError } = await sb
      .from("employee_snapshots")
      .upsert(cleanData, { onConflict: "snapshot_year,emp_no" });

    if (upsertError) {
      alert("사원마스터 저장 실패: " + upsertError.message);
    } else {
      alert(`${year}년도 사원마스터(${cleanData.length}명)가 동기화되어 저장되었습니다.`);
      await loadAllDataFromDB();
    }
  };
