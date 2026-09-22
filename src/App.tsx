/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { RepoSelector } from './components/RepoSelector';
import { DockerConfigEditor } from './components/DockerConfigEditor';
import { DeviceSimulatorCard } from './components/DeviceSimulatorCard';
import { DeviceDeepDiveModal } from './components/DeviceDeepDiveModal';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { HardwareBoardView } from './components/HardwareBoardView';
import { DocumentationView } from './components/DocumentationView';
import { DEVICE_SPECS } from './data/deviceSpecs';
import { GITHUB_PRESETS } from './data/presets';
import { DeviceSimulator } from './services/simulationEngine';
import { fetchGitHubRepoDetails } from './services/githubService';
import { 
  DeviceId, DeviceSimulationState, DockerConfig, GitHubPreset, TelemetryData 
} from './types';

export default function App() {
  const initialPreset = GITHUB_PRESETS[0];

  // Global Docker configuration
  const [config, setConfig] = useState<DockerConfig>({
    repoUrl: initialPreset.repoUrl,
    branch: initialPreset.branch,
    dockerfileContent: initialPreset.dockerfile,
    dockerComposeContent: initialPreset.dockerCompose,
    entrypointScript: initialPreset.entrypoint,
    targetImage: 'edge-yolov8:latest',
    runtimeFlags: {
      nvidiaRuntime: true,
      privileged: false,
      shmSize: '2gb',
      deviceCamera: true,
      networkHost: false,
      customArgs: '',
    },
    envVars: initialPreset.envVars,
    workload: {
      type: initialPreset.workloadType,
      modelName: initialPreset.modelName,
      precision: initialPreset.recommendedPrecision,
      batchSize: 1,
      streamInput: 'camera',
    },
  });

  // Current view mode: 'tri-screen' | 'comparison' | 'hardware' | 'docs'
  const [viewMode, setViewMode] = useState<'tri-screen' | 'comparison' | 'hardware' | 'docs'>('tri-screen');

  // Modals state
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);
  const [deepDiveDeviceId, setDeepDiveDeviceId] = useState<DeviceId | null>(null);
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [isStressActive, setIsStressActive] = useState(false);

  // Helper to create initial telemetry
  const createInitialTelemetry = (id: DeviceId): TelemetryData => {
    const spec = DEVICE_SPECS[id];
    return {
      timestamp: Date.now(),
      cpuUsage: 2,
      cpuCoresUsage: Array(spec.cpu.cores).fill(2),
      gpuUsage: 0,
      tensorCoreUsage: 0,
      memoryUsedMb: Math.round(spec.memory.capacityGb * 1024 * 0.12),
      memoryTotalMb: spec.memory.capacityGb * 1024,
      memoryBandwidthUsageGbps: 0.5,
      temperatureC: spec.thermals.idleTempC,
      gpuTempC: spec.thermals.idleTempC,
      powerWatts: spec.power.idleWatts,
      fanRpm: spec.thermals.hasActiveFan ? 1200 : 0,
      isThrottling: false,
      inferenceLatencyMs: 0,
      fps: 0,
      totalFramesProcessed: 0,
    };
  };

  // Device simulation states
  const [deviceStates, setDeviceStates] = useState<Record<DeviceId, DeviceSimulationState>>({
    'orin-nano': {
      deviceId: 'orin-nano',
      status: 'idle',
      buildProgress: 0,
      buildStage: '',
      telemetry: createInitialTelemetry('orin-nano'),
      telemetryHistory: [],
      logs: [],
      containerId: 'orin_c8f12a',
      uptimeSeconds: 0,
      benchmarkScore: 0,
    },
    'pi-5': {
      deviceId: 'pi-5',
      status: 'idle',
      buildProgress: 0,
      buildStage: '',
      telemetry: createInitialTelemetry('pi-5'),
      telemetryHistory: [],
      logs: [],
      containerId: 'pi5_e3b97c',
      uptimeSeconds: 0,
      benchmarkScore: 0,
    },
    'thor-nano': {
      deviceId: 'thor-nano',
      status: 'idle',
      buildProgress: 0,
      buildStage: '',
      telemetry: createInitialTelemetry('thor-nano'),
      telemetryHistory: [],
      logs: [],
      containerId: 'thor_7d10ff',
      uptimeSeconds: 0,
      benchmarkScore: 0,
    },
  });

  // Simulator engine instances
  const simulatorsRef = useRef<Record<DeviceId, DeviceSimulator>>({
    'orin-nano': new DeviceSimulator('orin-nano', config),
    'pi-5': new DeviceSimulator('pi-5', config),
    'thor-nano': new DeviceSimulator('thor-nano', config),
  });

  // Update simulators whenever config changes
  useEffect(() => {
    Object.values(simulatorsRef.current).forEach((sim) => sim.updateConfig(config));
  }, [config]);

  // Handle start single device
  const startDevice = useCallback((id: DeviceId) => {
    setDeviceStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'building',
        buildProgress: 5,
        buildStage: 'Analyzing Dockerfile layers...',
        logs: [
          ...prev[id].logs,
          {
            id: `build-start-${Date.now()}`,
            timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
            type: 'system',
            message: `Starting multi-arch Docker build for ${id}...`,
            level: 'info',
          },
        ],
      },
    }));
  }, []);

  // Handle stop single device
  const stopDevice = useCallback((id: DeviceId) => {
    setDeviceStates((prev) => {
      const initialTel = createInitialTelemetry(id);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          status: 'idle',
          buildProgress: 0,
          telemetry: initialTel,
          logs: [
            ...prev[id].logs,
            {
              id: `stop-${Date.now()}`,
              timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
              type: 'system',
              message: `Container stopped by user signal (SIGTERM). Resources released.`,
              level: 'warn',
            },
          ],
        },
      };
    });
  }, []);

  // Handle restart single device
  const restartDevice = useCallback((id: DeviceId) => {
    stopDevice(id);
    setTimeout(() => startDevice(id), 400);
  }, [stopDevice, startDevice]);

  // Deploy on all 3 devices
  const handleDeployAll = useCallback(() => {
    (['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).forEach((id) => {
      startDevice(id);
    });
  }, [startDevice]);

  // Stop all devices
  const handleStopAll = useCallback(() => {
    (['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).forEach((id) => {
      stopDevice(id);
    });
  }, [stopDevice]);

  // Reset all devices
  const handleResetAll = useCallback(() => {
    handleStopAll();
    setIsStressActive(false);
    (['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).forEach((id) => {
      simulatorsRef.current[id].setStressMode(false);
      setDeviceStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          logs: [],
          buildProgress: 0,
          status: 'idle',
          telemetry: createInitialTelemetry(id),
          uptimeSeconds: 0,
        },
      }));
    });
  }, [handleStopAll]);

  // Toggle stress test on a single device
  const toggleStressDevice = useCallback((id: DeviceId) => {
    const sim = simulatorsRef.current[id];
    const newStress = !sim.getStressMode();
    sim.setStressMode(newStress);
    setDeviceStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        logs: [
          ...prev[id].logs,
          {
            id: `stress-${Date.now()}`,
            timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
            type: 'system',
            message: newStress 
              ? `[STRESS] Dense GEMM & Tensor stress injected. TDP limits pushed.`
              : `[STRESS] Stress injection disabled. Returning to nominal workload.`,
            level: newStress ? 'warn' : 'info',
          },
        ],
      },
    }));
  }, []);

  // Toggle stress test on all devices
  const handleToggleStressAll = useCallback(() => {
    const nextStress = !isStressActive;
    setIsStressActive(nextStress);
    (['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).forEach((id) => {
      simulatorsRef.current[id].setStressMode(nextStress);
      setDeviceStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          logs: [
            ...prev[id].logs,
            {
              id: `stress-all-${Date.now()}`,
              timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
              type: 'system',
              message: nextStress
                ? `[CLUSTER STRESS] Synthetic heavy compute stress active on all nodes.`
                : `[CLUSTER STRESS] Cluster stress deactivated.`,
              level: nextStress ? 'warn' : 'info',
            },
          ],
        },
      }));
    });
  }, [isStressActive]);

  // Main simulation heartbeat loop (runs every 600ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceStates((prev) => {
        const next = { ...prev };
        let hasChanges = false;

        (['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).forEach((id) => {
          const dev = next[id];
          const sim = simulatorsRef.current[id];

          // 1. If device is in building state
          if (dev.status === 'building') {
            hasChanges = true;
            // Build speed depends on hardware cores (Thor Nano fastest, Pi 5 slowest)
            const speedIncrement = id === 'thor-nano' ? 24 : id === 'orin-nano' ? 18 : 12;
            const newProgress = Math.min(100, dev.buildProgress + speedIncrement);

            const totalStages = 5;
            const stageIndex = Math.floor((newProgress / 100) * totalStages);
            const buildLog = sim.getBuildStepLog(stageIndex, totalStages);

            if (newProgress >= 100) {
              // Build complete! Start container
              const startupLogs = sim.getStartupLogs();
              next[id] = {
                ...dev,
                status: 'running',
                buildProgress: 100,
                buildStage: 'Container running',
                logs: [...dev.logs, buildLog, ...startupLogs],
                uptimeSeconds: 1,
              };
            } else {
              next[id] = {
                ...dev,
                buildProgress: newProgress,
                buildStage: `Stage ${Math.min(stageIndex + 1, totalStages)}/${totalStages}`,
                logs: [...dev.logs, buildLog],
              };
            }
          }
          // 2. If device is running container
          else if (dev.status === 'running') {
            hasChanges = true;
            const { telemetry, log } = sim.tickTelemetry();
            const newLogs = log ? [...dev.logs, log] : dev.logs;

            next[id] = {
              ...dev,
              telemetry,
              uptimeSeconds: dev.uptimeSeconds + 1,
              logs: newLogs,
            };
          }
        });

        return hasChanges ? next : prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  // Handle Preset selection
  const handleSelectPreset = (preset: GitHubPreset) => {
    setConfig({
      repoUrl: preset.repoUrl,
      branch: preset.branch,
      dockerfileContent: preset.dockerfile,
      dockerComposeContent: preset.dockerCompose,
      entrypointScript: preset.entrypoint,
      targetImage: `edge-${preset.id}:latest`,
      runtimeFlags: {
        nvidiaRuntime: true,
        privileged: false,
        shmSize: '2gb',
        deviceCamera: preset.workloadType === 'vision',
        networkHost: preset.workloadType === 'robotics',
        customArgs: '',
      },
      envVars: preset.envVars,
      workload: {
        type: preset.workloadType,
        modelName: preset.modelName,
        precision: preset.recommendedPrecision,
        batchSize: 1,
        streamInput: preset.workloadType === 'vision' ? 'camera' : 'prompt',
      },
    });
  };

  // Handle custom repo submit
  const handleCustomRepoSubmit = async (url: string) => {
    setIsFetchingRepo(true);
    try {
      const details = await fetchGitHubRepoDetails(url);
      setConfig((prev) => ({
        ...prev,
        repoUrl: details.suggestedConfig.repoUrl || url,
        branch: details.suggestedConfig.branch || 'main',
        dockerfileContent: details.dockerfile,
        dockerComposeContent: details.dockerCompose,
        workload: {
          ...prev.workload,
          ...(details.suggestedConfig.workload || {}),
        },
        envVars: {
          ...prev.envVars,
          ...(details.suggestedConfig.envVars || {}),
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to inspect GitHub repository.');
    } finally {
      setIsFetchingRepo(false);
    }
  };

  // Check running status
  const isAnyRunning = Object.values(deviceStates).some((d) => d.status === 'running');
  const isBuilding = Object.values(deviceStates).some((d) => d.status === 'building');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* App Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onDeployAll={handleDeployAll}
        onStopAll={handleStopAll}
        onResetAll={handleResetAll}
        onToggleStressAll={handleToggleStressAll}
        isAnyRunning={isAnyRunning}
        isBuilding={isBuilding}
        isStressActive={isStressActive}
      />

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* GitHub Repository & Preset Bar */}
        <RepoSelector
          currentConfig={config}
          onSelectPreset={handleSelectPreset}
          onCustomRepoSubmit={handleCustomRepoSubmit}
          onOpenConfigEditor={() => setIsConfigEditorOpen(true)}
          isFetchingRepo={isFetchingRepo}
        />

        {/* View Mode Switching */}
        {viewMode === 'tri-screen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['orin-nano', 'pi-5', 'thor-nano'] as DeviceId[]).map((id) => (
              <DeviceSimulatorCard
                key={id}
                spec={DEVICE_SPECS[id]}
                state={deviceStates[id]}
                config={config}
                onStart={() => startDevice(id)}
                onStop={() => stopDevice(id)}
                onRestart={() => restartDevice(id)}
                onToggleStress={() => toggleStressDevice(id)}
                onOpenShell={() => setDeepDiveDeviceId(id)}
                isStressActive={simulatorsRef.current[id].getStressMode()}
              />
            ))}
          </div>
        )}

        {viewMode === 'comparison' && (
          <ComparisonDashboard
            states={deviceStates}
            config={config}
            onDeployAll={handleDeployAll}
            isAnyRunning={isAnyRunning}
          />
        )}

        {viewMode === 'hardware' && (
          <HardwareBoardView />
        )}

        {viewMode === 'docs' && (
          <DocumentationView />
        )}
      </main>

      {/* Docker Config Editor Modal */}
      <DockerConfigEditor
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        config={config}
        onSave={(newConfig) => setConfig(newConfig)}
        onSaveAndRun={(newConfig) => {
          setConfig(newConfig);
          handleDeployAll();
        }}
      />

      {/* Device Deep Dive Shell Modal */}
      {deepDiveDeviceId && (
        <DeviceDeepDiveModal
          isOpen={Boolean(deepDiveDeviceId)}
          onClose={() => setDeepDiveDeviceId(null)}
          spec={DEVICE_SPECS[deepDiveDeviceId]}
          state={deviceStates[deepDiveDeviceId]}
          config={config}
          onExecuteCommand={(cmd) =>
            simulatorsRef.current[deepDiveDeviceId].executeShellCommand(
              cmd,
              deviceStates[deepDiveDeviceId].telemetry
            )
          }
        />
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Simulating ARM64 edge hardware architectures: NVIDIA Ampere (SM 8.7), Broadcom BCM2712 VideoCore VII, and NVIDIA Blackwell Edge (SM 10.0).
        </p>
      </footer>
    </div>
  );
}
