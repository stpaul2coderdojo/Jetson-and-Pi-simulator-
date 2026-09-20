import React from 'react';
import { 
  BarChart3, Zap, Gauge, DollarSign, Award, Check, AlertCircle, 
  Cpu, Activity, Flame, ShieldAlert, Sparkles 
} from 'lucide-react';
import { DeviceId, DeviceSimulationState, DockerConfig } from '../types';
import { DEVICE_SPECS } from '../data/deviceSpecs';

interface ComparisonDashboardProps {
  states: Record<DeviceId, DeviceSimulationState>;
  config: DockerConfig;
  onDeployAll: () => void;
  isAnyRunning: boolean;
}

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
  states,
  config,
  onDeployAll,
  isAnyRunning,
}) => {
  const devices: DeviceId[] = ['orin-nano', 'pi-5', 'thor-nano'];

  const isLLM = config.workload.type === 'llm';
  const throughputUnit = isLLM ? 'tok/s' : 'FPS';

  // Calculate efficiency metrics
  const getFpsPerWatt = (id: DeviceId) => {
    const s = states[id];
    if (s.telemetry.powerWatts <= 0) return 0;
    return Number((s.telemetry.fps / s.telemetry.powerWatts).toFixed(1));
  };

  const getFpsPerDollar = (id: DeviceId) => {
    const spec = DEVICE_SPECS[id];
    const s = states[id];
    return Number((s.telemetry.fps / spec.priceUsd).toFixed(2));
  };

  // Find winners
  const topFpsDevice = devices.reduce((prev, curr) => 
    states[curr].telemetry.fps > states[prev].telemetry.fps ? curr : prev, devices[0]
  );

  const topEfficiencyDevice = devices.reduce((prev, curr) => 
    getFpsPerWatt(curr) > getFpsPerWatt(prev) ? curr : prev, devices[0]
  );

  const topValueDevice = devices.reduce((prev, curr) => 
    getFpsPerDollar(curr) > getFpsPerDollar(prev) ? curr : prev, devices[0]
  );

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Tri-Platform Edge Benchmark & Efficiency Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live side-by-side comparison for workload <strong className="text-cyan-300 font-mono">'{config.workload.modelName}'</strong> ({config.workload.precision})
            </p>
          </div>

          {!isAnyRunning && (
            <button
              onClick={onDeployAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-lg shadow-md transition-all self-start md:self-auto"
            >
              Run Benchmark on All Devices
            </button>
          )}
        </div>

        {/* Winner Badges Bar */}
        {isAnyRunning && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fastest Throughput</span>
                <span className="text-xs font-bold text-white">{DEVICE_SPECS[topFpsDevice].name}</span>
                <span className="text-[11px] text-cyan-400 font-mono block">
                  {states[topFpsDevice].telemetry.fps} {throughputUnit}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Energy Efficiency</span>
                <span className="text-xs font-bold text-white">{DEVICE_SPECS[topEfficiencyDevice].name}</span>
                <span className="text-[11px] text-emerald-400 font-mono block">
                  {getFpsPerWatt(topEfficiencyDevice)} {throughputUnit}/Watt
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Value per Dollar</span>
                <span className="text-xs font-bold text-white">{DEVICE_SPECS[topValueDevice].name}</span>
                <span className="text-[11px] text-amber-400 font-mono block">
                  {getFpsPerDollar(topValueDevice)} {throughputUnit}/$
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {devices.map((id) => {
          const spec = DEVICE_SPECS[id];
          const state = states[id];
          const fpsPerWatt = getFpsPerWatt(id);

          return (
            <div 
              key={id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              style={{ borderTop: `3px solid ${spec.colorAccent}` }}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">{spec.name}</h3>
                    <p className="text-[11px] text-slate-400">{spec.tagline}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    ${spec.priceUsd}
                  </span>
                </div>

                {/* Key Metrics List */}
                <div className="py-4 space-y-3 text-xs">
                  {/* FPS Bar */}
                  <div>
                    <div className="flex justify-between text-slate-300 font-medium mb-1">
                      <span>Throughput</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {state.telemetry.fps} {throughputUnit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (state.telemetry.fps / (states['thor-nano'].telemetry.fps || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Latency */}
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Inference Latency:</span>
                    <span className="font-mono text-white font-bold">{state.telemetry.inferenceLatencyMs} ms</span>
                  </div>

                  {/* Power Draw & Efficiency */}
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Power Draw:</span>
                    <span className="font-mono text-amber-400 font-bold">{state.telemetry.powerWatts} W</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Efficiency ({throughputUnit}/W):</span>
                    <span className="font-mono text-emerald-400 font-bold">{fpsPerWatt}</span>
                  </div>

                  {/* Temperature */}
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Operating Temp:</span>
                    <span className={`font-mono font-bold ${state.telemetry.temperatureC > 78 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {state.telemetry.temperatureC}°C
                    </span>
                  </div>

                  {/* TOPS & Acceleration */}
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Hardware TOPS:</span>
                    <span className="font-mono text-cyan-300 font-bold">{spec.gpu.int8Tops} TOPS</span>
                  </div>

                  {/* Memory Bandwidth */}
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Memory Bandwidth:</span>
                    <span className="font-mono text-indigo-300 font-bold">{spec.memory.bandwidthGbps} GB/s</span>
                  </div>
                </div>
              </div>

              {/* Edge Deployment Fit Verdict */}
              <div className="mt-2 pt-3 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-xl text-xs text-slate-300">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Ideal Edge Use-Case:
                </span>
                {id === 'orin-nano' && (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    🌟 <strong>Balanced Robotics & Autonomous Systems</strong>. Full TensorRT stack, low 10-15W power envelope, and 40 TOPS delivers production-grade vision without battery drain.
                  </p>
                )}
                {id === 'pi-5' && (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    💰 <strong>Cost-Constrained Edge IoT & Light Detection</strong>. Unbeatable $80 price point. Excels at lightweight NCNN/ONNX inference, maker prototypes, and smart sensors.
                  </p>
                )}
                {id === 'thor-nano' && (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    🚀 <strong>Generative AI, Large LLMs & Multimodal Robotics</strong>. 250 TOPS with native FP8 Transformer Engine handles high-resolution vision transformers and local speech effortlessly.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
