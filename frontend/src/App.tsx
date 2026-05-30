/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from './components/Sidebar';
import { GlobalStatusBar } from './components/GlobalStatusBar';
import { AppPlayground } from './components/AppPlayground';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DecisionInspector } from './components/DecisionInspector';
import { CacheAnalytics } from './components/CacheAnalytics';
import { RequestLogs } from './components/RequestLogs';
import { APIKeys } from './components/APIKeys';
import { Settings } from './components/Settings';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Page } from './types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('playground');
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'playground': return <AppPlayground />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'routing': return <DecisionInspector />;
      case 'cache': return <CacheAnalytics />;
      case 'logs': return <RequestLogs />;
      case 'apikeys': return <APIKeys />;
      case 'settings': return <Settings />;
      default: return <AppPlayground />;
    }
  };

  return (
    <div className="dark flex flex-col h-screen bg-black text-white selection:bg-blue-500/30 selection:text-white antialiased font-sans overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <GlobalStatusBar />
      
      <div className="flex flex-1 overflow-hidden z-10">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <main className="flex-1 flex relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none z-0" />
          
            <div className="flex-1 z-10 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {renderPage()}
            </div>
          </div>
        </main>
      </div>

      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
