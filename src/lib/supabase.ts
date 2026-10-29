import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 고정 기본 연결 정보 (어느 PC에서 접속하든 자동 연결)
const DEFAULT_SUPABASE_URL = "https://zcabxhwgorzhnxkdqcbz.supabase.co"; // 사용 중이신 Supabase Project URL
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjYWJ4aHdnb3J6aG54a2RxY2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMjYwMTgsImV4cCI6MjEwODgwMjAxOH0.tr4zdom-ThXqZu19GEhlUlDh93p43EXgKi1WekIwp4k"; // 사용 중이신 Anon Key

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // 1. 브라우저에 임의 설정된 값이 있으면 우선 사용
  const storedUrl = localStorage.getItem("ds_sb_url");
  const storedKey = localStorage.getItem("ds_sb_key");

  const url = storedUrl || DEFAULT_SUPABASE_URL;
  const key = storedKey || DEFAULT_SUPABASE_ANON_KEY;

  if (url && key && url.trim() !== "" && key.trim() !== "") {
    try {
      supabaseInstance = createClient(url.trim(), key.trim());
      return supabaseInstance;
    } catch (e) {
      console.error("Supabase client init error:", e);
      return null;
    }
  }

  return null;
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url && key) {
    localStorage.setItem("ds_sb_url", url.trim());
    localStorage.setItem("ds_sb_key", key.trim());
    supabaseInstance = createClient(url.trim(), key.trim());
  } else {
    localStorage.removeItem("ds_sb_url");
    localStorage.removeItem("ds_sb_key");
    supabaseInstance = null;
  }
}
