import React, { useState } from 'react';
import { GitBranch, Star, Settings2, Sparkles, Search, CheckCircle2, Leaf, Cpu, Layers } from 'lucide-react';
import { GITHUB_PRESETS } from '../data/presets';
import { GitHubPreset, DockerConfig } from '../types';

interface RepoSelectorProps {
  currentConfig: DockerConfig;
  onSelectPreset: (preset: GitHubPreset) => void;
  onCustomRepoSubmit: (url: string) => Promise<void>;
  onOpenConfigEditor: () => void;
  isFetchingRepo: boolean;
}

type CategoryFilter = 'all' | 'wildlife' | 'nvidia-workshop' | 'core';

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  currentConfig,
  onSelectPreset,
  onCustomRepoSubmit,
  onOpenConfigEditor,
  isFetchingRepo,
}) => {
  const [inputUrl, setInputUrl] = useState(currentConfig.repoUrl);
  const [activePresetId, setActivePresetId] = useState<string>('yolov8-vision');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [presetSearch, setPresetSearch] = useState<string>('');

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

  const filteredPresets = GITHUB_PRESETS.filter((p) => {
    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : categoryFilter === 'wildlife'
        ? p.category === 'Wildlife AI'
        : categoryFilter === 'nvidia-workshop'
        ? p.category === 'NVIDIA Workshop'
        : p.category !== 'Wildlife AI' && p.category !== 'NVIDIA Workshop';

    const matchesSearch =
      presetSearch.trim() === '' ||
      p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.modelName.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.repoUrl.toLowerCase().includes(presetSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const activePreset = GITHUB_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              GitHub Edge Repository Workloads ({GITHUB_PRESETS.length} Available)
            </span>
          </div>
          <h2 className="text-sm font-semibold text-slate-200 mt-0.5">
            Select NVIDIA Workshop, Microsoft Wildlife AI, or Enter Any Public Repository
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

      {/* Category Filter Tabs & Quick Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            All ({GITHUB_PRESETS.length})
          </button>
          <button
            onClick={() => setCategoryFilter('wildlife')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              categoryFilter === 'wildlife'
                ? 'bg-emerald-950/90 border border-emerald-600/80 text-emerald-300 font-medium'
                : 'bg-slate-950 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <Leaf className="w-3 h-3 text-emerald-400" />
            Wildlife AI & Conservation (4)
          </button>
          <button
            onClick={() => setCategoryFilter('nvidia-workshop')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              categoryFilter === 'nvidia-workshop'
                ? 'bg-lime-950/90 border border-lime-600/80 text-lime-300 font-medium'
                : 'bg-slate-950 text-slate-400 hover:text-lime-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3 h-3 text-lime-400" />
            NVIDIA Workshop & DLI (6)
          </button>
          <button
            onClick={() => setCategoryFilter('core')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              categoryFilter === 'core'
                ? 'bg-indigo-950/90 border border-indigo-600/80 text-indigo-300 font-medium'
                : 'bg-slate-950 text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Vision & Edge LLM Core (5)
          </button>
        </div>

        <div className="relative w-40 sm:w-52">
          <input
            type="text"
            value={presetSearch}
            onChange={(e) => setPresetSearch(e.target.value)}
            placeholder="Filter presets..."
            className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {filteredPresets.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const isWildlife = preset.category === 'Wildlife AI';
          const isWorkshop = preset.category === 'NVIDIA Workshop';

          return (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => handlePresetClick(preset)}
              className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                isSelected
                  ? isWildlife
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-semibold shadow-sm'
                    : isWorkshop
                    ? 'bg-lime-950/90 border-lime-500 text-lime-200 font-semibold shadow-sm'
                    : 'bg-cyan-950/90 border-cyan-500 text-cyan-200 font-semibold shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {isWildlife && <Leaf className="w-3 h-3 text-emerald-400 shrink-0" />}
              {isWorkshop && <Cpu className="w-3 h-3 text-lime-400 shrink-0" />}
              <span>{preset.name}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800/80 text-slate-400">
                {preset.recommendedPrecision}
              </span>
              <span className="flex items-center text-[10px] text-amber-400/80 gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {preset.stars}
              </span>
              {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Active Workload Description & Badges */}
      {activePreset && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-400 gap-2">
          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-2xl">
            <span className="text-cyan-400 font-medium mr-1">Workload:</span>
            {activePreset.description}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
              {activePreset.category}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">
              {activePreset.recommendedPrecision}
            </span>
          </div>
        </div>
      )}

      {/* Current Active Workload Badge Details */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-slate-300 font-medium">Model:</span>
          <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            {currentConfig.workload.modelName}
          </span>
          <span className="text-slate-500">•</span>
          <span>Precision:</span>
          <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            {currentConfig.workload.precision}
          </span>
          <span className="text-slate-500">•</span>
          <span>Runtime:</span>
          <span className="font-mono text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
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
