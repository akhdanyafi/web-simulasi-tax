export const TOKEN_KEY = 'admin_token';
export const USER_KEY = 'admin_user';
const RUNTIME_API_CONFIG_PATH = '/runtime-api-config.json';

type ApiOptions = RequestInit & {
  auth?: boolean;
};

type RuntimeApiConfig = {
  apiBaseUrl?: string | null;
  apiPort?: number | null;
  updatedAt?: string | null;
};

function isAbsoluteUrl(path: string) {
  return /^https?:\/\//i.test(path);
}

async function getRuntimeApiBaseUrl() {
  try {
    const response = await fetch(`${RUNTIME_API_CONFIG_PATH}?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const config = await response.json() as RuntimeApiConfig;
    if (typeof config.apiBaseUrl !== 'string' || !config.apiBaseUrl.trim()) {
      return null;
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function buildApiUrl(path: string, apiBaseUrl: string | null) {
  if (isAbsoluteUrl(path)) return path;
  if (!apiBaseUrl) {
    if (path.startsWith('/api/')) {
      throw new Error('Backend belum terdeteksi. Jalankan npm run server lalu coba lagi.');
    }
    return path;
  }

  return `${apiBaseUrl}/${path.replace(/^\//, '')}`;
}

async function fetchApiResponse(url: string, fetchOptions: RequestInit) {
  try {
    return await fetch(url, fetchOptions);
  } catch {
    throw new Error('Backend tidak dapat dihubungi. Pastikan npm run server sedang berjalan.');
  }
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, ...fetchOptions } = options;
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const requestOptions = {
    ...fetchOptions,
    headers,
  };

  const initialApiBaseUrl = await getRuntimeApiBaseUrl();
  const initialRequestUrl = buildApiUrl(path, initialApiBaseUrl);
  let response = await fetchApiResponse(initialRequestUrl, requestOptions);

  if (!response.ok && isAbsoluteUrl(initialRequestUrl)) {
    const refreshedApiBaseUrl = await getRuntimeApiBaseUrl();
    const refreshedRequestUrl = buildApiUrl(path, refreshedApiBaseUrl);
    if (refreshedRequestUrl !== initialRequestUrl) {
      response = await fetchApiResponse(refreshedRequestUrl, requestOptions);
    }
  }

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Request gagal diproses.');
  }

  return payload as T;
}
