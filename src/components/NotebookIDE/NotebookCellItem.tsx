import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Copy,
  Check,
  Code,
  FileText,
  RotateCcw,
  BarChart2,
  Eye,
  Camera,
  Music,
} from 'lucide-react';
import { NotebookCell, NotebookCellType } from '../../types';

interface NotebookCellItemProps {
  cell: NotebookCell;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateSource: (newSource: string) => void;
  onUpdateType: (newType: NotebookCellType) => void;
  onRun: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSendToGemini: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const NotebookCellItem: React.FC<NotebookCellItemProps> = ({
  cell,
  index,
  isSelected,
  onSelect,
  onUpdateSource,
  onUpdateType,
  onRun,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSendToGemini,
  isFirst,
  isLast,
}) => {
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(cell.type === 'markdown' && !cell.source);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(68, textareaRef.current.scrollHeight)}px`;
    }
  }, [cell.source, isEditingMarkdown]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run cell on Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onRun();
      return;
    }

    // Support Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const updated = val.substring(0, start) + '    ' + val.substring(end);
      onUpdateSource(updated);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cell.source);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const lineCount = cell.source.split('\n').length;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border transition-all mb-4 overflow-hidden shadow-sm ${
        isSelected
          ? 'border-cyan-500/80 bg-slate-900/90 ring-1 ring-cyan-500/40'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
      }`}
    >
      {/* Cell Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          {/* Prompt Marker */}
          <span className="font-mono text-[11px] font-semibold text-slate-400 select-none">
            {cell.type === 'code' ? (
              cell.isExecuting ? (
                <span className="text-amber-400 animate-pulse">In [*]:</span>
              ) : cell.executionCount !== null ? (
                <span className="text-cyan-400">In [{cell.executionCount}]:</span>
              ) : (
                <span className="text-slate-500">In [ ]:</span>
              )
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-sans">
                <FileText className="w-3 h-3" /> Markdown
              </span>
            )}
          </span>

          {/* Cell Type Toggle Dropdown */}
          <select
            value={cell.type}
            onChange={(e) => onUpdateType(e.target.value as NotebookCellType)}
            className="bg-slate-900 text-slate-300 text-[10px] font-medium border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
          >
            <option value="code">Code (Python)</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {cell.type === 'code' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              disabled={cell.isExecuting}
              title="Run Cell (Shift+Enter)"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          )}

          {cell.type === 'markdown' && (
            <button
              onClick={() => setIsEditingMarkdown(!isEditingMarkdown)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
            >
              {isEditingMarkdown ? 'Preview' : 'Edit'}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendToGemini();
            }}
            title="Ask Gemini AI to review, debug or optimize this cell"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-[10px] transition-colors font-medium"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode();
            }}
            title="Copy Cell Source"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            title="Move Cell Up"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            title="Move Cell Down"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Cell"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex bg-slate-950">
        {/* Line Numbers column */}
        {cell.type === 'code' && (
          <div className="py-2.5 px-2 bg-slate-950 border-r border-slate-900 select-none text-right font-mono text-[11px] text-slate-600 w-10 shrink-0">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Code / Markdown Editor */}
        <div className="flex-1 p-2">
          {cell.type === 'code' || isEditingMarkdown ? (
            <textarea
              ref={textareaRef}
              value={cell.source}
              onChange={(e) => onUpdateSource(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                cell.type === 'code'
                  ? '# Enter Python code (e.g. import torch; print(torch.cuda.is_available()))'
                  : 'Enter Markdown content...'
              }
              rows={Math.max(2, lineCount)}
              className="w-full bg-transparent font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditingMarkdown(true)}
              className="p-3 text-slate-200 text-xs leading-relaxed space-y-2 cursor-pointer hover:bg-slate-900/30 rounded"
              title="Double-click to edit Markdown"
            >
              {cell.source.split('\n\n').map((block, bIdx) => {
                if (block.startsWith('# ')) {
                  return (
                    <h2 key={bIdx} className="text-base font-bold text-white border-b border-slate-800 pb-1">
                      {block.replace('# ', '')}
                    </h2>
                  );
                }
                if (block.startsWith('## ')) {
                  return (
                    <h3 key={bIdx} className="text-sm font-semibold text-cyan-300">
                      {block.replace('## ', '')}
                    </h3>
                  );
                }
                if (block.startsWith('### ')) {
                  return (
                    <h4 key={bIdx} className="text-xs font-semibold text-indigo-300">
                      {block.replace('### ', '')}
                    </h4>
                  );
                }
                if (block.startsWith('- ') || block.startsWith('* ')) {
                  const items = block.split('\n');
                  return (
                    <ul key={bIdx} className="list-disc pl-4 space-y-1 text-slate-300">
                      {items.map((it, itIdx) => (
                        <li key={itIdx}>{it.replace(/^[-*]\s+/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={bIdx} className="text-slate-300">
                    {block}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rich Output Area (For Code cells) */}
      {cell.type === 'code' && cell.outputs.length > 0 && (
        <div className="border-t border-slate-800/80 bg-slate-950/90 p-3 space-y-3 font-mono text-xs">
          {cell.outputs.map((out) => (
            <div key={out.id} className="space-y-2">
              {/* Output Content */}
              {out.type === 'text' && (
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto bg-slate-900/60 p-2.5 rounded border border-slate-800/60">
                  {out.content}
                </pre>
              )}

              {/* Data Table Output */}
              {out.type === 'table' && out.tableData && (
                <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/60">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 font-sans text-xs font-semibold text-cyan-400 flex items-center justify-between">
                    <span>{out.content}</span>
                    {out.executionTimeMs && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Execution: {out.executionTimeMs} ms
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          {out.tableData.headers.map((h, hIdx) => (
                            <th key={hIdx} className="px-3 py-2 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {out.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                            {row.map((cellVal, cIdx) => (
                              <td
                                key={cIdx}
                                className={`px-3 py-1.5 ${
                                  cIdx === 0
                                    ? 'text-slate-200 font-medium'
                                    : typeof cellVal === 'number'
                                    ? 'text-cyan-300'
                                    : 'text-slate-300'
                                }`}
                              >
                                {cellVal}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Visual Plot Outputs */}
              {out.type === 'plot' && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 font-sans">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                      {out.content}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      matplotlib / tensorrt
                    </span>
                  </div>

                  {/* Latency / Throughput Distribution Chart */}
                  {out.plotType === 'latency' && (
                    <div className="space-y-2 font-mono text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>FP32 PyTorch Native</span>
                          <span className="text-slate-200">34.6 ms (28.9 FPS)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: '41%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>FP16 TensorRT Engine</span>
                          <span className="text-slate-200">19.8 ms (50.5 FPS)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: '71%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>INT8 TensorRT Calibrated (Max FPS)</span>
                          <span className="text-emerald-400 font-semibold">14.2 ms (70.4 FPS) ⚡ 2.43x</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MegaDetector Camera Trap Visualizer */}
                  {out.plotType === 'detection' && (
                    <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 h-44 flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-slate-950 to-slate-900 pointer-events-none" />
                      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Camera className="w-3.5 h-3.5" />
                          Field Camera Trap Frame: IMG_0042.JPG
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">1280x1280 (Letterbox)</span>
                      </div>

                      {/* Simulated Bounding Box */}
                      <div className="relative z-10 self-center my-auto border-2 border-emerald-400 bg-emerald-500/10 px-4 py-2 rounded text-center">
                        <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                          animal: 94.2%
                        </span>
                        <p className="text-xs text-emerald-200 font-semibold mt-1">
                          Snow Leopard (Panthera uncia)
                        </p>
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>BBox: [0.24, 0.31, 0.48, 0.52]</span>
                        <span className="text-emerald-400">Triage Decision: Tag GPS & Preserve</span>
                      </div>
                    </div>
                  )}

                  {/* Bioacoustic Spectrogram Plot */}
                  {out.plotType === 'spectrogram' && (
                    <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 h-36 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                          <Music className="w-3.5 h-3.5" />
                          Mel-Spectrogram (128 Bands, 50Hz - 16kHz)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Duration: 5.0s</span>
                      </div>

                      {/* Visual Frequency Heat Spectrum */}
                      <div className="h-16 w-full flex items-end gap-1 px-1">
                        {Array.from({ length: 48 }).map((_, i) => {
                          const h = Math.min(100, Math.max(15, Math.sin(i * 0.4) * 45 + 50 + (i % 7) * 4));
                          const isPeak = i > 12 && i < 28;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-t transition-all ${
                                isPeak
                                  ? 'bg-gradient-to-t from-cyan-600 via-amber-400 to-rose-500'
                                  : 'bg-gradient-to-t from-slate-800 to-cyan-800'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>0.0s (Silence)</span>
                        <span className="text-amber-400">Great Hornbill Call (1.8s - 3.2s)</span>
                        <span>5.0s</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
