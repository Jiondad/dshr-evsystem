import React, { useState } from "react";
import { saveSupabaseConfig } from "../lib/supabase";

interface ModalsProps {
  isWeightGuideOpen: boolean;
  isConfigOpen: boolean;
  onCloseWeightGuide: () => void;
  onCloseConfig: () => void;
  onConfigSaved: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  isWeightGuideOpen, isConfigOpen, onCloseWeightGuide, onCloseConfig, onConfigSaved
}) => {
  const [url, setUrl] = useState(() => localStorage.getItem("ds_sb_url") || "");
  const [key, setKey] = useState(() => localStorage.getItem("ds_sb_key") || "");

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), key.trim());
    alert("Supabase 설정이 저장되었습니다.");
    onConfigSaved();
    onCloseConfig();
  };

  return (
    <>
      {isWeightGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <i className="fa-solid fa-scale-balanced text-blue-600" />
                직급별 평가항목 가중치 산출기준표
              </h3>
              <button onClick={onCloseWeightGuide} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="space-y-4 text-xs text-slate-600">
              <table className="w-full border-collapse text-center">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5 border">구분</th>
                    <th className="p-2.5 border">역량</th>
                    <th className="p-2.5 border">성과</th>
                    <th className="p-2.5 border">자기계발</th>
                    <th className="p-2.5 border">부하육성</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border font-bold bg-slate-50">임원진</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                    <td className="p-2.5 border font-bold text-blue-600">80%</td>
                    <td className="p-2.5 border">10%</td>
                    <td className="p-2.5 border">10%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border font-bold bg-slate-50">실장 · 부장 · 차장</td>
                    <td className="p-2.5 border font-bold">30%</td>
                    <td className="p-2.5 border font-bold text-blue-600">60%</td>
                    <td className="p-2.5 border">10%</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border font-bold bg-slate-50">과장 · 대리</td>
                    <td className="p-2.5 border font-bold text-blue-600">60%</td>
                    <td className="p-2.5 border font-bold">40%</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border font-bold bg-slate-50">주임 · 사원</td>
                    <td className="p-2.5 border font-bold text-blue-600">70%</td>
                    <td className="p-2.5 border font-bold">30%</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                    <td className="p-2.5 border text-slate-300">-</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-slate-50 p-3 rounded-xl border text-[11px] space-y-1 text-slate-500">
                <p>• 최종 환산점수 = Σ(원점수 × 직급별 가중치) ± 가감점 (소수점 첫째 자리 반올림)</p>
                <p>• 그룹 평가 기준율: S(5%), A(15%), B(65%), C(10%), D(5%)</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
              <button onClick={onCloseWeightGuide} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">확인 닫기</button>
            </div>
          </div>
        </div>
      )}

      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-black text-slate-800 text-base mb-3 pb-2 border-b flex items-center gap-2">
              <i className="fa-solid fa-cloud text-blue-600" />
              Supabase 클라우드 설정
            </h3>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Project URL</label>
                <input
                  type="text" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://xxxxxxxx.supabase.co"
                  className="w-full border rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Anon / Public API Key</label>
                <textarea
                  value={key} onChange={e => setKey(e.target.value)} rows={3}
                  placeholder="eyJh..."
                  className="w-full border rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <button onClick={onCloseConfig} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">닫기</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md">설정 저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};