import React, { useState } from 'react';
import { 
  X, Terminal, Send, Cpu, Zap, Thermometer, Database, Check, 
  Layers, HardDrive, RefreshCw, AlertTriangle
} from 'lucide-react';
import { DeviceSpec, DeviceSimulationState, DockerConfig } from '../types';

interface DeviceDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  spec: DeviceSpec;
  state: DeviceSimulationState;
  config: DockerConfig;
  onExecuteCommand: (cmd: string) => string;
}

export const DeviceDeepDiveModal: React.FC<DeviceDeepDiveModalProps> = ({
  isOpen,
  onClose,
  spec,
  state,
  config,
  onExecuteCommand,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: spec.gpu.hasCuda ? 'tegrastats' : 'vcgencmd measure_temp',
      output: onExecuteCommand(spec.gpu.hasCuda ? 'tegrastats' : 'vcgencmd measure_temp'),
    },
  ]);

  if (!isOpen) return null;

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const output = onExecuteCommand(commandInput.trim());
    setCommandHistory((prev) => [...prev, { cmd: commandInput.trim(), output }]);
    setCommandInput('');
  };

  const quickCommands = [
    spec.gpu.hasCuda ? 'tegrastats' : 'vcgencmd measure_temp',
    spec.gpu.hasCuda ? 'nvidia-smi' : 'docker stats',
    'free -m',
    'cat /proc/cpuinfo',
    'curl http://localhost:8080/predict',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90"
          style={{ borderTop: `3px solid ${spec.colorAccent}` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: `${spec.colorAccent}20`, border: `1px solid ${spec.colorAccent}` }}
            >
              <Cpu className="w-5 h-5" style={{ color: spec.colorAccent }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{spec.name}</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  {spec.tagline}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Container ID: {state.containerId} • Status: {state.status.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-slate-950">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Compute TOPS</span>
              <p className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                {spec.gpu.int8Tops} TOPS
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                {spec.gpu.fp16Tops} TOPS (FP16)
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Memory Bandwidth</span>
              <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
                {spec.memory.bandwidthGbps} GB/s
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                {spec.memory.capacityGb}GB {spec.memory.type}
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Power Mode</span>
              <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                {state.telemetry.powerWatts}W
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                TDP max: {spec.power.maxWatts}W
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Operating System</span>
              <p className="text-sm font-bold text-slate-200 mt-1 truncate">
                {spec.os}
              </p>
              <span className="text-[11px] text-emerald-400 font-mono truncate block">
                {spec.cudaVersion || 'runc linux/arm64'}
              </span>
            </div>
          </div>

          {/* Interactive Shell Console */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white font-mono">
                  Interactive Container Terminal (root@edge-node)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Type commands or click quick helpers below
              </span>
            </div>

            {/* Terminal History */}
            <div className="p-4 bg-black/90 font-mono text-xs text-slate-200 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3 scrollbar-thin">
              <div className="text-slate-500 leading-relaxed">
                Welcome to the simulated {spec.name} container terminal environment.
                <br />
                Architecture: {spec.architecture} | Kernel: Linux 5.15-tegra | Docker Engine: 24.0
              </div>

              {commandHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <span className="text-emerald-400 font-bold">root@edge-node:/app#</span>
                    <span>{item.cmd}</span>
                  </div>
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap pl-2 border-l-2 border-slate-800 bg-slate-950/60 p-2 rounded">
                    {item.output}
                  </pre>
                </div>
              ))}
            </div>

            {/* Quick helper command chips */}
            <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500 font-medium mr-1">Quick:</span>
              {quickCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    const output = onExecuteCommand(cmd);
                    setCommandHistory((prev) => [...prev, { cmd, output }]);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono rounded border border-slate-700 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Command Input Form */}
            <form onSubmit={handleCommandSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Enter shell command (e.g. tegrastats, nvidia-smi, docker stats, free -m)..."
                  className="w-full px-3 py-2 bg-black/80 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3 h-3" />
                Run
              </button>
            </form>
          </div>

          {/* Detailed Hardware Specs Sheet */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Full Architectural Specifications & JetPack Stack
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Processor (CPU):</span>
                <span className="font-mono text-white">{spec.cpu.cores}x {spec.cpu.model} @ {spec.cpu.clockGhz} GHz</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">GPU Architecture:</span>
                <span className="font-mono text-white">{spec.gpu.architecture}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">CUDA Cores / Compute:</span>
                <span className="font-mono text-white">{spec.gpu.cores} cores ({spec.gpu.tensorCores} Tensor Cores)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Unified Memory:</span>
                <span className="font-mono text-white">{spec.memory.capacityGb}GB {spec.memory.type} (Bus: {spec.memory.busWidthBits}-bit)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Storage Controller:</span>
                <span className="font-mono text-white">{spec.storage}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Thermal Throttling Ceiling:</span>
                <span className="font-mono text-rose-400">{spec.thermals.throttleTempC}°C (Max Safe: {spec.thermals.maxSafeTempC}°C)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
