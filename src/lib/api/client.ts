'use client';

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}

function joinPath(basePath: string, path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const root = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${root}${normalizedBase}${normalizedPath}`;
}

export function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return '';

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

async function parseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export function createApiClient(basePath = '') {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();
    const response = await fetch(joinPath(basePath, path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    const payload = await parseBody(response);
    if (!response.ok) {
      const message =
        typeof payload === 'string'
          ? payload
          : typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message?: unknown }).message)
          : response.statusText;
      throw new ApiError(message || 'Request failed', response.status, payload);
    }

    return payload as T;
  }

  return {
    request,
    get: <T>(path: string, query?: Record<string, QueryValue>) => request<T>(`${path}${buildQuery(query)}`),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  };
}