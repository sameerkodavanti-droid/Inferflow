import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
import { fetchRequestLogs } from '../api';

export function RequestLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => 
    log.id?.toLowerCase().includes(search.toLowerCase()) ||
    log.model?.toLowerCase().includes(search.toLowerCase()) ||
    log.path?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 px-4 sm:px-8 py-4 sm:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 shrink-0">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Request Explorer</h1>
            <p className="text-zinc-400">Granular visibility into every transaction flowing through InferFlow.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 p-2 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search by Request ID, Model, or Path..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-600 pl-10" 
            />
          </div>
        </div>

        <Card className="flex-1 bg-white/5 border-white/10 backdrop-blur-md overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">No request logs found</div>
          ) : (
            <>
              <Table>
                <TableHeader className="border-b border-white/10 sticky top-0 bg-black/40 backdrop-blur-md z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-6 py-4">Request ID</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Model</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Type</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Path</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Latency</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <ScrollArea className="flex-1">
                <Table>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer border-b last:border-0 h-16">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col">
                            <span className="text-white font-mono text-xs truncate max-w-[120px]">{log.id}</span>
                            <span className="text-[10px] text-zinc-600 font-mono italic flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {log.time}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-sm font-medium">{log.model}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-white/5 text-[9px] uppercase font-bold px-2 py-0.5">
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-blue-400 font-mono tracking-tight">{log.path}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                             <span className="text-zinc-300 font-mono text-xs font-bold">{log.latency}ms</span>
                             <span className="text-[10px] text-zinc-600 font-mono">{log.tokens} tx</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="flex items-center justify-end gap-3">
                             <Badge className={cn(
                               "uppercase text-[9px] font-bold border-none h-5 min-w-[40px] justify-center",
                               log.status === 200 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                             )}>
                               {log.status}
                             </Badge>
                             <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
