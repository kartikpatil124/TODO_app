const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:5005';
const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:5173';

const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const firstDefined = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0);

const isProduction = process.env.NODE_ENV === 'production';

export const BACKEND_URL = stripTrailingSlash(firstDefined(
  process.env.BACKEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  isProduction ? undefined : DEFAULT_LOCAL_BACKEND_URL
) || (isProduction ? '' : DEFAULT_LOCAL_BACKEND_URL));

export const FRONTEND_URL = stripTrailingSlash(firstDefined(
  process.env.FRONTEND_URL,
  isProduction ? undefined : DEFAULT_LOCAL_FRONTEND_URL
) || (isProduction ? '' : DEFAULT_LOCAL_FRONTEND_URL));

if (isProduction && (!BACKEND_URL || !FRONTEND_URL)) {
  console.warn('[appUrls] WARNING: BACKEND_URL and FRONTEND_URL must be configured via environment variables in production.');
}

export const GOOGLE_AUTH_CALLBACK_URL = stripTrailingSlash(
  firstDefined(process.env.GOOGLE_CALLBACK_URL) || `${BACKEND_URL}/api/auth/google/callback`
);

export const GOOGLE_DRIVE_CALLBACK_URL = stripTrailingSlash(
  firstDefined(process.env.GOOGLE_REDIRECT_URI) || `${BACKEND_URL}/api/drive/callback`
);
