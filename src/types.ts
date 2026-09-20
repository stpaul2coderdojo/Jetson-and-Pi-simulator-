export type DeviceId = 'orin-nano' | 'pi-5' | 'thor-nano';

export type ContainerStatus = 'idle' | 'cloning' | 'building' | 'starting' | 'running' | 'paused' | 'error' | 'completed';

export interface DeviceSpec {
  id: DeviceId;
  name: string;
  codename: string;
  manufacturer: string;
  architecture: string;
  cpu: {
    cores: number;
    model: string;
    clockGhz: number;
    architecture: string;
  };
  gpu: {
    model: string;
    architecture: string;
    cores: number;
    tensorCores: number;
    clockMhz: number;
    fp16Tops: number;
    int8Tops: number;
    fp8Tops?: number;
    hasCuda: boolean;
    hasTensorRT: boolean;
    hasTransformerEngine?: boolean;
    npuAlternative?: string;
  };
  memory: {
    capacityGb: number;
    type: string;
    busWidthBits: number;
    bandwidthGbps: number;
  };
  storage: string;
  power: {
    idleWatts: number;
    typicalWatts: number;
    maxWatts: number;
    powerModes: string[];
    selectedPowerMode: string;
  };
  thermals: {
    ambientC: number;
    idleTempC: number;
    maxSafeTempC: number;
    throttleTempC: number;
    hasActiveFan: boolean;
  };
  os: string;
  dockerEngine: string;
  cudaVersion?: string;
  jetpackVersion?: string;
  priceUsd: number;
  description: string;
  colorAccent: string;
  tagline: string;
}

export interface TelemetryData {
  timestamp: number;
  cpuUsage: number; // 0-100%
  cpuCoresUsage: number[]; // per-core usage
  gpuUsage: number; // 0-100%
  npuUsage?: number;
  tensorCoreUsage: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryBandwidthUsageGbps: number;
  temperatureC: number;
  gpuTempC: number;
  powerWatts: number;
  fanRpm: number;
  isThrottling: boolean;
  inferenceLatencyMs: number;
  fps: number;
  tokensPerSec?: number;
  totalFramesProcessed: number;
}

export interface DockerLogEntry {
  id: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system' | 'build' | 'inference';
  stage?: string;
  message: string;
  level?: 'info' | 'warn' | 'error' | 'success';
}

export interface DockerConfig {
  repoUrl: string;
  branch: string;
  dockerfileContent: string;
  dockerComposeContent: string;
  entrypointScript: string;
  targetImage: string;
  runtimeFlags: {
    nvidiaRuntime: boolean;
    privileged: boolean;
    shmSize: string;
    deviceCamera: boolean;
    networkHost: boolean;
    customArgs: string;
  };
  envVars: Record<string, string>;
  workload: {
    type: 'vision' | 'llm' | 'audio' | 'robotics' | 'compute-benchmark';
    modelName: string;
    precision: 'INT8' | 'FP8' | 'FP16' | 'FP32';
    batchSize: number;
    inputResolution?: string;
    streamInput: 'camera' | 'video' | 'synthetic' | 'prompt';
  };
}

export interface GitHubPreset {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  category: 'Computer Vision' | 'Edge LLM' | 'Speech & Audio' | 'Robotics' | 'Benchmark';
  description: string;
  stars: string;
  recommendedPrecision: 'INT8' | 'FP8' | 'FP16' | 'FP32';
  workloadType: DockerConfig['workload']['type'];
  modelName: string;
  dockerfile: string;
  dockerCompose: string;
  entrypoint: string;
  envVars: Record<string, string>;
  expectedPerformance: {
    'orin-nano': { fpsOrTokens: string; latency: string; notes: string };
    'pi-5': { fpsOrTokens: string; latency: string; notes: string };
    'thor-nano': { fpsOrTokens: string; latency: string; notes: string };
  };
}

export interface DeviceSimulationState {
  deviceId: DeviceId;
  status: ContainerStatus;
  buildProgress: number; // 0-100
  buildStage: string;
  telemetry: TelemetryData;
  telemetryHistory: TelemetryData[];
  logs: DockerLogEntry[];
  lastError?: string;
  containerId: string;
  uptimeSeconds: number;
  benchmarkScore: number;
}
