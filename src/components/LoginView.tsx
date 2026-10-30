import React, { useState } from 'react';
import { AuthUser } from '../types/hr';
import { getSupabase } from '../lib/supabase';

interface Props {
  onLogin: (user: AuthUser) => void;
}

export const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 비밀번호 변경 모달 상태 (LV.2 최초 로그인 시)
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    const pw = password.trim();

    // 1. 관리자 (LV.0)
    if (id === '010011' && pw === '010011ad') {
      onLogin({ id: '010011', name: '총괄관리자', role: 'LV0_ADMIN' });
      return;
    }

    // 2. 최종평가자 (LV.1)
    if (id === 'dssteel' && pw === 'dssteelev') {
      onLogin({ id: 'dssteel', name: '최종평가/대표이사', role: 'LV1_EVALUATOR' });
      return;
    }

    // 3. 부서장 평가자 (LV.2) - Supabase 조회
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from('user_accounts')
        .select('*')
        .eq('user_id', id)
        .single();

      if (!error && data) {
        if (data.password === pw) {
          const authUser: AuthUser = {
            id: data.user_id,
            name: data.user_name,
            dept: data.dept,
            role: 'LV2_DEPT_LEADER',
            isFirstLogin: data.is_first_login
          };

          // 최초 로그인 상태라면 비밀번호 변경 모달 오픈
          if (data.is_first_login) {
            setPendingUser(authUser);
            setShowPasswordChange(true);
            return;
          }

          onLogin(authUser);
          return;
        }
      }
    }

    // 로컬 기본값 지원 (DB 연결 전이라도 테스트 가능)
    const fallbackDeptUsers: Record<string, { name: string; dept: string }> = {
      '010010': { name: '관리팀장', dept: '관리팀' },
      '220008': { name: '영업팀장', dept: '영업팀' },
      '140004': { name: '생산팀장', dept: '생산팀' }
    };

    if (fallbackDeptUsers[id] && pw === '1234') {
      const authUser: AuthUser = {
        id,
        name: fallbackDeptUsers[id].name,
        dept: fallbackDeptUsers[id].dept,
        role: 'LV2_DEPT_LEADER',
        isFirstLogin: true
      };
      setPendingUser(authUser);
      setShowPasswordChange(true);
      return;
    }

    setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim() === '') {
      setChangeError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword === '1234') {
      setChangeError('초기 비밀번호(1234)와 동일한 번호는 사용할 수 없습니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (!pendingUser) return;

    // Supabase에 변경된 비밀번호 업데이트
    const sb = getSupabase();
    if (sb) {
      await sb
        .from('user_accounts')
        .update({
          password: newPassword.trim(),
          is_first_login: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', pendingUser.id);
    }

    alert('비밀번호가 성공적으로 변경되었습니다. 평가 화면으로 이동합니다.');
    onLogin({ ...pendingUser, isFirstLogin: false });
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
                placeholder="사번 또는 계정 ID"
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
                placeholder="비밀번호"
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

      {/* 부서장 최초 로그인 비밀번호 변경 강제 모달 */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
                <i className="fa-solid fa-key" />
              </div>
              <h2 className="text-base font-extrabold text-slate-800">새 비밀번호 설정 안내</h2>
              <p className="text-xs text-slate-500">
                <strong className="text-blue-600">{pendingUser?.name} ({pendingUser?.dept})</strong> 님, 보안을 위해 최초 비밀번호(1234)를 반드시 변경하셔야 평가 진행이 가능합니다.
              </p>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">신규 비밀번호</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setChangeError(''); }}
                  placeholder="새 비밀번호 입력"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setChangeError(''); }}
                  placeholder="새 비밀번호 재입력"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {changeError && (
                <p className="text-[11px] text-rose-600 font-semibold text-center">{changeError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition"
              >
                비밀번호 저장 및 평가 시작
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
