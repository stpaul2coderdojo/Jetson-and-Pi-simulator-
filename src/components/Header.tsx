import React from 'react';
import { Cpu, Play, Square, RefreshCw, Zap, Layers, BarChart3, CircuitBoard, Flame, BookOpen } from 'lucide-react';

interface HeaderProps {
  viewMode: 'tri-screen' | 'comparison' | 'hardware' | 'docs';
  setViewMode: (mode: 'tri-screen' | 'comparison' | 'hardware' | 'docs') => void;
  onDeployAll: () => void;
  onStopAll: () => void;
  onResetAll: () => void;
  onToggleStressAll: () => void;
  isAnyRunning: boolean;
  isBuilding: boolean;
  isStressActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onDeployAll,
  onStopAll,
  onResetAll,
  onToggleStressAll,
  isAnyRunning,
  isBuilding,
  isStressActive,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                EdgeDocker <span className="text-cyan-400">Sim</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                ARM64 Tri-Cluster
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                Silicon Telemetry Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulating Jetson Orin Nano (40 TOPS) • Raspberry Pi 5 (ARM64) • Thor Nano (250 TOPS)
            </p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            id="view-tri-screen"
            onClick={() => setViewMode('tri-screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'tri-screen'
                ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tri-Screen Sim
          </button>
          <button
            id="view-comparison"
            onClick={() => setViewMode('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'comparison'
                ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Comparison Matrix
          </button>
          <button
            id="view-hardware"
            onClick={() => setViewMode('hardware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'hardware'
                ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CircuitBoard className="w-3.5 h-3.5" />
            Hardware Specs
          </button>
          <button
            id="view-docs"
            onClick={() => setViewMode('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'docs'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Docs & GitHub
          </button>
        </div>

        {/* Global Cluster Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-stress-all"
            onClick={onToggleStressAll}
            disabled={!isAnyRunning}
            title="Inject continuous matrix stress load to test thermal throttling limits"
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              isStressActive
                ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${isStressActive ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            {isStressActive ? 'Stress: ON' : 'Stress Load'}
          </button>

          <button
            id="btn-reset-all"
            onClick={onResetAll}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Reset
          </button>

          {isAnyRunning ? (
            <button
              id="btn-stop-all"
              onClick={onStopAll}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 hover:bg-rose-900 transition-colors shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-rose-400" />
              Stop Containers
            </button>
          ) : (
            <button
              id="btn-deploy-all"
              onClick={onDeployAll}
              disabled={isBuilding}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBuilding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Building Images...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Build & Run on All 3
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
