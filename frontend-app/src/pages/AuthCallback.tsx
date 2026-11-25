import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppStore, UserProfile } from '../store/store';
import { api } from '../lib/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const setUser = useAppStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login?error=no_code', { replace: true });
      return;
    }

    api.post<{ token: string; user: UserProfile }>('/auth/exchange-code', { code })
      .then(async (res) => {
        login(res.user, res.token);
        try {
          const freshUser = await api.get<UserProfile>('/user/me');
          setUser(freshUser);
        } catch {
          // Keep existing res.user if /user/me fails
        }
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('Code exchange failed:', err);
        setError(err instanceof Error ? err.message : 'Authentication exchange failed');
        setTimeout(() => {
          navigate('/login?error=auth_failed', { replace: true });
        }, 1500);
      });
  }, [searchParams, navigate, login, setUser]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="card max-w-sm w-full p-8 text-center flex flex-col items-center gap-4">
        {error ? (
          <p className="text-rose-400 text-sm font-medium">{error}</p>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <h2 className="text-lg font-semibold">Completing Sign-In...</h2>
            <p className="text-xs text-slate-400">Verifying your Google session securely.</p>
          </>
        )}
      </div>
    </div>
  );
}
