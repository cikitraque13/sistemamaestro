import axios from 'axios';

const DEFAULT_BACKEND_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://sistemamaestro.com';

const rawBackendUrl = (
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  DEFAULT_BACKEND_URL
)
  .trim()
  .replace(/\/$/, '');

export const BACKEND_URL = rawBackendUrl;

export const API_BASE = rawBackendUrl.endsWith('/api')
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

export async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const url = normalizedPath.startsWith('/api/')
    ? `${BACKEND_URL}${normalizedPath}`
    : `${API_BASE}${normalizedPath}`;

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
}