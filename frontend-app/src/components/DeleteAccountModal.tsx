import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/store';
import { api } from '../lib/api';

export default function DeleteAccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { logout } = useAppStore();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    setError('');
    try {
      await api.delete('/user/delete');
      logout();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-rose-500/20 p-5 md:p-6 rounded-t-2xl md:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            style={{ minWidth: '32px', minHeight: '32px' }}>
            <X className="w-5 h-5" />
          </button>

          {/* Warning Icon */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-400">Delete Account</h3>
              <p className="text-xs text-slate-500">This action is permanent</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-500/[0.06] border border-rose-500/[0.15] mb-5">
            <p className="text-sm text-slate-300 leading-relaxed">
              This will <span className="text-rose-400 font-semibold">permanently delete</span> your account and all associated data including:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li>All tasks and projects</li>
              <li>All orders and notes</li>
              <li>All habits and streaks</li>
              <li>Your profile and preferences</li>
            </ul>
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium text-slate-500 mb-2 block">
              Type <span className="text-rose-400 font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              placeholder="Type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input-base text-sm font-mono tracking-widest"
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 mb-3 p-2 rounded-lg bg-rose-500/10">{error}</p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                canDelete
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              style={{ minHeight: '44px' }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" /> Delete Forever
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
