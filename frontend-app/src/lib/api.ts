// Ensure no trailing slash, and append /api if missing
let envApi = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';
if (envApi.endsWith('/')) envApi = envApi.slice(0, -1);
if (!envApi.endsWith('/api')) envApi = `${envApi}/api`;
export const API_BASE = envApi;
export const AUTH_BASE = API_BASE.replace(/\/api$/, '');
export const GOOGLE_AUTH_URL = `${AUTH_BASE}/api/auth/google`;

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

let slowRequestCount = 0;

function incrementSlow() {
  slowRequestCount++;
  setServerWaking(true);
}

function decrementSlow() {
  slowRequestCount = Math.max(0, slowRequestCount - 1);
  if (slowRequestCount === 0) {
    setServerWaking(false);
  }
}

// Event-based notification for slow server (Render waking up)
export const onServerWakingStateChange = (callback: (isWaking: boolean) => void): (() => void) => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ isWaking: boolean }>;
    callback(customEvent.detail.isWaking);
  };
  window.addEventListener('server-waking-change', handler);
  return () => window.removeEventListener('server-waking-change', handler);
};

function setServerWaking(isWaking: boolean) {
  window.dispatchEvent(new CustomEvent('server-waking-change', { detail: { isWaking } }));
}

async function request<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const timeoutMs = options.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let isMarkedSlow = false;
  const wakingTimer = setTimeout(() => {
    isMarkedSlow = true;
    incrementSlow();
  }, 3500);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    clearTimeout(wakingTimer);
    if (isMarkedSlow) {
      decrementSlow();
    }

    if (res.status === 401) {
      // Token expired or invalid — clear state and navigate without reload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = (data as { msg?: string; error?: string }).msg
        || (data as { msg?: string; error?: string }).error
        || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    clearTimeout(wakingTimer);
    if (isMarkedSlow) {
      decrementSlow();
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. The server may still be waking up. Please try again.');
    }
    throw err;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: FetchOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown, options?: FetchOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = unknown>(path: string, options?: FetchOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
