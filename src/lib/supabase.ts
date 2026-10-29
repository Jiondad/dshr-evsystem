import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = localStorage.getItem("ds_sb_url");
  const key = localStorage.getItem("ds_sb_key");
  if (url && key) {
    try {
      client = createClient(url, key);
    } catch (e) {
      console.error(e);
    }
  }
  return client;
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem("ds_sb_url", url);
  localStorage.setItem("ds_sb_key", key);
  client = createClient(url, key);
}