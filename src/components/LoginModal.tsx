import React, { useState } from 'react';
import { Teacher } from '../types';

interface LoginModalProps {
  teachers: Teacher[];
  currentTeacher: Teacher | null;
  onLogin: (teacher: Teacher) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  teachers,
  onLogin,
  onClose,
  canClose = false,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Masukkan alamat email guru yang terdaftar.');
      return;
    }

    const found = teachers.find((t) => t.email.toLowerCase() === cleanEmail);
    if (!found) {
      setErrorMsg(`Email "${cleanEmail}" tidak ditemukan dalam daftar guru aktif.`);
      return;
    }

    onLogin(found);
  };

  const handleQuickSelectTeacher = (teacher: Teacher) => {
    setEmailInput(teacher.email);
    setErrorMsg('');
    onLogin(teacher);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-scale-up my-8 transition-colors">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        )}

        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50 dark:ring-indigo-950/60 font-mono">
            <i className="fa-solid fa-user-lock"></i>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Autentikasi Akun Guru</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Silakan masuk dengan email terdaftar atau pilih nama Anda dari daftar guru.
          </p>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Alamat Email Guru <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTeacherPicker(!showTeacherPicker)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showTeacherPicker ? 'Sembunyikan Daftar' : 'Pilih dari Daftar Guru'}
              </button>
            </div>

            <div className="relative">
              <input
                type="email"
                required
                autoFocus
                placeholder="misal: fadli46046@gmail.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-850 transition-colors"
              />
              <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl p-2.5 mt-2 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0 text-rose-500"></i>
                <div>
                  <p>{errorMsg}</p>
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-normal mt-0.5">
                    Pastikan email sesuai atau hubungi Administrator jika belum memiliki akun.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Teacher Picker List */}
          {showTeacherPicker && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 bg-slate-50 dark:bg-slate-800/60 max-h-48 overflow-y-auto space-y-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 mb-1">
                Pilih akun Anda untuk login instan:
              </p>
              {teachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleQuickSelectTeacher(t)}
                  className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {t.email} • {t.role === 'admin' ? 'Admin' : t.homeroomClass ? `Wali Kelas ${t.homeroomClass}` : t.subject}
                    </p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    t.role === 'admin'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {t.role === 'admin' ? 'Admin' : 'Guru'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>Masuk ke Akun Saya</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-shield-halved text-emerald-500 text-xs"></i>
            <span>Sesi terisolasi & aman per akun guru.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
