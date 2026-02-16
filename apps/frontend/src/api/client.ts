const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const fetchApi = async <T>(path: string, params?: Record<string, string | number>): Promise<T> => {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error || `API error: ${response.status}`);
  }

  return response.json();
};
