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
  User,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Page } from '@/src/types';
import { useAuth } from '@/src/lib/AuthContext';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { id: 'playground', label: 'AI Playground', icon: Terminal },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'routing', label: 'Routing', icon: Route },
  { id: 'cache', label: 'Cache', icon: Database },
  { id: 'logs', label: 'Logs', icon: Database },
  { id: 'apikeys', label: 'API Keys', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

// Bottom tab items (subset for mobile bottom bar)
const mobileTabItems = [
  { id: 'playground', label: 'Playground', icon: Terminal },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'logs', label: 'Logs', icon: Database },
  { id: 'apikeys', label: 'Keys', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

function SidebarContent({
  currentPage,
  onPageChange,
  onClose,
}: {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onClose?: () => void;
}) {
  const { logout, user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            InferFlow
          </h1>
        </div>
        {/* Close button (mobile only) */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onPageChange(item.id as Page);
                onClose?.();
              }}
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

export function Sidebar({ currentPage, onPageChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <div className="hidden lg:flex w-64 border-r border-white/10 flex-col bg-black/40 backdrop-blur-xl shrink-0">
        <SidebarContent currentPage={currentPage} onPageChange={onPageChange} />
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed top-10 bottom-0 left-0 right-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] bg-zinc-950/95 border-r border-white/10 backdrop-blur-xl flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent
              currentPage={currentPage}
              onPageChange={onPageChange}
              onClose={onMobileClose}
            />
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-white/10 backdrop-blur-xl safe-area-pb">
        <div className="flex items-center justify-around px-1 py-2">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id as Page)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200",
                  active ? "text-blue-400" : "text-zinc-500"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_#3b82f6]")} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
