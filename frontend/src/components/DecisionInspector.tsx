import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Clock, 
  Coins, 
  ShieldCheck, 
  ChevronRight,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { fetchRoutingDecisions } from '../api';

export function DecisionInspector() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutingDecisions()
      .then(data => {
        setDecisions(data);
        if (data.length > 0) {
          setSelectedDecision(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-4 sm:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <Workflow className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Routing Inspector</h1>
              <p className="text-zinc-400">Examine real-time routing decisions and performance diagnostics.</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-zinc-400">Loading decisions...</div>
        ) : decisions.length === 0 ? (
          <div className="text-zinc-500 bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
            No routing decisions recorded yet. Start a chat in the AI Playground!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            {/* Main Decision Detail View */}
            <div className="lg:col-span-2 space-y-6">
              {selectedDecision && (
                <Card className="bg-white/[0.02] border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                  
                  {/* Prompt Text Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> User Prompt
                    </span>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-base text-zinc-100 italic">"{selectedDecision.prompt}"</p>
                    </div>
                  </div>

                  {/* Metrics details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prompt Category</span>
                      <span className="text-lg font-bold text-white">{selectedDecision.classification}</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chosen Model</span>
                      <span className="text-lg font-bold text-white capitalize">{selectedDecision.provider}</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        Confidence <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                      <span className="text-lg font-bold text-emerald-400">{(selectedDecision.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Fallback, Latency, and Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        Fallback Used {selectedDecision.fallback_used && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-bold", selectedDecision.fallback_used ? "text-amber-400" : "text-white")}>
                          {selectedDecision.fallback_used ? "Yes" : "No"}
                        </span>
                        {selectedDecision.fallback_used && (
                          <Badge variant="outline" className="border-amber-500/20 text-amber-400 bg-amber-500/5 text-[9px] uppercase font-bold px-1.5 py-0.5">
                            {selectedDecision.fallback}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        Latency <Clock className="w-3.5 h-3.5 text-blue-400" />
                      </span>
                      <span className="text-lg font-bold text-white">{selectedDecision.latency}ms</span>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                        Estimated Cost <Coins className="w-3.5 h-3.5 text-purple-400" />
                      </span>
                      <span className="text-lg font-bold text-white">${selectedDecision.cost.toFixed(5)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Decisions List Sidebar */}
            <div className="flex flex-col gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader className="pb-2 border-b border-white/5">
                  <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Decisions</CardTitle>
                </CardHeader>
                <ScrollArea className="h-[520px] w-full px-4 mt-4">
                  <div className="space-y-3 pb-4">
                    {decisions.map((log) => (
                      <button
                        key={log.id}
                        onClick={() => setSelectedDecision(log)}
                        className={cn(
                          "w-full p-4 rounded-xl border text-left transition-all duration-300 group",
                          selectedDecision?.id === log.id 
                            ? "bg-purple-600/10 border-purple-500/40 shadow-lg shadow-purple-900/10" 
                            : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest font-mono",
                            selectedDecision?.id === log.id ? "text-purple-400" : "text-zinc-500"
                          )}>
                            {log.id}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium truncate mb-2">"{log.prompt}"</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px] border-white/10 text-zinc-400 uppercase">
                            {log.provider}
                          </Badge>
                          <ChevronRight className={cn(
                            "w-3 h-3 transition-transform group-hover:translate-x-1",
                            selectedDecision?.id === log.id ? "text-purple-400" : "text-zinc-700"
                          )} />
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
