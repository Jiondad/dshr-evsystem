import React, { useState, useEffect } from 'react';
import { getGasUrl, setGasUrl } from '../lib/supabase';

interface ModalsProps {
  isWeightGuideOpen: boolean;
  isConfigOpen: boolean;
  onCloseWeightGuide: () => void;
  onCloseConfig: () => void;
  onConfigSaved: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  isWeightGuideOpen,
  isConfigOpen,
  onCloseWeightGuide,
  onCloseConfig,
  onConfigSaved,
}) => {
  const [gasUrlInput, setGasUrlInput] = useState('');

  useEffect(() => {
    if (isConfigOpen) {
      setGasUrlInput(getGasUrl() || '');
    }
  }, [isConfigOpen]);

  const handleSaveConfig = () => {
    const trimmed = gasUrlInput.trim();
    if (!trimmed.startsWith('https://script.google.com/')) {
      alert('올바른 Google Apps Script 웹 앱 URL 형식(`https://script.google.com/...`)이 아닙니다.');
      return;
    }
    setGasUrl(trimmed);
    alert('구글 스프레드시트(Apps Script) 연결 주소가 안전하게 저장되었습니다.');
    onConfigSaved();
    onCloseConfig();
  };

  return (
    <>
      {/* 가중치 안내 모달 */}
      {isWeightGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-blue-600" /> 직급별 평가 항목 가중치 안내
              </h3>
              <button
                onClick={onCloseWeightGuide}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-700">📌 직무별 환산 방식</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li><strong>사원~과장:</strong> 직무역량 + 근무성적 + 자기계발</li>
                <li><strong>차장~실장 (리더십 직급):</strong> 직무역량 + 근무성적 + 자기계발 + 부하육성(리더십)</li>
              </ul>
              <p className="pt-2 text-[11px] text-slate-400">
                ※ 모든 평가 점수는 입력된 가중치 비율에 맞춰 자동으로 최종 환산점수 및 등급(S~D)으로 산출됩니다.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={onCloseWeightGuide}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DB(Google Sheets) 설정 모달 */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 text-emerald-700">
                <i className="fa-solid fa-table" /> Google Sheets 백엔드 설정
              </h3>
              <button
                onClick={onCloseConfig}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                구글 스프레드시트와 연동된 <strong>Apps Script 웹 앱 URL</strong>을 입력하세요. 이 주소를 통해 1년 내내 정지 없이 안전하게 인사평가 데이터를 주고받습니다.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Apps Script 웹 앱 URL (`/exec`로 끝나는 주소)
                </label>
                <textarea
                  rows={3}
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={onCloseConfig}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                닫기
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-check text-[11px]" /> 설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
