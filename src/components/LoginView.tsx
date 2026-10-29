import React, { useState } from 'react';
import { AuthUser } from '../types/hr';

interface Props {
  onLogin: (user: AuthUser) => void;
}

export const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    const pw = password.trim();

    // 1. 관리자: 아이디 010011 / 비밀번호 010011ad
    if (id === '010011' && pw === '010011ad') {
      onLogin({ id: '010011', name: '관리자', role: 'LV0_ADMIN' });
      return;
    }

    // 2. 평가자: 아이디 dssteel / 비밀번호 dssteelev
    if (id === 'dssteel' && pw === 'dssteelev') {
      onLogin({ id: 'dssteel', name: '평가위원', role: 'LV1_EVALUATOR' });
      return;
    }

    setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070f1e] via-[#0b192c] to-[#1e293b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/30 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40 text-2xl">
            <i className="fa-solid fa-layer-group" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">대성스틸 인사평가 관리시스템</h1>
          <p className="text-xs text-slate-500">통합 인사평가 및 승진심사 원장 보안 로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">아이디</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-3.5 top-3 text-slate-400 text-xs" />
              <input
                type="text"
                required
                value={userId}
                onChange={e => { setUserId(e.target.value); setErrorMsg(''); }}
                placeholder="아이디를 입력하세요"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">비밀번호</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3.5 top-3 text-slate-400 text-xs" />
              <input
                type="password"
                required
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation" /> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 transition duration-150 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-to-bracket" /> 로그인
          </button>
        </form>
      </div>
    </div>
  );
};
