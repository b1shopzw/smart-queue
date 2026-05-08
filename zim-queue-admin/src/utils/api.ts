const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}
