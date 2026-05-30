import React, { useEffect, useState } from 'react';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Database, 
  ArrowUpRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchAnalyticsOverview, fetchGlobalHealth, fetchModelHealth } from '../api';
import { DashboardOverviewResponse, GlobalAnalyticsResponse, ModelHealthResponse } from '../types';

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [globalHealth, setGlobalHealth] = useState<GlobalAnalyticsResponse | null>(null);
  const [modelHealth, setModelHealth] = useState<ModelHealthResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAnalyticsOverview().then(setOverview).catch(console.error),
      fetchGlobalHealth().then(setGlobalHealth).catch(console.error),
      fetchModelHealth().then(setModelHealth).catch(console.error)
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!overview) return <div className="p-8 text-white">Failed to load analytics</div>;

  const stats = [
    { 
      label: 'Total Requests', 
      value: overview.total_requests.toLocaleString(), 
      positive: true,
      icon: TrendingUp,
      color: 'blue'
    },
    { 
      label: 'Avg Latency', 
      value: `${overview.avg_latency.toFixed(2)}ms`, 
      positive: true,
      icon: Clock,
      color: 'green'
    },
    { 
      label: 'Cache Hit Rate', 
      value: `${overview.cache_hit_rate.toFixed(1)}%`, 
      positive: true,
      icon: Database,
      color: 'purple'
    },
    { 
      label: 'Total Cost', 
      value: `$${overview.total_cost.toFixed(2)}`, 
      positive: false,
      icon: Zap,
      color: 'yellow'
    },
    { 
      label: 'Fallback Count', 
      value: (overview.fallback_count || 0).toLocaleString(), 
      positive: false,
      icon: ShieldCheck,
      color: 'yellow'
    },
    { 
      label: 'Active Users (Today)', 
      value: overview.active_users_today.toLocaleString(), 
      positive: true,
      icon: Users,
      color: 'blue'
    },
    { 
      label: 'Active API Keys', 
      value: overview.active_api_keys.toLocaleString(), 
      positive: true,
      icon: ShieldCheck,
      color: 'purple'
    }
  ];

  const colors = ['#3b82f6', '#10a37f', '#d97706', '#8b5cf6', '#ec4899'];
  const providerData = overview.top_models.map((model, i) => ({
    name: model.model_type,
    usage: model.requests,
    cost: model.total_cost,
    color: colors[i % colors.length]
  }));

  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">System Analytics</h1>
          <p className="text-zinc-400">Real-time performance metrics across your model fleet.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden relative group hover:bg-white/[0.08] transition-all">
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 -mr-12 -mt-12 transition-all duration-500 group-hover:opacity-40 group-hover:scale-110",
                  stat.color === 'blue' ? "bg-blue-500" : 
                  stat.color === 'green' ? "bg-emerald-500" :
                  stat.color === 'purple' ? "bg-purple-500" : "bg-amber-500"
                )} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                    {stat.label}
                    <Icon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Global Health Section */}
        {globalHealth && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-6 backdrop-blur-md">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Global Health Status</span>
              <h3 className="text-sm font-semibold text-emerald-400">All Systems Operational</h3>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Global Latency</span>
                <span className="text-sm font-bold text-white">{globalHealth.avg_latency.toFixed(2)}ms</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Global Cost</span>
                <span className="text-sm font-bold text-white">${globalHealth.total_cost.toFixed(4)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Fallback Rate</span>
                <span className="text-sm font-bold text-amber-400">{globalHealth.fallback_rate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base text-white">Top Models Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {providerData.length > 0 ? (
                <>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={providerData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="usage"
                        >
                          {providerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 mt-4">
                    {providerData.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-sm text-zinc-300">{p.name}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{p.usage} reqs</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-zinc-500">
                  No model usage data available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base text-white">Provider Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.provider_health.length > 0 ? overview.provider_health.map((ph, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <h4 className="text-sm font-medium text-white">{ph.model_type}</h4>
                      <p className="text-xs text-zinc-400 mt-1">{ph.requests} requests served</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 mb-1">Latency</div>
                        <div className="text-sm text-white">{ph.avg_latency.toFixed(2)}ms</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 mb-1">Error Rate</div>
                        <div className="text-sm text-white">{ph.error_rate.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                )) : (
                   <div className="p-8 text-center text-zinc-500">No provider health data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Health Details Section */}
        {modelHealth && modelHealth.length > 0 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base text-white">Model Fleet Health Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Model Type</th>
                      <th className="pb-3 text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right">Requests</th>
                      <th className="pb-3 text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right">Avg Latency</th>
                      <th className="pb-3 text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right">Avg Cost</th>
                      <th className="pb-3 text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right">Fallback Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelHealth.map((mh, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 text-sm font-medium text-white">{mh.model_type}</td>
                        <td className="py-3 text-sm text-zinc-300 text-right">{mh.requests.toLocaleString()}</td>
                        <td className="py-3 text-sm text-zinc-300 text-right">{mh.avg_latency.toFixed(2)}ms</td>
                        <td className="py-3 text-sm text-zinc-300 text-right">${mh.avg_cost.toFixed(6)}</td>
                        <td className="py-3 text-sm text-amber-400 text-right">{mh.fallback_rate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
