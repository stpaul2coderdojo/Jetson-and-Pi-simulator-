import React, { useState } from 'react';
import { GitBranch, GitFork, Star, Settings2, Sparkles, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { GITHUB_PRESETS } from '../data/presets';
import { GitHubPreset, DockerConfig } from '../types';

interface RepoSelectorProps {
  currentConfig: DockerConfig;
  onSelectPreset: (preset: GitHubPreset) => void;
  onCustomRepoSubmit: (url: string) => Promise<void>;
  onOpenConfigEditor: () => void;
  isFetchingRepo: boolean;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  currentConfig,
  onSelectPreset,
  onCustomRepoSubmit,
  onOpenConfigEditor,
  isFetchingRepo,
}) => {
  const [inputUrl, setInputUrl] = useState(currentConfig.repoUrl);
  const [activePresetId, setActivePresetId] = useState<string>('yolov8-vision');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onCustomRepoSubmit(inputUrl.trim());
    }
  };

  const handlePresetClick = (preset: GitHubPreset) => {
    setActivePresetId(preset.id);
    setInputUrl(preset.repoUrl);
    onSelectPreset(preset);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              GitHub Edge Repository Source
            </span>
          </div>
          <h2 className="text-sm font-semibold text-slate-200 mt-0.5">
            Select a Workload or Enter Any Public GitHub Repository
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-config-editor"
            onClick={onOpenConfigEditor}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            Edit Dockerfile & Flags
          </button>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <GitBranch className="w-4 h-4" />
          </div>
          <input
            id="input-github-repo"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://github.com/organization/repository"
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <button
          type="submit"
          id="btn-fetch-repo"
          disabled={isFetchingRepo}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {isFetchingRepo ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Inspecting...
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              Load Repo
            </>
          )}
        </button>
      </form>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-medium text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Presets:
        </span>
        {GITHUB_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => handlePresetClick(preset)}
              className={`shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-md text-xs transition-all border ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{preset.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {preset.recommendedPrecision}
              </span>
              {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Current Active Workload Badge Details */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-300 font-medium">Model:</span>
          <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentConfig.workload.modelName}
          </span>
          <span className="text-slate-500">•</span>
          <span>Precision:</span>
          <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentConfig.workload.precision}
          </span>
          <span className="text-slate-500">•</span>
          <span>Runtime:</span>
          <span className="font-mono text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentConfig.runtimeFlags.nvidiaRuntime ? '--runtime nvidia (CUDA)' : 'standard runc'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Multi-Arch Build Target:</span>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">linux/arm64</span>
        </div>
      </div>
    </div>
  );
};
