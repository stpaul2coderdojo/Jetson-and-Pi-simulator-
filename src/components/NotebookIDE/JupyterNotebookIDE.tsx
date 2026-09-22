import React, { useState, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  FileCode,
  Download,
  Upload,
  Bot,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  Eraser,
  Save,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { DeviceId, NotebookCell, NotebookDocument } from '../../types';
import { NOTEBOOK_PRESETS } from '../../data/notebookPresets';
import { NotebookKernelService } from '../../services/notebookKernel';
import { NotebookCellItem } from './NotebookCellItem';
import { GeminiChatbotDock } from './GeminiChatbotDock';

export const JupyterNotebookIDE: React.FC = () => {
  // Active Notebook state
  const [activeNotebook, setActiveNotebook] = useState<NotebookDocument>(NOTEBOOK_PRESETS[0]);
  const [selectedCellId, setSelectedCellId] = useState<string>(activeNotebook.cells[0]?.id || '');
  const [isKernelBusy, setIsKernelBusy] = useState(false);
  const [isGeminiDockOpen, setIsGeminiDockOpen] = useState(true);
  const [executionCounter, setExecutionCounter] = useState(4);
  const [activeCellCodeForGemini, setActiveCellCodeForGemini] = useState<string>('');

  const kernelRef = useRef<NotebookKernelService>(new NotebookKernelService(activeNotebook.targetHardware));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch Notebook preset
  const handleSelectPreset = (preset: NotebookDocument) => {
    setActiveNotebook(JSON.parse(JSON.stringify(preset)));
    setSelectedCellId(preset.cells[0]?.id || '');
    kernelRef.current.setTargetHardware(preset.targetHardware);
    kernelRef.current.reset();
  };

  // Switch target hardware
  const handleHardwareChange = (hw: DeviceId) => {
    setActiveNotebook((prev) => ({
      ...prev,
      targetHardware: hw,
      kernelName:
        hw === 'orin-nano'
          ? 'Python 3.11 (CUDA 12.2 - JetPack 6.0)'
          : hw === 'pi-5'
          ? 'Python 3.11 (Debian Bookworm - ARM64)'
          : 'Python 3.11 (Blackwell SM 10.0 - FP8)',
    }));
    kernelRef.current.setTargetHardware(hw);
  };

  // Cell Updates
  const handleUpdateCellSource = (cellId: string, source: string) => {
    setActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, source } : c)),
    }));
  };

  const handleUpdateCellType = (cellId: string, type: 'code' | 'markdown') => {
    setActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, type } : c)),
    }));
  };

  // Add Cell
  const handleAddCell = (type: 'code' | 'markdown', afterId?: string) => {
    const newCell: NotebookCell = {
      id: `cell-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      source: '',
      executionCount: null,
      outputs: [],
    };

    setActiveNotebook((prev) => {
      if (!afterId) {
        return { ...prev, cells: [...prev.cells, newCell] };
      }
      const idx = prev.cells.findIndex((c) => c.id === afterId);
      if (idx === -1) {
        return { ...prev, cells: [...prev.cells, newCell] };
      }
      const updated = [...prev.cells];
      updated.splice(idx + 1, 0, newCell);
      return { ...prev, cells: updated };
    });

    setSelectedCellId(newCell.id);
  };

  // Delete Cell
  const handleDeleteCell = (cellId: string) => {
    if (activeNotebook.cells.length <= 1) return;
    setActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.filter((c) => c.id !== cellId),
    }));
  };

  // Reorder Cells
  const handleMoveCell = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeNotebook.cells.length) return;

    setActiveNotebook((prev) => {
      const copy = [...prev.cells];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, cells: copy };
    });
  };

  // Execute a single cell
  const handleRunCell = async (cellId: string) => {
    const cell = activeNotebook.cells.find((c) => c.id === cellId);
    if (!cell || cell.type === 'markdown') return;

    setIsKernelBusy(true);
    setActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, isExecuting: true } : c)),
    }));

    try {
      const result = await kernelRef.current.executeCell(cell.source);
      const nextCount = executionCounter + 1;
      setExecutionCounter(nextCount);

      setActiveNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isExecuting: false,
                executionCount: nextCount,
                outputs: result.outputs,
              }
            : c
        ),
      }));
    } catch (err: any) {
      setActiveNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isExecuting: false,
                outputs: [
                  {
                    id: `err-${Date.now()}`,
                    type: 'error',
                    content: `Traceback (most recent call last):\n  Cell In[${executionCounter}], line 1\nRuntimeError: ${err.message}`,
                  },
                ],
              }
            : c
        ),
      }));
    } finally {
      setIsKernelBusy(false);
    }
  };

  // Run all code cells sequentially
  const handleRunAll = async () => {
    setIsKernelBusy(true);
    for (const cell of activeNotebook.cells) {
      if (cell.type === 'code') {
        await handleRunCell(cell.id);
      }
    }
    setIsKernelBusy(false);
  };

  // Clear all cell outputs
  const handleClearOutputs = () => {
    setActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => ({
        ...c,
        executionCount: null,
        outputs: [],
      })),
    }));
  };

  // Restart kernel
  const handleRestartKernel = () => {
    kernelRef.current.reset();
    handleClearOutputs();
    setExecutionCounter(0);
  };

  // Insert code snippet from Gemini into notebook
  const handleInsertFromGemini = (code: string) => {
    const newCell: NotebookCell = {
      id: `cell-gemini-${Date.now()}`,
      type: 'code',
      source: code,
      executionCount: null,
      outputs: [],
    };

    setActiveNotebook((prev) => {
      const idx = prev.cells.findIndex((c) => c.id === selectedCellId);
      if (idx !== -1) {
        const next = [...prev.cells];
        next.splice(idx + 1, 0, newCell);
        return { ...prev, cells: next };
      }
      return { ...prev, cells: [...prev.cells, newCell] };
    });

    setSelectedCellId(newCell.id);
  };

  // Send cell code to Gemini
  const handleSendCellToGemini = (cell: NotebookCell) => {
    setActiveCellCodeForGemini(cell.source);
    setIsGeminiDockOpen(true);
  };

  // Export as .ipynb JSON file
  const handleExportIpynb = () => {
    const ipynbData = {
      cells: activeNotebook.cells.map((c) => ({
        cell_type: c.type,
        metadata: {},
        source: c.source.split('\n').map((l, i, arr) => (i < arr.length - 1 ? l + '\n' : l)),
        execution_count: c.executionCount,
        outputs: c.outputs.map((o) => ({
          output_type: 'stream',
          name: 'stdout',
          text: [o.content],
        })),
      })),
      metadata: {
        kernelspec: {
          display_name: activeNotebook.kernelName,
          language: 'python',
          name: 'python3',
        },
        language_info: {
          name: 'python',
          version: '3.11.8',
        },
      },
      nbformat: 4,
      nbformat_minor: 5,
    };

    const blob = new Blob([JSON.stringify(ipynbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeNotebook.title;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as .py Python script
  const handleExportPy = () => {
    let script = `# Generated from ${activeNotebook.title}\n# Hardware Target: ${activeNotebook.targetHardware}\n\n`;
    activeNotebook.cells.forEach((c) => {
      if (c.type === 'markdown') {
        script += `"""\n${c.source}\n"""\n\n`;
      } else {
        script += `${c.source}\n\n`;
      }
    });

    const blob = new Blob([script], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeNotebook.title.replace('.ipynb', '.py');
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import an external .ipynb file
  const handleImportIpynb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.cells && Array.isArray(parsed.cells)) {
          const importedCells: NotebookCell[] = parsed.cells.map((c: any, idx: number) => ({
            id: `cell-import-${idx}-${Date.now()}`,
            type: c.cell_type === 'markdown' ? 'markdown' : 'code',
            source: Array.isArray(c.source) ? c.source.join('') : c.source || '',
            executionCount: c.execution_count || null,
            outputs: [],
          }));

          const importedDoc: NotebookDocument = {
            id: `imported-${Date.now()}`,
            title: file.name,
            description: `Imported user notebook: ${file.name}`,
            targetHardware: activeNotebook.targetHardware,
            kernelName: activeNotebook.kernelName,
            cells: importedCells,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setActiveNotebook(importedDoc);
          setSelectedCellId(importedCells[0]?.id || '');
        }
      } catch (err) {
        console.error('Failed to parse notebook JSON:', err);
      }
    };
    reader.readAsText(file);
  };

  const selectedCell = activeNotebook.cells.find((c) => c.id === selectedCellId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[680px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Hidden file input for .ipynb import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportIpynb}
        accept=".ipynb,application/json"
        className="hidden"
      />

      {/* Top Jupyter Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        {/* Left: Notebook Title & Preset Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 shadow-sm">
            <FileCode className="w-4 h-4 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={activeNotebook.title}
              onChange={(e) =>
                setActiveNotebook((prev) => ({ ...prev, title: e.target.value }))
              }
              className="bg-transparent font-mono text-sm font-semibold text-white focus:outline-none focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-700"
              title="Click to rename notebook"
            />

            {/* Preset Dropdown */}
            <select
              value={activeNotebook.id}
              onChange={(e) => {
                const found = NOTEBOOK_PRESETS.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              className="bg-slate-950 text-slate-300 text-xs font-medium border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {NOTEBOOK_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  📂 {p.title} ({p.targetHardware})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Hardware Target & Kernel Status */}
        <div className="flex items-center gap-3">
          {/* Target Hardware Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Target:</span>
            <select
              value={activeNotebook.targetHardware}
              onChange={(e) => handleHardwareChange(e.target.value as DeviceId)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="orin-nano">Jetson Orin Nano (40 TOPS)</option>
              <option value="pi-5">Raspberry Pi 5 (ARM64)</option>
              <option value="thor-nano">Thor Nano (250 TOPS)</option>
            </select>
          </div>

          {/* Kernel Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isKernelBusy ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="font-mono text-slate-300 text-[11px]">
              {isKernelBusy ? 'Kernel: Busy' : 'Python 3.11 (ARM64) • Idle'}
            </span>
            <button
              onClick={handleRestartKernel}
              title="Restart Kernel & Clear All Outputs"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Actions & Gemini Copilot Toggle */}
        <div className="flex items-center gap-2">
          {/* Export / Import Menu */}
          <button
            onClick={handleExportIpynb}
            title="Download .ipynb Notebook"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>.ipynb</span>
          </button>
          <button
            onClick={handleExportPy}
            title="Download Python .py Script"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>.py</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload existing .ipynb Notebook"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload</span>
          </button>

          {/* Gemini AI Copilot Button */}
          <button
            id="btn-toggle-gemini-dock"
            onClick={() => setIsGeminiDockOpen(!isGeminiDockOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isGeminiDockOpen
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white ring-1 ring-cyan-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/60 text-indigo-200 font-mono">
              Copilot
            </span>
          </button>
        </div>
      </div>

      {/* Jupyter Secondary Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            id="btn-notebook-run-cell"
            onClick={() => selectedCellId && handleRunCell(selectedCellId)}
            disabled={isKernelBusy || !selectedCellId}
            title="Run Selected Cell (Shift+Enter)"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Cell</span>
          </button>

          <button
            id="btn-notebook-run-all"
            onClick={handleRunAll}
            disabled={isKernelBusy}
            title="Run All Notebook Cells"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Play className="w-3 h-3" />
            <span>Run All</span>
          </button>

          <button
            onClick={() => handleAddCell('code', selectedCellId)}
            title="Insert Code Cell Below"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>+ Code</span>
          </button>

          <button
            onClick={() => handleAddCell('markdown', selectedCellId)}
            title="Insert Markdown Cell Below"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>+ Markdown</span>
          </button>

          <button
            onClick={handleClearOutputs}
            title="Clear All Outputs"
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear Outputs</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span>Cells: {activeNotebook.cells.length}</span>
          <span>•</span>
          <span>Shortcut: Shift + Enter to run</span>
        </div>
      </div>

      {/* Split Workspace Layout: Notebook Cells on Left, Gemini Chatbot on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notebook Cells Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <div className="max-w-4xl mx-auto">
            {/* Description Banner */}
            <div className="mb-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <p className="line-clamp-1">
                <span className="text-cyan-400 font-semibold mr-1.5">Notebook:</span>
                {activeNotebook.description}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                ARM64 Python 3.11
              </span>
            </div>

            {/* Cells List */}
            {activeNotebook.cells.map((cell, idx) => (
              <NotebookCellItem
                key={cell.id}
                cell={cell}
                index={idx}
                isSelected={selectedCellId === cell.id}
                onSelect={() => setSelectedCellId(cell.id)}
                onUpdateSource={(src) => handleUpdateCellSource(cell.id, src)}
                onUpdateType={(type) => handleUpdateCellType(cell.id, type)}
                onRun={() => handleRunCell(cell.id)}
                onDelete={() => handleDeleteCell(cell.id)}
                onMoveUp={() => handleMoveCell(idx, 'up')}
                onMoveDown={() => handleMoveCell(idx, 'down')}
                onSendToGemini={() => handleSendCellToGemini(cell)}
                isFirst={idx === 0}
                isLast={idx === activeNotebook.cells.length - 1}
              />
            ))}

            {/* Bottom Add Cell Controls */}
            <div className="flex items-center justify-center gap-3 py-6 border-t border-slate-900 mt-6">
              <button
                onClick={() => handleAddCell('code')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Code Cell</span>
              </button>
              <button
                onClick={() => handleAddCell('markdown')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Markdown Cell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gemini Chatbot Docked Panel */}
        <GeminiChatbotDock
          isOpen={isGeminiDockOpen}
          onClose={() => setIsGeminiDockOpen(false)}
          targetHardware={activeNotebook.targetHardware}
          activeNotebookTitle={activeNotebook.title}
          activeCellCode={selectedCell?.source || ''}
          onInsertCodeToNotebook={handleInsertFromGemini}
        />
      </div>
    </div>
  );
};
