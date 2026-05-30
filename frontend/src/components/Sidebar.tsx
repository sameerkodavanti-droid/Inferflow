import React from 'react';
import { 
  BarChart3, 
  Terminal, 
  Settings, 
  Database, 
  ShieldCheck, 
  Zap,
  Route,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Page } from '@/src/types';
import { useAuth } from '@/src/lib/AuthContext';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navItems = [
  { id: 'playground', label: 'AI Playground', icon: Terminal },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'routing', label: 'Routing Inspector', icon: Route },
  { id: 'cache', label: 'Cache Analytics', icon: Database },
  { id: 'logs', label: 'Request Logs', icon: Database },
  { id: 'apikeys', label: 'API Keys', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { logout, user } = useAuth();

  return (
    <div className="w-64 border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          InferFlow
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                active 
                  ? "bg-blue-600/10 text-white shadow-[inset_0_0_20px_rgba(37,99,235,0.05)] border border-blue-500/20" 
                  : "text-zinc-400 hover:text-blue-50 hover:bg-white/[0.04] border border-transparent hover:border-white/5"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-all duration-300 group-hover:scale-110",
                active ? "text-blue-400" : "text-zinc-500 group-hover:text-blue-400"
              )} />
              {item.label}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="px-3 py-2 text-xs text-zinc-500 flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="truncate">{user?.email}</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
