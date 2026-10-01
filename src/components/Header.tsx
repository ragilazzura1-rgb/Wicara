import React, { useEffect, useState } from 'react';
import {
  Mic,
  Wifi,
  WifiOff,
  FolderOpen,
  Users,
  History,
  Sparkles,
  Info,
} from 'lucide-react';
import { TTSMode } from '../types';

interface HeaderProps {
  activeTab: 'welcome' | 'studio' | 'projects' | 'voices' | 'history';
  setActiveTab: (tab: 'welcome' | 'studio' | 'projects' | 'voices' | 'history') => void;
  ttsMode: TTSMode;
  setTTSMode: (mode: TTSMode) => void;
  projectTitle: string;
  onNewProject: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  ttsMode,
  setTTSMode,
  projectTitle,
  onNewProject,
  onOpenHelp,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Wicara
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  TTS Indonesia
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {projectTitle || 'Studio Transkrip Wawancara'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('welcome')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'welcome'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Beranda</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'projects'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Proyek</span>
            </button>
            <button
              onClick={() => setActiveTab('voices')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'voices'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>6 Suara Native</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Audio</span>
            </button>
          </nav>

          {/* Engine Selector & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Online / Offline Engine Toggle */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setTTSMode('gemini')}
                disabled={!isOnline}
                title={!isOnline ? 'Tidak ada koneksi internet' : 'Gunakan Gemini AI TTS'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  ttsMode === 'gemini' && isOnline
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gemini AI</span>
                <span className="sm:hidden">AI</span>
              </button>

              <button
                onClick={() => setTTSMode('offline')}
                title="Gunakan Mode Offline (Web Audio + Web Speech)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  ttsMode === 'offline' || !isOnline
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>Offline</span>
              </button>
            </div>

            {/* Quick Help Button */}
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Panduan Penggunaan"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Quick New Project Button */}
            <button
              onClick={onNewProject}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              + Proyek Baru
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-800 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium ${
              activeTab === 'welcome' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Beranda</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium ${
              activeTab === 'studio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium ${
              activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Proyek</span>
          </button>
          <button
            onClick={() => setActiveTab('voices')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium ${
              activeTab === 'voices' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>6 Suara</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium ${
              activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
