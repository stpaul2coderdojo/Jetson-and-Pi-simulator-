import React, { useRef, useEffect } from 'react';
import { 
  Play, Square, Terminal, Flame, Zap, Thermometer, Cpu, Gauge, 
  ExternalLink, Activity, AlertTriangle, CheckCircle2, RotateCcw
} from 'lucide-react';
import { DeviceSpec, DeviceSimulationState, DockerConfig } from '../types';

interface DeviceSimulatorCardProps {
  spec: DeviceSpec;
  state: DeviceSimulationState;
  config: DockerConfig;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onToggleStress: () => void;
  onOpenShell: () => void;
  isStressActive: boolean;
}

export const DeviceSimulatorCard: React.FC<DeviceSimulatorCardProps> = ({
  spec,
  state,
  config,
  onStart,
  onStop,
  onRestart,
  onToggleStress,
  onOpenShell,
  isStressActive,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal when running
  useEffect(() => {
    if (state.status === 'running' || state.status === 'building') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs.length, state.status]);

  const isRunning = state.status === 'running';
  const isBuilding = state.status === 'building';
  const isIdle = state.status === 'idle';

  // Workload label
  const isLLM = config.workload.type === 'llm';
  const isVision = config.workload.type === 'vision';
  const isRobotics = config.workload.type === 'robotics';
  const isAudio = config.workload.type === 'audio';

  const fpsLabel = isLLM ? 'tok / s' : isRobotics ? 'Hz' : isAudio ? 'x Realtime' : 'FPS';
  const latencyLabel = isLLM ? 'ms / tok' : 'ms';

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-slate-700">
      {/* Device Header */}
      <div 
        className="px-4 py-3 border-b border-slate-800 flex items-center justify-between"
        style={{ borderTop: `3px solid ${spec.colorAccent}` }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: spec.colorAccent }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{spec.name}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                ${spec.priceUsd}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {spec.cpu.model} • {spec.memory.capacityGb}GB {spec.memory.type}
            </p>
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="flex items-center gap-2">
          {state.telemetry.isThrottling && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              THROTTLED
            </span>
          )}
          
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
            isRunning
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
              : isBuilding
              ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : isBuilding ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
            }`} />
            {state.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Building Progress Banner */}
      {isBuilding && (
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span className="font-mono flex items-center gap-1.5 text-amber-400">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              {state.buildStage || 'Building Docker Image...'}
            </span>
            <span className="font-mono text-slate-400">{state.buildProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${state.buildProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Primary Hardware Telemetry Grid */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Main Throughput FPS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Inference Speed
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono">
                {isRunning ? state.telemetry.fps : '--'}
              </span>
              <span className="text-[11px] font-medium text-cyan-400">{fpsLabel}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              {isRunning ? `${state.telemetry.inferenceLatencyMs} ${latencyLabel}` : 'offline'}
            </span>
          </div>

          {/* Power Draw */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              Power
              <Zap className="w-3 h-3 text-amber-400" />
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono">
                {isRunning ? state.telemetry.powerWatts : spec.power.idleWatts}
              </span>
              <span className="text-[11px] font-medium text-amber-400">W</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all"
                style={{ 
                  width: `${Math.min(100, ((isRunning ? state.telemetry.powerWatts : spec.power.idleWatts) / spec.power.maxWatts) * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Thermals */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              Thermals
              <Thermometer className="w-3 h-3 text-rose-400" />
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-extrabold font-mono ${
                state.telemetry.temperatureC > 78 ? 'text-rose-400' : 'text-white'
              }`}>
                {state.telemetry.temperatureC}°
              </span>
              <span className="text-[11px] font-medium text-slate-400">C</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
              Fan: {state.telemetry.fanRpm} RPM
            </span>
          </div>

          {/* Accelerator / GPU Utilization */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              {spec.gpu.hasCuda ? 'CUDA Engine' : 'ARM NEON'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono">
                {isRunning ? (spec.gpu.hasCuda ? `${state.telemetry.gpuUsage}%` : `${state.telemetry.cpuUsage}%`) : '0%'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono truncate">
              {spec.gpu.hasCuda ? `${spec.gpu.int8Tops} TOPS` : 'CPU SIMD'}
            </span>
          </div>
        </div>

        {/* Secondary Detailed Bars (CPU Cores & Unified Memory) */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* CPU Cores Cluster */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>CPU Core Activity ({spec.cpu.cores} Cores)</span>
              <span className="font-mono text-slate-300">{isRunning ? `${state.telemetry.cpuUsage}%` : '2%'}</span>
            </div>
            <div className="flex gap-1 h-2">
              {(state.telemetry.cpuCoresUsage || Array(spec.cpu.cores).fill(2)).map((usage, idx) => (
                <div key={idx} className="flex-1 bg-slate-800 rounded-sm overflow-hidden" title={`Core ${idx}: ${usage}%`}>
                  <div 
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${isRunning ? usage : 2}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Unified Memory & Bandwidth */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Unified Memory ({spec.memory.type})</span>
              <span className="font-mono text-slate-300">
                {(state.telemetry.memoryUsedMb / 1024).toFixed(1)} / {spec.memory.capacityGb} GB
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-sm overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${(state.telemetry.memoryUsedMb / state.telemetry.memoryTotalMb) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Inference Preview Visualizer */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            {isVision ? 'Vision Camera Feed (640x640)' : isLLM ? 'LLM Token Stream' : isRobotics ? 'LiDAR AMR Map' : 'Real-Time Edge Feed'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Processed: {state.telemetry.totalFramesProcessed.toLocaleString()} items
        </div>
      </div>

      {/* Visual Simulation Display Box */}
      <div className="relative h-28 bg-slate-950 flex items-center justify-center p-3 border-b border-slate-800 overflow-hidden font-mono text-xs">
        {isRunning ? (
          isVision ? (
            <div className="relative w-full h-full bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Simulated camera background grid */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Animated bounding boxes */}
              <div className="absolute top-2 left-6 px-2 py-0.5 border border-emerald-500 bg-emerald-500/10 rounded text-[10px] text-emerald-300 animate-pulse">
                person: 0.94
              </div>
              <div className="absolute bottom-3 right-8 px-2 py-0.5 border border-cyan-500 bg-cyan-500/10 rounded text-[10px] text-cyan-300 animate-pulse">
                car: 0.88
              </div>
              <div className="text-center z-10">
                <span className="text-[11px] text-cyan-400 font-bold block">
                  CSI /dev/video0 Stream Active
                </span>
                <span className="text-[10px] text-slate-400">
                  {state.telemetry.fps} FPS • {state.telemetry.inferenceLatencyMs}ms latency
                </span>
              </div>
            </div>
          ) : isLLM ? (
            <div className="w-full h-full bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-hidden text-[11px] leading-relaxed text-cyan-300 font-mono">
              <span className="text-slate-500">{"prompt> Explain edge computing:"}</span>
              <div className="mt-1 text-slate-200">
                "Edge computing brings computation and data storage closer to the devices where it is gathered, rather than relying on a central location thousands of miles away..."
                <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-ping" />
              </div>
            </div>
          ) : isRobotics ? (
            <div className="relative w-full h-full bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
              {/* Radar sweep */}
              <div className="w-20 h-20 rounded-full border border-cyan-500/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border border-cyan-500/50" />
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <span className="absolute bottom-1 right-2 text-[10px] text-cyan-400 font-mono">
                Costmap: 20Hz • Vel: 0.45m/s
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-slate-900 p-2 rounded-lg border border-slate-800 flex flex-col justify-center items-center text-center">
              <span className="text-cyan-400 font-bold text-xs">High-Throughput Workload Active</span>
              <span className="text-slate-400 text-[10px] mt-1 font-mono">
                {state.telemetry.fps} ops/sec • Power: {state.telemetry.powerWatts}W
              </span>
            </div>
          )
        ) : (
          <div className="text-center text-slate-500">
            <Terminal className="w-5 h-5 mx-auto mb-1 text-slate-600" />
            <p className="text-[11px]">Container is {state.status}</p>
            <p className="text-[10px] text-slate-600">Click 'Run' to deploy image and start logs</p>
          </div>
        )}
      </div>

      {/* Terminal Logs Window */}
      <div className="p-3 bg-slate-950 flex-1 flex flex-col min-h-[160px] max-h-[180px]">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-900">
          <span className="font-mono flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-cyan-400" />
            Docker Container Console
          </span>
          <button
            onClick={onOpenShell}
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Launch Shell
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 space-y-1 font-mono text-[10.5px] scrollbar-thin">
          {state.logs.length === 0 ? (
            <div className="text-slate-600 italic py-2">No output recorded yet.</div>
          ) : (
            state.logs.slice(-25).map((log) => (
              <div key={log.id} className="leading-tight flex items-start gap-1.5">
                <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`break-all ${
                  log.level === 'warn'
                    ? 'text-amber-300'
                    : log.level === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'inference'
                    ? 'text-cyan-300'
                    : 'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Card Action Controls Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            id={`btn-stress-${spec.id}`}
            onClick={onToggleStress}
            disabled={!isRunning}
            title="Inject thermal and computational stress test on this device"
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              isStressActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Flame className="w-3 h-3" />
            Stress
          </button>

          <button
            id={`btn-shell-${spec.id}`}
            onClick={onOpenShell}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            Shell Exec
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <button
                id={`btn-restart-${spec.id}`}
                onClick={onRestart}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Restart container"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id={`btn-stop-${spec.id}`}
                onClick={onStop}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-colors"
              >
                <Square className="w-3 h-3 fill-rose-400" />
                Stop
              </button>
            </>
          ) : (
            <button
              id={`btn-start-${spec.id}`}
              onClick={onStart}
              disabled={isBuilding}
              className="flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-white" />
              Run Container
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
