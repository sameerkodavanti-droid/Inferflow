export type Page =
  | 'playground'
  | 'analytics'
  | 'routing'
  | 'cache'
  | 'logs'
  | 'settings'
  | 'apikeys';

export interface UserRequest {
  email: string;
  password?: string; // used for register/login
}

export interface UserResponse {
  id: number;
  email: string;
}

export interface IsAuthResponse {
  authenticated: boolean;
  user_id: number;
  email: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  usage_limit: number | null;
}

export interface CreateAPIKeyResponse {
  id: number;
  key: string;
}

export interface RevokeAPIKeyRequest {
  key_id: number;
}

export interface APIKey {
  id: number;
  name: string | null;
  key_hash?: string;
  created_at?: string;
  last_used_at?: string;
  usage_limit?: number | null;
  request_count?: number;
  status?: string;
  is_active?: boolean;
}

export interface ChatRequest {
  prompt: string;
  model_type: string | null;
  session_id: string | null;
}

export interface ChatResponse {
  response: string;
  model_type: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached: boolean;
  cost: number;
  latency: number;
}


export interface ProviderHealthItem {
  model_type: string;
  requests: number;
  avg_latency: number;
  error_rate: number;
}

export interface TopModelItem {
  model_type: string;
  requests: number;
  total_cost: number;
}

export interface TopUserItem {
  user_id: number;
  requests: number;
  total_cost: number;
}

export interface DashboardOverviewResponse {
  total_users: number;
  total_requests: number;
  total_cost: number;
  avg_latency: number;
  cache_hit_rate: number;
  tokens_saved: number;
  cost_saved: number;
  active_api_keys: number;
  active_users_today: number;
  requests_today: number;
  requests_this_month: number;
  provider_health: ProviderHealthItem[];
  top_models: TopModelItem[];
  top_users: TopUserItem[];
  fallback_count: number;
}

export interface CacheAnalyticsResponse {
  hits: number;
  misses: number;
  hit_rate: number;
  tokens_saved: number;
  cost_saved: number;
  avg_latency_saved: number;
  total_latency_saved: number;
  cache_requests_per_day: number;
  cache_efficiency: number;
}

export interface CacheTrendItem {
  date: string;
  hits: number;
  misses: number;
  hit_rate: number;
}

export interface CacheTrendsResponse {
  trends: CacheTrendItem[];
}

export interface RedisMetricsResponse {
  used_memory: string;
  used_memory_bytes: number;
  connected_clients: number;
  uptime_seconds: number;
  total_keys: number;
}

export interface GlobalAnalyticsResponse {
  total_requests: number;
  avg_latency: number;
  total_cost: number;
  fallback_rate: number;
}

export interface ModelHealthResponse {
  model_type: string;
  requests: number;
  avg_latency: number;
  avg_cost: number;
  fallback_rate: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  latency?: number;
  tokens?: number;
  cost?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  path: string;
  latency: number;
  tokens: number;
  status: number;
  type: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}



