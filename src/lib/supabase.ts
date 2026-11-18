// Google Apps Script 웹앱 연동 어댑터 (기존 Supabase 호출 구조 100% 호환)

// 아래에 배포하신 Google Apps Script 웹앱 URL을 입력하세요.
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyZlIEYusbepnzJmmtgGz_mwE0zUi_UwonkA94wgY70L410whnZmg343edVjohk5coy9w/exec";

export function getGasUrl(): string {
  const saved = localStorage.getItem("ds_gas_webapp_url");
  if (saved && saved.startsWith("https://script.google.com/")) return saved;
  if (DEFAULT_GAS_URL.startsWith("https://script.google.com/")) return DEFAULT_GAS_URL;
  return "";
}

export function setGasUrl(url: string) {
  localStorage.setItem("ds_gas_webapp_url", url.trim());
}

// 전체 5개 테이블 한 번에 조회 (속도 최적화)
export async function fetchAllFromSheets() {
  const url = getGasUrl();
  if (!url) return null;

  const res = await fetch(url, { method: "GET" });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "시트 데이터 조회 실패");
  return json.data;
}

// 기존 Supabase 체이닝 문법(.from().upsert(), .from().delete().match() 등) 호환 객체
export function getSupabase() {
  const url = getGasUrl();
  if (!url) return null;

  const postToGas = async (body: any) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // CORS preflight 우회
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!json.ok) return { data: null, error: { message: json.error } };
      return { data: json.data || true, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || "네트워크 오류" } };
    }
  };

  return {
    from(table: string) {
      return {
        upsert(records: any, _opts?: any) {
          return postToGas({ action: "upsert", table, records });
        },
        delete() {
          return {
            match(criteria: Record<string, any>) {
              return postToGas({ action: "delete", table, match: criteria });
            },
            eq(col: string, val: any) {
              return {
                in(inCol: string, values: any[]) {
                  return postToGas({
                    action: "delete",
                    table,
                    match: { [col]: val },
                    inFilter: { col: inCol, values }
                  });
                }
              };
            }
          };
        }
      };
    }
  };
}
