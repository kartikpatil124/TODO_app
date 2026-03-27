import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Shield, HardDrive, Cloud, CloudOff, RefreshCw,
  Download, Upload, LogOut, Trash2, Moon, Bell, Lock, Check, X,
  ChevronRight, Loader2, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store/store';
import { api } from '../lib/api';
import DeleteAccountModal from '../components/DeleteAccountModal';

export default function ProfilePage() {
  const { user, logout, driveStatus, setDriveStatus, setUser } = useAppStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Fetch drive status on mount
  useEffect(() => {
    api.get<{ configured: boolean; connected: boolean; lastBackup: string | null }>('/drive/status')
      .then(setDriveStatus)
      .catch(() => {});
  }, [setDriveStatus]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleNameSave = async () => {
    if (!nameInput.trim()) return;
    try {
      const updated = await api.put<{ name: string }>('/user/update', { name: nameInput.trim() });
      if (user) setUser({ ...user, name: (updated as any).name || nameInput.trim() });
      setEditingName(false);
      showToast('Name updated', 'success');
    } catch {
      showToast('Failed to update name', 'error');
    }
  };

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('');
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    try {
      await api.put('/user/password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess('Password updated successfully');
      setCurrentPw(''); setNewPw('');
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  const handleConnectDrive = async () => {
    try {
      const data = await api.get<{ url: string }>('/drive/connect');
      window.location.href = data.url;
    } catch {
      showToast('Google Drive not configured on server', 'error');
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await api.post('/drive/disconnect');
      setDriveStatus({ ...driveStatus, connected: false });
      showToast('Google Drive disconnected', 'success');
    } catch {
      showToast('Failed to disconnect', 'error');
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post<{ msg: string; lastBackup: string }>('/drive/backup');
      setDriveStatus({ ...driveStatus, lastBackup: res.lastBackup });
      showToast(res.msg, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Backup failed', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    try {
      const res = await api.post<{ msg: string }>('/drive/restore');
      showToast(res.msg, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Restore failed', 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handlePreferenceToggle = async (key: 'darkMode' | 'notifications' | 'autoBackup') => {
    if (!user) return;
    const newPrefs = { ...user.preferences, [key]: !user.preferences[key] };
    setUser({ ...user, preferences: newPrefs });
    try {
      await api.put('/user/update', { preferences: newPrefs });
    } catch {
      // Revert on error
      setUser({ ...user, preferences: { ...newPrefs, [key]: !newPrefs[key] } });
    }
  };

  // Fallback user for demo when no backend
  const displayUser = user || {
    name: 'User', email: 'user@example.com', avatar: '',
    xp: 0, level: 1, streak: 0, driveConnected: false,
    preferences: { darkMode: true, notifications: true, autoBackup: false },
  };

  const initials = displayUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page-padding max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">Profile & Settings</h1>
      </motion.div>

      <div className="space-y-4 md:space-y-6">
        {/* ──── 1. Profile Header ──── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold shrink-0 shadow-lg shadow-indigo-500/25">
              {displayUser.avatar ? (
                <img src={displayUser.avatar} className="w-full h-full rounded-2xl object-cover" alt="Avatar" />
              ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    className="input-base text-base font-semibold py-1.5 flex-1" autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()} />
                  <button onClick={handleNameSave} className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" style={{ minWidth: '36px', minHeight: '36px' }}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-2 rounded-lg bg-white/[0.06] text-slate-500 hover:text-white" style={{ minWidth: '36px', minHeight: '36px' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold text-white truncate">{displayUser.name}</h2>
                  <button onClick={() => { setNameInput(displayUser.name); setEditingName(true); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition shrink-0">Edit</button>
                </div>
              )}
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /> {displayUser.email}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 badge-indigo">Level {displayUser.level}</span>
                <span className="flex items-center gap-1 badge-amber">{displayUser.xp} XP</span>
                <span className="flex items-center gap-1 badge-rose">🔥 {displayUser.streak}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ──── 2. Account Section ──── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Account</h3>
          </div>

          {/* Change Password */}
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] active:bg-white/[0.04] transition-colors"
            style={{ minHeight: '48px' }}>
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-200">Change Password</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>

          {showPasswordForm && (
            <div className="ml-7 mt-2 mb-3 space-y-3 animate-slide-up">
              <input type="password" placeholder="Current password" value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} className="input-base text-sm" />
              <input type="password" placeholder="New password (min 6 chars)" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} className="input-base text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordChange()} />
              {pwError && <p className="text-xs text-rose-400">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-emerald-400">{pwSuccess}</p>}
              <button onClick={handlePasswordChange} className="btn-primary text-sm w-full">Update Password</button>
            </div>
          )}

          {/* Connected Accounts */}
          <div className="border-t border-white/[0.06] mt-3 pt-3">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2 px-3">Connected Accounts</p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]" style={{ minHeight: '48px' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Google</p>
                  <p className="text-[10px] text-slate-600">Used for Drive backup</p>
                </div>
              </div>
              {driveStatus.connected ? (
                <span className="badge-emerald text-[10px]"><Check className="w-3 h-3" /> Connected</span>
              ) : (
                <span className="badge-slate text-[10px]">Not Connected</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ──── 3. Data & Backup ──── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Data & Backup</h3>
          </div>

          {/* Drive Status */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {driveStatus.connected ? (
                  <Cloud className="w-5 h-5 text-emerald-400" />
                ) : (
                  <CloudOff className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {driveStatus.connected ? 'Connected to Google Drive ✅' : 'Google Drive Not Connected'}
                  </p>
                  {driveStatus.lastBackup && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Last backup: {new Date(driveStatus.lastBackup).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!driveStatus.connected ? (
              <button onClick={handleConnectDrive} className="btn-primary text-sm w-full flex items-center justify-center gap-2">
                <Cloud className="w-4 h-4" /> Connect Google Drive
              </button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleBackup} disabled={backupLoading}
                    className="btn-secondary text-sm flex items-center justify-center gap-2">
                    {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Backup
                  </button>
                  <button onClick={handleRestore} disabled={restoreLoading}
                    className="btn-secondary text-sm flex items-center justify-center gap-2">
                    {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Restore
                  </button>
                </div>
                <button onClick={handleDisconnectDrive}
                  className="w-full text-xs text-slate-600 hover:text-slate-400 transition py-1">
                  Disconnect Drive
                </button>
              </div>
            )}
          </div>

          {!driveStatus.configured && (
            <p className="text-[11px] text-slate-600 italic px-1">
              ⓘ Google Drive is not configured on the server. Contact your admin to enable backups.
            </p>
          )}
        </motion.div>

        {/* ──── 4. Preferences ──── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Preferences</h3>
          </div>

          {[
            { key: 'darkMode' as const, label: 'Dark Mode', desc: 'Use dark color theme', icon: Moon, value: displayUser.preferences.darkMode },
            { key: 'notifications' as const, label: 'Notifications', desc: 'Enable push notifications', icon: Bell, value: displayUser.preferences.notifications },
            { key: 'autoBackup' as const, label: 'Auto Backup Daily', desc: 'Automatically backup to Drive every 24h', icon: Cloud, value: displayUser.preferences.autoBackup },
          ].map(pref => {
            const Icon = pref.icon;
            return (
              <div key={pref.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors" style={{ minHeight: '48px' }}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-200">{pref.label}</p>
                    <p className="text-[10px] text-slate-600">{pref.desc}</p>
                  </div>
                </div>
                <button onClick={() => handlePreferenceToggle(pref.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    pref.value ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    pref.value ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </motion.div>

        {/* ──── 5. Danger Zone ──── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card border-rose-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-rose-400">Danger Zone</h3>
          </div>

          <div className="space-y-3">
            <button onClick={logout}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] active:bg-white/[0.06] transition-colors"
              style={{ minHeight: '48px' }}>
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200">Logout</p>
                  <p className="text-[10px] text-slate-600">Clear session and return to login</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/[0.15] hover:bg-rose-500/[0.08] active:bg-rose-500/[0.08] transition-colors"
              style={{ minHeight: '48px' }}>
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-rose-400">Delete Account</p>
                  <p className="text-[10px] text-slate-600">Permanently delete all data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500/50" />
            </button>
          </div>
        </motion.div>
      </div>

      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </div>
  );
}
