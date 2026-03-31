const DEFAULT_BACKEND_URL = 'https://todo-app-wude.onrender.com';
const DEFAULT_FRONTEND_URL = 'https://todo-app-ten-green-65.vercel.app';
const DEFAULT_LOCAL_BACKEND_URL = 'http://localhost:5005';
const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:5173';

const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const firstDefined = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0);

const isProduction = process.env.NODE_ENV === 'production';

export const BACKEND_URL = stripTrailingSlash(firstDefined(
  process.env.BACKEND_URL,
  process.env.RENDER_EXTERNAL_URL,
  isProduction ? DEFAULT_BACKEND_URL : DEFAULT_LOCAL_BACKEND_URL
));

export const FRONTEND_URL = stripTrailingSlash(firstDefined(
  process.env.FRONTEND_URL,
  isProduction ? DEFAULT_FRONTEND_URL : DEFAULT_LOCAL_FRONTEND_URL
));

export const GOOGLE_AUTH_CALLBACK_URL = stripTrailingSlash(
  firstDefined(process.env.GOOGLE_CALLBACK_URL) || `${BACKEND_URL}/auth/google/callback`
);

export const GOOGLE_DRIVE_CALLBACK_URL = stripTrailingSlash(
  firstDefined(process.env.GOOGLE_REDIRECT_URI) || `${BACKEND_URL}/api/drive/callback`
);
