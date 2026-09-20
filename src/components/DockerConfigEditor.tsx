import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Sliders, Play, Layers } from 'lucide-react';
import { DockerConfig } from '../types';

interface DockerConfigEditorProps {
  isOpen: boolean;
  onClose: () => void;
  config: DockerConfig;
  onSave: (newConfig: DockerConfig) => void;
  onSaveAndRun: (newConfig: DockerConfig) => void;
}

export const DockerConfigEditor: React.FC<DockerConfigEditorProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onSaveAndRun,
}) => {
  const [activeTab, setActiveTab] = useState<'dockerfile' | 'compose' | 'entrypoint' | 'flags' | 'workload'>('dockerfile');
  const [editedConfig, setEditedConfig] = useState<DockerConfig>({ ...config });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (runAfter: boolean = false) => {
    if (runAfter) {
      onSaveAndRun(editedConfig);
    } else {
      onSave(editedConfig);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center">
              <FileCode className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Docker & Hardware Configuration
                <span className="text-[11px] font-normal text-slate-400">({editedConfig.repoUrl})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure container build files, NVIDIA JetPack hooks, and edge runtime parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-slate-950/50">
          <button
            id="tab-dockerfile"
            onClick={() => setActiveTab('dockerfile')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'dockerfile'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-2 border-b-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Dockerfile
          </button>
          <button
            id="tab-compose"
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'compose'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-2 border-b-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            docker-compose.yml
          </button>
          <button
            id="tab-entrypoint"
            onClick={() => setActiveTab('entrypoint')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'entrypoint'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-2 border-b-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            entrypoint.sh
          </button>
          <button
            id="tab-flags"
            onClick={() => setActiveTab('flags')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'flags'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-2 border-b-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Runtime Flags & Devices
          </button>
          <button
            id="tab-workload"
            onClick={() => setActiveTab('workload')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'workload'
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-2 border-b-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Precision & Model Tuning
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[58vh] bg-slate-950">
          {activeTab === 'dockerfile' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">Dockerfile (linux/arm64)</span>
                <button
                  onClick={() => handleCopy(editedConfig.dockerfileContent)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                id="editor-dockerfile"
                value={editedConfig.dockerfileContent}
                onChange={(e) =>
                  setEditedConfig({ ...editedConfig, dockerfileContent: e.target.value })
                }
                rows={16}
                className="w-full bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500 selection:bg-cyan-500/30 leading-relaxed resize-y"
              />
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">docker-compose.yml</span>
                <button
                  onClick={() => handleCopy(editedConfig.dockerComposeContent)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                id="editor-compose"
                value={editedConfig.dockerComposeContent}
                onChange={(e) =>
                  setEditedConfig({ ...editedConfig, dockerComposeContent: e.target.value })
                }
                rows={16}
                className="w-full bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-100 focus:outline-none focus:border-cyan-500 selection:bg-cyan-500/30 leading-relaxed resize-y"
              />
            </div>
          )}

          {activeTab === 'entrypoint' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">entrypoint.sh (Shell bootstrap)</span>
                <button
                  onClick={() => handleCopy(editedConfig.entrypointScript)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                id="editor-entrypoint"
                value={editedConfig.entrypointScript}
                onChange={(e) =>
                  setEditedConfig({ ...editedConfig, entrypointScript: e.target.value })
                }
                rows={16}
                className="w-full bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-amber-100 focus:outline-none focus:border-cyan-500 selection:bg-cyan-500/30 leading-relaxed resize-y"
              />
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Docker Run Hardware Acceleration Flags
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={editedConfig.runtimeFlags.nvidiaRuntime}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        runtimeFlags: {
                          ...editedConfig.runtimeFlags,
                          nvidiaRuntime: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      --runtime nvidia (NVIDIA Container Toolkit)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mounts Tegra GPU, CUDA drivers & TensorRT into Orin Nano & Thor Nano. Automatically skipped on Pi 5.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={editedConfig.runtimeFlags.deviceCamera}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        runtimeFlags: {
                          ...editedConfig.runtimeFlags,
                          deviceCamera: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      --device /dev/video0 (CSI / USB Camera)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Passes video capture device for real-time live vision inference.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={editedConfig.runtimeFlags.privileged}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        runtimeFlags: {
                          ...editedConfig.runtimeFlags,
                          privileged: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      --privileged (Direct GPIO & I2C Access)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Enables container to access hardware bus, tegrastats, and fan PWM controls.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={editedConfig.runtimeFlags.networkHost}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        runtimeFlags: {
                          ...editedConfig.runtimeFlags,
                          networkHost: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      --net=host (Zero Network Overhead)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Crucial for ROS2 DDS discovery and low-latency RTSP video streams.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Shared Memory Size (--shm-size)
                </label>
                <input
                  type="text"
                  value={editedConfig.runtimeFlags.shmSize}
                  onChange={(e) =>
                    setEditedConfig({
                      ...editedConfig,
                      runtimeFlags: {
                        ...editedConfig.runtimeFlags,
                        shmSize: e.target.value,
                      },
                    })
                  }
                  className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  PyTorch DataLoader requires at least 2GB shared memory on edge devices.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'workload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Inference Precision
                  </label>
                  <select
                    value={editedConfig.workload.precision}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        workload: {
                          ...editedConfig.workload,
                          precision: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="INT8">INT8 (Quantized TensorRT / Hailo-8L - Maximum FPS)</option>
                    <option value="FP8">FP8 (Blackwell Transformer Engine Native - Thor Nano)</option>
                    <option value="FP16">FP16 (Standard Ampere Tensor Core Half-Precision)</option>
                    <option value="FP32">FP32 (Single Precision IEEE 754)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={editedConfig.workload.batchSize}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        workload: {
                          ...editedConfig.workload,
                          batchSize: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Model Weights Identifier
                  </label>
                  <input
                    type="text"
                    value={editedConfig.workload.modelName}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        workload: {
                          ...editedConfig.workload,
                          modelName: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Input Stream Simulation
                  </label>
                  <select
                    value={editedConfig.workload.streamInput}
                    onChange={(e) =>
                      setEditedConfig({
                        ...editedConfig,
                        workload: {
                          ...editedConfig.workload,
                          streamInput: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="camera">Live CSI Camera Feed (1080p 60fps)</option>
                    <option value="video">H.264 Video File Stream</option>
                    <option value="synthetic">Synthetic Random Tensors</option>
                    <option value="prompt">Interactive Text Prompt Stream</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApply(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Save Configuration
            </button>
            <button
              onClick={() => handleApply(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Save & Run Build
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
