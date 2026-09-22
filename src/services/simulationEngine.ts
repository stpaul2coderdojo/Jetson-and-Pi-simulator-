import { DeviceId, DockerConfig, DockerLogEntry, TelemetryData } from '../types';
import { DEVICE_SPECS } from '../data/deviceSpecs';

export class DeviceSimulator {
  private deviceId: DeviceId;
  private config: DockerConfig;
  private tickCount: number = 0;
  private currentTemp: number;
  private currentPower: number;
  private currentFps: number = 0;
  private currentLatency: number = 0;
  private totalFrames: number = 0;
  private isThrottling: boolean = false;
  private stressMode: boolean = false;

  constructor(deviceId: DeviceId, config: DockerConfig) {
    this.deviceId = deviceId;
    this.config = config;
    const spec = DEVICE_SPECS[deviceId];
    this.currentTemp = spec.thermals.idleTempC;
    this.currentPower = spec.power.idleWatts;
  }

  public setStressMode(enabled: boolean) {
    this.stressMode = enabled;
  }

  public getStressMode(): boolean {
    return this.stressMode;
  }

  public updateConfig(config: DockerConfig) {
    this.config = config;
  }

  /**
   * Generates a step during the Docker build process
   */
  public getBuildStepLog(stageIndex: number, totalStages: number): DockerLogEntry {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const spec = DEVICE_SPECS[this.deviceId];

    const buildLogsMap: Record<DeviceId, string[]> = {
      'orin-nano': [
        `[#1] [internal] load build definition from Dockerfile`,
        `[#2] [1/${totalStages}] FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3 (arm64/v8)`,
        `[#2] resolve nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3 done [1.2s]`,
        `[#3] [2/${totalStages}] RUN apt-get update && apt-get install -y --no-install-recommends libgl1-mesa-glx v4l-utils`,
        `[#3] Hit:1 http://ports.ubuntu.com/ubuntu-ports jammy InRelease`,
        `[#3] Setting up NVIDIA Tegra L4T multimedia hardware codecs... done [2.4s]`,
        `[#4] [3/${totalStages}] RUN git clone ${this.config.repoUrl}`,
        `[#4] Cloning into '/usr/src/app' (depth 1)... done [1.1s]`,
        `[#5] [4/${totalStages}] RUN pip install --no-cache-dir ultralytics onnx onnxruntime-gpu`,
        `[#5] Found CUDA 12.2 toolkit. Compiling CUDA extensions for SM 8.7 (Ampere)... done [3.1s]`,
        `[#6] [5/${totalStages}] COPY entrypoint.sh /entrypoint.sh && chmod +x /entrypoint.sh`,
        `[#7] exporting to image (edge-container:latest) [0.8s]`,
        `Successfully built image edge-container:latest (Size: 3.42 GB)`,
      ],
      'pi-5': [
        `[#1] [internal] load build definition from Dockerfile`,
        `[#2] [1/${totalStages}] FROM debian:bookworm-slim (linux/arm64/v8)`,
        `[#2] resolve docker.io/library/debian:bookworm-slim done [0.9s]`,
        `[#3] [2/${totalStages}] RUN apt-get update && apt-get install -y build-essential python3-pip`,
        `[#3] Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]`,
        `[#3] Warning: No NVIDIA CUDA driver detected on Broadcom BCM2712 host. Building with CPU/NEON flags.`,
        `[#4] [3/${totalStages}] RUN git clone ${this.config.repoUrl}`,
        `[#4] Cloning into '/usr/src/app'... done [1.8s]`,
        `[#5] [4/${totalStages}] RUN pip install --no-cache-dir onnxruntime openvino-arm64`,
        `[#5] Building C++ wheels for ARM Cortex-A76 (4 threads)... done [4.6s]`,
        `[#6] [5/${totalStages}] COPY entrypoint.sh /entrypoint.sh`,
        `[#7] exporting to image (edge-container:latest) [1.1s]`,
        `Successfully built image edge-container:latest (Size: 1.18 GB)`,
      ],
      'thor-nano': [
        `[#1] [internal] load build definition from Dockerfile with BuildKit v0.13`,
        `[#2] [1/${totalStages}] FROM nvcr.io/nvidia/l4t-blackwell:r37.0.1-preview (linux/arm64)`,
        `[#2] NVLink-C2C layer caching verified. Zero-copy cache hit [0.3s]`,
        `[#3] [2/${totalStages}] RUN apt-get update && apt-get install -y tensorrt-llm-blackwell`,
        `[#3] Unpacking NVIDIA Blackwell runtime libraries with Transformer Engine v2.0... done [0.9s]`,
        `[#4] [3/${totalStages}] RUN git clone ${this.config.repoUrl}`,
        `[#4] Cloned via 10GbE edge network [0.4s]`,
        `[#5] [4/${totalStages}] RUN pip install --no-cache-dir -e . --extra-index-url https://pypi.nvidia.com`,
        `[#5] Auto-tuning FP8 & FP4 TensorRT engine for SM 10.0 (Blackwell 64 Tensor Cores)... done [1.5s]`,
        `[#6] [5/${totalStages}] COPY entrypoint.sh /entrypoint.sh`,
        `[#7] exporting to image (edge-container:latest) [0.4s]`,
        `Successfully built image edge-container:latest (Size: 4.85 GB)`,
      ],
    };

    const logs = buildLogsMap[this.deviceId];
    const logText = logs[Math.min(stageIndex, logs.length - 1)];

    return {
      id: `build-${this.deviceId}-${stageIndex}-${Date.now()}`,
      timestamp,
      type: 'build',
      stage: `Stage ${Math.min(stageIndex + 1, totalStages)}/${totalStages}`,
      message: logText,
      level: logText.includes('Warning') ? 'warn' : 'info',
    };
  }

  /**
   * Generates container startup logs
   */
  public getStartupLogs(): DockerLogEntry[] {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const spec = DEVICE_SPECS[this.deviceId];

    const entries: DockerLogEntry[] = [
      {
        id: `start-1-${Date.now()}`,
        timestamp,
        type: 'system',
        message: `docker run -d --name edge-worker --restart=always ${this.config.runtimeFlags.nvidiaRuntime && spec.gpu.hasCuda ? '--runtime=nvidia --gpus all' : ''} -v /data:/data edge-container:latest`,
        level: 'info',
      },
      {
        id: `start-2-${Date.now()}`,
        timestamp,
        type: 'stdout',
        message: `[KERNEL] ${spec.os} (${spec.architecture}) initializing container namespace`,
        level: 'info',
      },
    ];

    if (this.deviceId === 'orin-nano') {
      entries.push(
        {
          id: `start-3-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[CUDA] Initialized CUDA Driver 12.2 / L4T R36.3 (Device 0: NVIDIA Tegra Orin Nano)`,
          level: 'success',
        },
        {
          id: `start-4-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[TENSORRT] Loaded engine cache. Precision: ${this.config.workload.precision} | Tensor Cores: 32 active`,
          level: 'info',
        }
      );
    } else if (this.deviceId === 'pi-5') {
      entries.push(
        {
          id: `start-3-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[CPU] Broadcom BCM2712 4-core Cortex-A76 online. Dispatching via ARM NEON SIMD vector pipeline`,
          level: 'info',
        },
        {
          id: `start-4-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[INFO] No CUDA device present. OpenVINO / ONNX-CPU runtime fallback active`,
          level: 'warn',
        }
      );
    } else if (this.deviceId === 'thor-nano') {
      entries.push(
        {
          id: `start-3-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[CUDA] CUDA 13.0 Blackwell Edge (SM 10.0, 64 Tensor Cores, Dual Transformer Engine)`,
          level: 'success',
        },
        {
          id: `start-4-${Date.now()}`,
          timestamp,
          type: 'stdout',
          message: `[BLACKWELL] Native FP8 Transformer Engine enabled. 136.5 GB/s memory bandwidth allocated`,
          level: 'success',
        }
      );
    }

    entries.push({
      id: `start-5-${Date.now()}`,
      timestamp,
      type: 'inference',
      message: `[WORKLOAD] Starting workload loop for model '${this.config.workload.modelName}'...`,
      level: 'info',
    });

    return entries;
  }

  /**
   * Computes one time-step tick of physical telemetry
   */
  public tickTelemetry(): { telemetry: TelemetryData; log?: DockerLogEntry } {
    this.tickCount++;
    const spec = DEVICE_SPECS[this.deviceId];
    const workload = this.config.workload;
    const isStress = this.stressMode;

    let targetCpu = 0;
    let targetGpu = 0;
    let targetTensor = 0;
    let targetFps = 0;
    let targetLatency = 0;
    let memoryBaseMb = 0;
    let powerTargetWatts = 0;
    let targetTokensPerSec = 0;

    // Workload-specific modeling
    if (this.deviceId === 'orin-nano') {
      if (workload.type === 'vision') {
        targetCpu = isStress ? 75 : 38;
        targetGpu = isStress ? 95 : 82;
        targetTensor = isStress ? 98 : 88;
        targetFps = 135;
        targetLatency = 7.4;
        memoryBaseMb = 2450;
        powerTargetWatts = isStress ? 14.8 : 11.2;
      } else if (workload.type === 'llm') {
        targetCpu = isStress ? 85 : 45;
        targetGpu = isStress ? 98 : 92;
        targetTensor = isStress ? 95 : 85;
        targetTokensPerSec = 28.4;
        targetLatency = 35.2;
        targetFps = targetTokensPerSec;
        memoryBaseMb = 4850;
        powerTargetWatts = isStress ? 14.9 : 12.8;
      } else if (workload.type === 'audio') {
        targetCpu = 32;
        targetGpu = 55;
        targetTensor = 60;
        targetFps = 4.2; // x real-time
        targetLatency = 42;
        memoryBaseMb = 1850;
        powerTargetWatts = 8.5;
      } else if (workload.type === 'robotics') {
        targetCpu = 62;
        targetGpu = 72;
        targetTensor = 75;
        targetFps = 20; // Hz
        targetLatency = 8.2;
        memoryBaseMb = 3100;
        powerTargetWatts = 12.1;
      } else if (workload.type === 'wildlife') {
        targetCpu = isStress ? 72 : 40;
        targetGpu = isStress ? 94 : 80;
        targetTensor = isStress ? 96 : 85;
        targetFps = 58;
        targetLatency = 17.2;
        memoryBaseMb = 2650;
        powerTargetWatts = isStress ? 14.2 : 11.5;
      } else if (workload.type === 'bioacoustic') {
        targetCpu = 28;
        targetGpu = 45;
        targetTensor = 50;
        targetFps = 18.4; // x real-time
        targetLatency = 16.3;
        memoryBaseMb = 1750;
        powerTargetWatts = 7.8;
      } else {
        // compute-benchmark
        targetCpu = 78;
        targetGpu = 99;
        targetTensor = 99;
        targetFps = 5.8; // TFLOPS
        targetLatency = 18;
        memoryBaseMb = 3600;
        powerTargetWatts = isStress ? 15.0 : 14.2;
      }
    } else if (this.deviceId === 'pi-5') {
      if (workload.type === 'vision') {
        targetCpu = isStress ? 99 : 88;
        targetGpu = 0; // VideoCore not used for PyTorch
        targetTensor = 0;
        targetFps = 22; // CPU inference
        targetLatency = 45.4;
        memoryBaseMb = 1650;
        powerTargetWatts = isStress ? 11.8 : 8.4;
      } else if (workload.type === 'llm') {
        targetCpu = isStress ? 100 : 96;
        targetGpu = 0;
        targetTensor = 0;
        targetTokensPerSec = 7.8;
        targetLatency = 128.0;
        targetFps = targetTokensPerSec;
        memoryBaseMb = 2950;
        powerTargetWatts = isStress ? 12.0 : 9.5;
      } else if (workload.type === 'audio') {
        targetCpu = 64;
        targetGpu = 0;
        targetTensor = 0;
        targetFps = 1.8;
        targetLatency = 110;
        memoryBaseMb = 1400;
        powerTargetWatts = 6.8;
      } else if (workload.type === 'robotics') {
        targetCpu = 84;
        targetGpu = 0;
        targetTensor = 0;
        targetFps = 12;
        targetLatency = 34;
        memoryBaseMb = 2100;
        powerTargetWatts = 8.9;
      } else if (workload.type === 'wildlife') {
        targetCpu = isStress ? 98 : 86;
        targetGpu = 0;
        targetTensor = 0;
        targetFps = 8.5;
        targetLatency = 118;
        memoryBaseMb = 1920;
        powerTargetWatts = isStress ? 11.5 : 8.6;
      } else if (workload.type === 'bioacoustic') {
        targetCpu = 56;
        targetGpu = 0;
        targetTensor = 0;
        targetFps = 4.8;
        targetLatency = 62.5;
        memoryBaseMb = 1350;
        powerTargetWatts = 5.4;
      } else {
        // compute-benchmark
        targetCpu = 100;
        targetGpu = 0;
        targetTensor = 0;
        targetFps = 0.12;
        targetLatency = 820;
        memoryBaseMb = 1800;
        powerTargetWatts = isStress ? 12.0 : 10.5;
      }
    } else if (this.deviceId === 'thor-nano') {
      if (workload.type === 'vision') {
        targetCpu = isStress ? 45 : 22;
        targetGpu = isStress ? 88 : 65;
        targetTensor = isStress ? 94 : 78;
        targetFps = 390;
        targetLatency = 2.5;
        memoryBaseMb = 3100;
        powerTargetWatts = isStress ? 28.5 : 18.5;
      } else if (workload.type === 'llm') {
        targetCpu = isStress ? 52 : 28;
        targetGpu = isStress ? 95 : 82;
        targetTensor = isStress ? 98 : 88;
        targetTokensPerSec = 74.2;
        targetLatency = 13.4;
        targetFps = targetTokensPerSec;
        memoryBaseMb = 6200;
        powerTargetWatts = isStress ? 29.2 : 22.4;
      } else if (workload.type === 'audio') {
        targetCpu = 15;
        targetGpu = 38;
        targetTensor = 42;
        targetFps = 14.5;
        targetLatency = 11;
        memoryBaseMb = 2100;
        powerTargetWatts = 12.0;
      } else if (workload.type === 'robotics') {
        targetCpu = 35;
        targetGpu = 58;
        targetTensor = 64;
        targetFps = 50;
        targetLatency = 2.1;
        memoryBaseMb = 4300;
        powerTargetWatts = 19.5;
      } else if (workload.type === 'wildlife') {
        targetCpu = isStress ? 42 : 20;
        targetGpu = isStress ? 85 : 62;
        targetTensor = isStress ? 92 : 75;
        targetFps = 195;
        targetLatency = 5.1;
        memoryBaseMb = 3450;
        powerTargetWatts = isStress ? 27.5 : 18.2;
      } else if (workload.type === 'bioacoustic') {
        targetCpu = 12;
        targetGpu = 32;
        targetTensor = 36;
        targetFps = 65; // 65x real-time
        targetLatency = 3.1;
        memoryBaseMb = 2150;
        powerTargetWatts = 10.5;
      } else {
        // compute-benchmark
        targetCpu = 50;
        targetGpu = 99;
        targetTensor = 99;
        targetFps = 34.2;
        targetLatency = 2.8;
        memoryBaseMb = 4900;
        powerTargetWatts = isStress ? 29.8 : 24.5;
      }
    }

    // Apply random natural jitter (+/- 2%)
    const jitter = (Math.random() - 0.5) * 4;
    const cpuUsage = Math.min(100, Math.max(2, Math.round(targetCpu + jitter)));
    const gpuUsage = Math.min(100, Math.max(0, Math.round(targetGpu + (targetGpu > 0 ? jitter : 0))));
    const tensorUsage = Math.min(100, Math.max(0, Math.round(targetTensor + (targetTensor > 0 ? jitter : 0))));

    // Precision scaling effect
    let precisionMultiplier = 1.0;
    if (this.config.workload.precision === 'INT8') {
      precisionMultiplier = 1.25;
    } else if (this.config.workload.precision === 'FP8') {
      precisionMultiplier = this.deviceId === 'thor-nano' ? 1.85 : 1.1;
    } else if (this.config.workload.precision === 'FP32') {
      precisionMultiplier = 0.55;
    }

    // Thermal simulation physics
    // Power generates heat: Delta T ~ (Power - Cooling)
    const coolingEfficiency = spec.thermals.hasActiveFan ? 0.35 : 0.15;
    const tempDelta = (powerTargetWatts * 0.45) - ((this.currentTemp - spec.thermals.ambientC) * coolingEfficiency);
    this.currentTemp = Math.max(spec.thermals.idleTempC, this.currentTemp + tempDelta * 0.15 + (Math.random() - 0.5) * 0.3);

    // Thermal throttling check
    this.isThrottling = this.currentTemp >= spec.thermals.throttleTempC;
    const throttlePenalty = this.isThrottling ? 0.65 : 1.0;

    // Calculate actual FPS & Latency
    this.currentFps = Math.max(0.1, Number(((targetFps * precisionMultiplier * throttlePenalty) + (Math.random() - 0.5) * 2).toFixed(1)));
    this.currentLatency = Math.max(0.5, Number(((targetLatency / (precisionMultiplier * throttlePenalty)) + (Math.random() - 0.5) * 0.3).toFixed(1)));
    this.totalFrames += Math.round(this.currentFps);

    // Power draw dynamic
    this.currentPower = Math.min(spec.power.maxWatts, Math.max(spec.power.idleWatts, Number((powerTargetWatts + (Math.random() - 0.5) * 0.5).toFixed(1))));

    // Fan RPM calculation
    let fanRpm = 0;
    if (spec.thermals.hasActiveFan) {
      if (this.currentTemp > 45) {
        fanRpm = Math.min(6500, Math.round(2000 + (this.currentTemp - 45) * 110));
      } else {
        fanRpm = 1200;
      }
    }

    // Per-core CPU usage array
    const coresCount = spec.cpu.cores;
    const cpuCoresUsage: number[] = [];
    for (let i = 0; i < coresCount; i++) {
      const coreJitter = (Math.random() - 0.5) * 12;
      cpuCoresUsage.push(Math.min(100, Math.max(1, Math.round(cpuUsage + coreJitter))));
    }

    // Memory bandwidth estimate
    const bandwidthUsage = Number(((gpuUsage / 100) * spec.memory.bandwidthGbps * 0.75 + (cpuUsage / 100) * 4.2).toFixed(1));

    const telemetry: TelemetryData = {
      timestamp: Date.now(),
      cpuUsage,
      cpuCoresUsage,
      gpuUsage,
      tensorCoreUsage: tensorUsage,
      memoryUsedMb: Math.round(memoryBaseMb + (Math.random() - 0.5) * 50),
      memoryTotalMb: spec.memory.capacityGb * 1024,
      memoryBandwidthUsageGbps: Math.min(spec.memory.bandwidthGbps, bandwidthUsage),
      temperatureC: Number(this.currentTemp.toFixed(1)),
      gpuTempC: Number((this.currentTemp + (gpuUsage > 50 ? 2.5 : 0)).toFixed(1)),
      powerWatts: this.currentPower,
      fanRpm,
      isThrottling: this.isThrottling,
      inferenceLatencyMs: this.currentLatency,
      fps: this.currentFps,
      tokensPerSec: workload.type === 'llm' ? targetTokensPerSec : undefined,
      totalFramesProcessed: this.totalFrames,
    };

    // Periodically emit a realistic container log line
    let log: DockerLogEntry | undefined;
    if (this.tickCount % 4 === 0) {
      log = this.generateRuntimeLog(telemetry);
    }

    return { telemetry, log };
  }

  private generateRuntimeLog(telemetry: TelemetryData): DockerLogEntry {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const workload = this.config.workload;

    if (this.isThrottling) {
      return {
        id: `log-throttle-${Date.now()}`,
        timestamp,
        type: 'system',
        message: `[THROTTLE ALERT] Core temp ${telemetry.temperatureC}°C exceeded throttle threshold. Scaling frequency down.`,
        level: 'warn',
      };
    }

    if (workload.type === 'vision') {
      const detections = ['person 0.89', 'car 0.94', 'bicycle 0.78', 'dog 0.82', 'traffic light 0.91'];
      const picked = detections[Math.floor(Math.random() * detections.length)];
      return {
        id: `log-vision-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[DETECTION] Frame #${telemetry.totalFramesProcessed}: 640x640 | 1 ${picked} | Latency: ${telemetry.inferenceLatencyMs}ms (${telemetry.fps} FPS)`,
        level: 'info',
      };
    } else if (workload.type === 'llm') {
      const tokens = ['" autonomous', ' robotics', ' perception', ' pipeline', ' running', ' on', ' edge', ' hardware'];
      const tok = tokens[Math.floor(Math.random() * tokens.length)];
      return {
        id: `log-llm-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[TOKEN GEN] Token: '${tok}' | Speed: ${telemetry.tokensPerSec || telemetry.fps} tok/s | KV-Cache: 482MB`,
        level: 'info',
      };
    } else if (workload.type === 'audio') {
      return {
        id: `log-audio-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[ASR STREAM] Decoded 1500ms chunk -> "system check complete, motors armed" | Latency: ${telemetry.inferenceLatencyMs}ms`,
        level: 'info',
      };
    } else if (workload.type === 'robotics') {
      return {
        id: `log-nav2-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[NAV2] Costmap raycast ok (1842 points) | Twist cmd_vel: [vx: 0.45m/s, wz: 0.08rad/s] | Loop: ${telemetry.fps} Hz`,
        level: 'info',
      };
    } else if (workload.type === 'wildlife') {
      const wildlifeEvents = [
        'Animal [conf 0.94, Panthera onca / Jaguar] [bbox: 0.24, 0.31, 0.72, 0.88]',
        'Animal [conf 0.89, Loxodonta africana / African Elephant] [bbox: 0.12, 0.05, 0.85, 0.92]',
        'Animal [conf 0.96, Tapirus bairdii / Baird\'s Tapir] [bbox: 0.35, 0.42, 0.68, 0.79]',
        'Empty frame filtered [conf 0.98 empty] | Trigger saved to conserve storage',
        'Person detected [conf 0.91, Ranger patrol] [bbox: 0.44, 0.21, 0.58, 0.82]',
        'SPARROW solar node: telemetry packet queued via Swarm LEO satellite link',
      ];
      const event = wildlifeEvents[Math.floor(Math.random() * wildlifeEvents.length)];
      return {
        id: `log-wildlife-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[WILDLIFE AI] Frame #${telemetry.totalFramesProcessed}: ${event} | Edge Latency: ${telemetry.inferenceLatencyMs}ms (${telemetry.fps} FPS)`,
        level: event.includes('Empty') ? 'info' : 'success',
      };
    } else if (workload.type === 'bioacoustic') {
      const bioacousticEvents = [
        'AED 32kHz Mel-Spectrogram: Passer domesticus (House Sparrow) vocalization (conf 0.92, 2.4-5.2 kHz)',
        'AudioMoth PAM: Chiroptera echolocation burst (conf 0.88, 28.5 kHz ultrasonic call)',
        'Rainforest acoustic index: BI=7.82, ACI=0.81 (High avian biodiversity score)',
        'AED 3.0s window: Amphibian chorus (conf 0.95, 1.2-2.1 kHz)',
      ];
      const event = bioacousticEvents[Math.floor(Math.random() * bioacousticEvents.length)];
      return {
        id: `log-bioacoustic-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[BIOACOUSTIC] ${event} | Processing: ${telemetry.fps}x real-time (${telemetry.inferenceLatencyMs}ms)`,
        level: 'info',
      };
    } else {
      return {
        id: `log-bench-${Date.now()}`,
        timestamp,
        type: 'inference',
        message: `[BENCHMARK] Matmul FP16 4096: ${telemetry.inferenceLatencyMs}ms | Power: ${telemetry.powerWatts}W | Active: ${telemetry.gpuUsage}%`,
        level: 'info',
      };
    }
  }

  /**
   * Simulates executing a custom terminal command inside the container
   */
  public executeShellCommand(cmd: string, telemetry: TelemetryData): string {
    const trimmed = cmd.trim().toLowerCase();
    const spec = DEVICE_SPECS[this.deviceId];

    if (trimmed === 'tegrastats') {
      if (!spec.gpu.hasCuda) {
        return `bash: tegrastats: command not found (Device is ${spec.name}, tegrastats is NVIDIA Jetson exclusive)`;
      }
      return `RAM ${telemetry.memoryUsedMb}/${telemetry.memoryTotalMb}MB (lfb 112x4MB) SWAP 0/4096MB (cached 0MB) CPU [${telemetry.cpuCoresUsage.map(c => `${c}%@1500`).join(',')}] EMC_FREQ 68%@3199 GR3D_FREQ ${telemetry.gpuUsage}%@${spec.gpu.clockMhz} NVENC 0% APE 150 BPU 0%@0 MTS fg 0% bg 0% AO@${telemetry.temperatureC}C GPU@${telemetry.gpuTempC}C PMIC@${(telemetry.temperatureC - 3).toFixed(1)}C AUX@28C CPU@${telemetry.temperatureC}C thermal@${telemetry.temperatureC}C VDD_IN ${telemetry.powerWatts * 1000}mW/${telemetry.powerWatts * 1000}mW`;
    }

    if (trimmed === 'nvidia-smi') {
      if (!spec.gpu.hasCuda) {
        return `NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver. Make sure that the latest NVIDIA driver is installed and running. (Host CPU: ${spec.cpu.model})`;
      }
      return `+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03             Driver Version: 535.129.03     CUDA Version: ${spec.cudaVersion || '12.2'}     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  ${spec.gpu.model.padEnd(26)} On  | 00000000:00:00.0   Off |                  N/A |
| ${telemetry.fanRpm ? `${Math.round((telemetry.fanRpm / 6500) * 100)}%` : 'N/A '}   ${Math.round(telemetry.temperatureC)}C    P2            ${telemetry.powerWatts}W / ${spec.power.maxWatts}W |    ${telemetry.memoryUsedMb}MiB / ${telemetry.memoryTotalMb}MiB |    ${telemetry.gpuUsage}%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+`;
    }

    if (trimmed.startsWith('vcgencmd')) {
      if (this.deviceId !== 'pi-5') {
        return `bash: vcgencmd: command not found (vcgencmd is specific to Raspberry Pi VideoCore)`;
      }
      return `temp=${telemetry.temperatureC}'C\nfrequency(1)=2400000000\nvolt=0.8800V\nthrottled=${this.isThrottling ? '0x20002 (currently throttled)' : '0x0'}`;
    }

    if (trimmed === 'docker stats' || trimmed === 'docker stats --no-stream') {
      return `CONTAINER ID   NAME          CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O         PIDS
a7c8e9f12d4b   edge-worker   ${telemetry.cpuUsage}.00%   ${telemetry.memoryUsedMb}MiB / ${(telemetry.memoryTotalMb / 1024).toFixed(1)}GiB   ${((telemetry.memoryUsedMb / telemetry.memoryTotalMb) * 100).toFixed(1)}%   124MB / 1.8GB     42MB / 15MB       18`;
    }

    if (trimmed === 'free' || trimmed === 'free -m' || trimmed === 'free -h') {
      return `               total        used        free      shared  buff/cache   available
Mem:            ${spec.memory.capacityGb}Gi       ${(telemetry.memoryUsedMb / 1024).toFixed(1)}Gi       ${((telemetry.memoryTotalMb - telemetry.memoryUsedMb) / 1024).toFixed(1)}Gi       128Mi       1.2Gi       ${((telemetry.memoryTotalMb - telemetry.memoryUsedMb) / 1024).toFixed(1)}Gi
Swap:          4.0Gi          0B       4.0Gi`;
    }

    if (trimmed === 'uname -a') {
      return `Linux edge-node 5.15.136-${this.deviceId === 'pi-5' ? 'v8-16k' : 'tegra'} #1 SMP PREEMPT ${spec.architecture} GNU/Linux`;
    }

    if (trimmed === 'cat /proc/cpuinfo' || trimmed === 'lscpu') {
      return `Architecture:                    ${spec.architecture}
CPU op-mode(s):                  32-bit, 64-bit
Byte Order:                      Little Endian
CPU(s):                          ${spec.cpu.cores}
Model name:                      ${spec.cpu.model}
CPU max MHz:                     ${(spec.cpu.clockGhz * 1000).toFixed(0)} MHz
L1d cache:                       256 KiB
L2 cache:                        1.5 MiB
L3 cache:                        4 MiB`;
    }

    if (trimmed.includes('curl') || trimmed.includes('predict') || trimmed.includes('health')) {
      return `HTTP/1.1 200 OK
Content-Type: application/json
Date: ${new Date().toUTCString()}

{
  "status": "healthy",
  "device": "${spec.name}",
  "model": "${this.config.workload.modelName}",
  "precision": "${this.config.workload.precision}",
  "accelerator": "${spec.gpu.hasCuda ? 'NVIDIA CUDA/TensorRT' : 'ARM NEON CPU'}",
  "inference_latency_ms": ${telemetry.inferenceLatencyMs},
  "current_fps": ${telemetry.fps},
  "uptime_seconds": ${this.tickCount}
}`;
    }

    return `root@edge-node:/app# ${cmd}
[OK] Command executed inside container namespace. Device: ${spec.codename}`;
  }
}
