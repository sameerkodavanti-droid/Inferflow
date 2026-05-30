import React, { useEffect, useState } from 'react';
import {
  Activity,
  Zap,
  Database,
  Wifi,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAnalyticsOverview } from '../api';
import { DashboardOverviewResponse } from '../types';

export function GlobalStatusBar() {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);

  useEffect(() => {
    fetchAnalyticsOverview()
      .then(setData)
      .catch(() => { });
  }, []);

  const metrics = data ? [
    { label: 'RPS (TODAY)', value: data.requests_today.toLocaleString(), icon: Zap, color: 'text-blue-400' },
    { label: 'AVG LATENCY', value: `${data.avg_latency.toFixed(0)}ms`, icon: Activity, color: 'text-emerald-400' },
    { label: 'CACHE HIT', value: `${(data.cache_hit_rate).toFixed(1)}%`, icon: Database, color: 'text-purple-400' },
  ] : [];

  return (
    <div className="h-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Operational</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-8">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2 group cursor-default">
              <m.icon className={cn("w-3 h-3 transition-transform group-hover:scale-110", m.color)} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{m.label}</span>
                <span className="text-[10px] font-mono font-bold text-zinc-200">{m.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Routing Mode</span>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          <span className="text-[10px] font-bold text-white uppercase">Intelligent</span>
        </div>
      </div>
    </div>
  );
}
