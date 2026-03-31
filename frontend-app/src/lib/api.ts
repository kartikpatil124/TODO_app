// Ensure no trailing slash, and append /api if missing
let envApi = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api';
if (envApi.endsWith('/')) envApi = envApi.slice(0, -1);
if (!envApi.endsWith('/api')) envApi = `${envApi}/api`;
export const API_BASE = envApi;

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid — auto-logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { msg?: string }).msg || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
};
