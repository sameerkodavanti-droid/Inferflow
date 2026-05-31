import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Zap, 
  TrendingDown,
  Activity,
  Box
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchCacheAnalytics, fetchRedisMetrics, fetchCacheTrends } from '../api';
import { CacheAnalyticsResponse, RedisMetricsResponse, CacheTrendsResponse } from '../types';

export function CacheAnalytics() {
  const [cacheData, setCacheData] = useState<CacheAnalyticsResponse | null>(null);
  const [redisData, setRedisData] = useState<RedisMetricsResponse | null>(null);
  const [trendsData, setTrendsData] = useState<CacheTrendsResponse | null>(null);

  useEffect(() => {
    fetchCacheAnalytics().then(setCacheData).catch(console.error);
    fetchRedisMetrics().then(setRedisData).catch(console.error);
    fetchCacheTrends().then(setTrendsData).catch(console.error);
  }, []);

  if (!cacheData) return <div className="p-8 text-white">Loading cache data...</div>;

  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-4 sm:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Cache Observability</h1>
              <p className="text-zinc-400">Analyze performance gains and cost reduction via intelligent semantic caching.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <MetricsTile label="Cache Hit Rate" value={`${cacheData.hit_rate.toFixed(1)}%`} icon={Zap} color="blue" />
           <MetricsTile label="Tokens Saved" value={cacheData.tokens_saved.toLocaleString()} icon={Box} color="purple" />
           <MetricsTile label="Avg. Latency Saved" value={`${cacheData.avg_latency_saved.toFixed(2)}ms`} icon={TrendingDown} color="emerald" />
           <MetricsTile label="Redis Usage" value={redisData ? redisData.used_memory : 'Loading...'} icon={Activity} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
               <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity className="w-4 h-4 text-emerald-400" />
                 Cache Efficiency
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-zinc-400">Total Hits</span>
                    <span className="text-sm font-bold text-white">{cacheData.hits.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-zinc-400">Total Misses</span>
                    <span className="text-sm font-bold text-white">{cacheData.misses.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-zinc-400">Cost Saved</span>
                    <span className="text-sm font-bold text-emerald-400">${cacheData.cost_saved.toFixed(4)}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-zinc-400">Cache Requests / Day</span>
                    <span className="text-sm font-bold text-white">{cacheData.cache_requests_per_day.toFixed(1)}</span>
                 </div>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
               <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                 <Database className="w-4 h-4 text-blue-400" />
                 Redis Metrics
               </CardTitle>
            </CardHeader>
            <CardContent>
               {redisData ? (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-sm text-zinc-400">Connected Clients</span>
                      <span className="text-sm font-bold text-white">{redisData.connected_clients}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-sm text-zinc-400">Uptime (seconds)</span>
                      <span className="text-sm font-bold text-white">{redisData.uptime_seconds.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-sm text-zinc-400">Total Keys</span>
                      <span className="text-sm font-bold text-white">{redisData.total_keys.toLocaleString()}</span>
                   </div>
                 </div>
               ) : (
                 <div className="text-sm text-zinc-500">Loading Redis data...</div>
               )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-md">
          <CardHeader>
             <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
               <Activity className="w-4 h-4 text-purple-400" />
               Cache Hit/Miss Trends (Last 30 Days)
             </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsData && trendsData.trends.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData.trends}>
                    <defs>
                      <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMisses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} />
                    <YAxis stroke="#ffffff40" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="hits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHits)" name="Hits" />
                    <Area type="monotone" dataKey="misses" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorMisses)" name="Misses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No trend data available. Start making requests to see caching activity over time.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricsTile({ label, value, icon: Icon, color }: any) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 ring-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 ring-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  };

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <CardHeader className="pb-2">
         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </CardHeader>
      <CardContent>
         <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
         </div>
      </CardContent>
    </Card>
  );
}
