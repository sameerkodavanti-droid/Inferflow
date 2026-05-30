/**
 * Centralized API fetch layer for InferFlow frontend.
 * Strictly configured to hit backend routes with JWT headers.
 */

import {
  ChatRequest, ChatResponse, UserRequest, UserResponse, IsAuthResponse,
  CreateAPIKeyRequest, CreateAPIKeyResponse, RevokeAPIKeyRequest, APIKey,
  DashboardOverviewResponse, CacheAnalyticsResponse, RedisMetricsResponse,
  GlobalAnalyticsResponse, ModelHealthResponse, ForgotPasswordRequest,
  ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse,
  ChangePasswordRequest, ChangePasswordResponse
} from './types';

const BASE_URL = 'http://127.0.0.1:8000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return { 'Content-Type': 'application/json' };
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {})
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API Error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }
  return response.json();
}

// ─── Auth / Users ───────────────────────────────────────────────────

export async function registerUser(data: UserRequest): Promise<UserResponse> {
  return fetchJSON<UserResponse>('/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: UserRequest): Promise<{ access_token: string; token_type: string }> {
  return fetchJSON<{ access_token: string; token_type: string }>('/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function checkAuth(): Promise<IsAuthResponse> {
  return fetchJSON<IsAuthResponse>('/users/is_auth');
}

// ─── Chat / Playground ──────────────────────────────────────────────

export async function sendChatMessage(
  prompt: string,
  model_type?: string | null,
  session_id?: number | null
): Promise<Response> {

  return fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      prompt,
      model_type,
      session_id
    }),
  });
}
export async function fetchSessions() {
  return fetchJSON<any[]>('/sessions');
}

export async function createSession() {
  return fetchJSON<any>('/sessions', {
    method: 'POST',
  });
}

export async function renameSession(sessionId: number, title: string) {
  return fetchJSON<any>(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function fetchSessionMessages(sessionId: number) {
  return fetchJSON<any[]>(`/sessions/${sessionId}/messages`);
}

export async function deleteSession(sessionId: number) {
  return fetchJSON(`/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

// ─── Analytics ──────────────────────────────────────────────────────

export async function fetchAnalyticsOverview(): Promise<DashboardOverviewResponse> {
  return fetchJSON<DashboardOverviewResponse>('/analytics/overview');
}

export async function fetchGlobalHealth(): Promise<GlobalAnalyticsResponse> {
  return fetchJSON<GlobalAnalyticsResponse>('/analytics/global-health');
}

export async function fetchModelHealth(): Promise<ModelHealthResponse[]> {
  return fetchJSON<ModelHealthResponse[]>('/analytics/model-health');
}

// ─── Cache Analytics ────────────────────────────────────────────────

export async function fetchCacheAnalytics(): Promise<CacheAnalyticsResponse> {
  return fetchJSON<CacheAnalyticsResponse>('/analytics/cache');
}

export async function fetchRedisMetrics(): Promise<RedisMetricsResponse> {
  return fetchJSON<RedisMetricsResponse>('/analytics/cache/redis');
}

export async function fetchCacheTrends(): Promise<CacheTrendsResponse> {
  return fetchJSON<CacheTrendsResponse>('/analytics/cache/trends');
}

// ─── API Keys ───────────────────────────────────────────────────────

export async function fetchAPIKeys(): Promise<{ keys: APIKey[] }> {
  const data = await fetchJSON<any[]>('/api-keys');
  return {
    keys: (data || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      request_count: k.requests_used,
      usage_limit: k.request_limit,
      last_used_at: undefined,
      created_at: k.created_at,
      is_active: k.is_active,
    }))
  };
}

export async function createAPIKey(name: string, usage_limit: number | null): Promise<CreateAPIKeyResponse> {
  const res = await fetchJSON<any>('/api-keys/create', {
    method: 'POST',
    body: JSON.stringify({ name, usage_limit }),
  });
  return { id: 0, key: res.api_key };
}

export async function revokeAPIKey(name: string): Promise<void> {
  return fetchJSON<void>('/api-keys/revoke', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return fetchJSON<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return fetchJSON<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return fetchJSON<ChangePasswordResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Real Logs / Decisions Endpoints ────────────────────────────────
export async function fetchRoutingDecisions(): Promise<any[]> {
  return fetchJSON<any[]>('/analytics/routing-decisions');
}

export async function fetchRequestLogs(): Promise<any[]> {
  return fetchJSON<any[]>('/analytics/logs');
}
