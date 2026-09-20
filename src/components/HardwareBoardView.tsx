import React, { useState } from 'react';
import { CircuitBoard, Cpu, HardDrive, Zap, Info, Check, Shield } from 'lucide-react';
import { DeviceId } from '../types';
import { DEVICE_SPECS } from '../data/deviceSpecs';

export const HardwareBoardView: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceId>('orin-nano');
  const spec = DEVICE_SPECS[selectedDevice];

  return (
    <div className="space-y-6">
      {/* Device Selector Buttons */}
      <div className="flex gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
        {(['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).map((id) => {
          const s = DEVICE_SPECS[id];
          const isSelected = selectedDevice === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedDevice(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              style={{ borderBottom: isSelected ? `2px solid ${s.colorAccent}` : '2px solid transparent' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.colorAccent }} />
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Board Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Schematic Canvas representation */}
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-2">
                <CircuitBoard className="w-4 h-4" />
                PCB Top-Down Layout Diagram
              </span>
              <span className="text-slate-500 font-mono">Form Factor: 100mm x 79mm Carrier</span>
            </div>

            {/* Simulated Edge Board PCB Rendering */}
            <div className="my-6 relative bg-slate-900/90 rounded-xl border-2 border-slate-700/60 p-6 shadow-2xl">
              {/* Corner mounting holes */}
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-slate-600 bg-slate-950" />
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-slate-600 bg-slate-950" />
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full border-2 border-slate-600 bg-slate-950" />
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-slate-600 bg-slate-950" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Ports Side */}
                <div className="space-y-3 text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [GbE RJ45 LAN / PoE]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [4x USB 3.2 Gen 2 (10Gbps)]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [DisplayPort 1.4a / HDMI]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [USB-C Power / Debug UART]
                  </div>
                </div>

                {/* Central SoC / Heatsink Module */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-cyan-500/40 text-center shadow-lg relative flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center mb-2">
                    <Cpu className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-white block">{spec.codename}</span>
                  <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
                    {spec.gpu.int8Tops} TOPS Edge Silicon
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1">
                    {spec.memory.capacityGb}GB {spec.memory.type} Unified
                  </span>
                  
                  {/* Fan badge */}
                  <div className="mt-3 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                    Active 4-pin PWM Cooler
                  </div>
                </div>

                {/* Expansion Side */}
                <div className="space-y-3 text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [Dual 2280 M.2 Key M NVMe]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [Dual 2-Lane MIPI CSI-2 Camera]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [40-pin GPIO Expansion Header]
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    [M.2 Key E (Wi-Fi 6E / BT 5.3)]
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                All hardware inputs (such as CSI cameras via <code className="text-cyan-300">/dev/video0</code> and NVIDIA hardware acceleration via <code className="text-cyan-300">--runtime nvidia</code>) are emulated in container runtime.
              </span>
            </div>
          </div>

          {/* Specs Card */}
          <div className="w-full lg:w-96 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3">SoC Architecture Breakdown</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">CPU Cores</span>
                  <span className="font-mono text-white font-semibold">{spec.cpu.cores}x {spec.cpu.model}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Graphics & AI Acceleration</span>
                  <span className="font-mono text-cyan-300 font-semibold">{spec.gpu.model}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tensor / NPU Cores</span>
                  <span className="font-mono text-white font-semibold">
                    {spec.gpu.tensorCores > 0 ? `${spec.gpu.tensorCores} Tensor Cores` : 'None (CPU NEON / Hailo-8L HAT)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Memory Subsystem</span>
                  <span className="font-mono text-indigo-300 font-semibold">
                    {spec.memory.capacityGb}GB {spec.memory.type} @ {spec.memory.bandwidthGbps} GB/s
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Power Range</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {spec.power.idleWatts}W Idle — {spec.power.maxWatts}W Max TDP
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Certified Stack</span>
                  <span className="font-mono text-emerald-300 font-semibold">{spec.os}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Supported Power Profiles
              </h4>
              <div className="space-y-1.5">
                {spec.power.powerModes.map((mode, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{mode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
