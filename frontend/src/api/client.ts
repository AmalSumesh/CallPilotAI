const TOKEN_KEY = 'callpilot_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const ML_BASE_URL = (import.meta.env.VITE_ML_SERVICE_URL || (import.meta.env.DEV ? '/ml-api' : 'http://127.0.0.1:8000')).replace(/\/$/, '');
export const ML_WS_URL = import.meta.env.VITE_ML_WS_URL || 'ws://127.0.0.1:8000/ws/live';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders = new Headers(headers);

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set default JSON Content-Type if body is not FormData
  if (rest.body && !(rest.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && !skipAuth) {
    // Session expired or invalid
    removeStoredToken();
    window.dispatchEvent(new CustomEvent('callpilot:unauthorized'));
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (isJson && data && typeof data === 'object' && 'message' in data)
      ? (data as { message: string }).message
      : (typeof data === 'string' && data ? data : `Request failed with status ${response.status}`);
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
