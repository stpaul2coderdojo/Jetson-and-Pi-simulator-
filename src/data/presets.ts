import { GitHubPreset } from '../types';

export const GITHUB_PRESETS: GitHubPreset[] = [
  {
    id: 'yolov8-vision',
    name: 'Ultralytics YOLOv8 Edge Vision',
    repoUrl: 'https://github.com/ultralytics/ultralytics',
    branch: 'main',
    category: 'Computer Vision',
    description: 'High-speed real-time object detection and segmentation optimized for edge cameras using TensorRT, ONNX, and PyTorch.',
    stars: '35.4k',
    recommendedPrecision: 'FP16',
    workloadType: 'vision',
    modelName: 'yolov8n.pt (Nano 3.2M params)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3 as base

# Set edge environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV YOLO_VERBOSE=False

WORKDIR /usr/src/app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    v4l-utils \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

# Clone repository and install ultralytics
RUN git clone --depth 1 https://github.com/ultralytics/ultralytics.git . \\
    && pip install --no-cache-dir -e . onnx onnxruntime-gpu

# Copy startup inference loop script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["yolo", "predict", "model=yolov8n.pt", "source=0", "imgsz=640", "device=0"]`,
    dockerCompose: `version: '3.8'
services:
  yolo-detector:
    build:
      context: .
      dockerfile: Dockerfile
    image: edge-yolov8:latest
    restart: unless-stopped
    runtime: nvidia
    devices:
      - /dev/video0:/dev/video0
      - /dev/nvhost-ctrl:/dev/nvhost-ctrl
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility,video
      - CONF_THRES=0.35
      - IOU_THRES=0.45
    ports:
      - "8080:8080"
    ipc: host`,
    entrypoint: `#!/bin/bash
set -e

echo "[SYSTEM] Initializing Edge Vision Container on $(uname -m)..."
echo "[HARDWARE] Checking CUDA accelerator availability..."

if command -v nvidia-smi &> /dev/null || [ -e /dev/nvhost-ctrl ]; then
  echo "[CUDA] NVIDIA Edge GPU detected. Activating TensorRT acceleration engine..."
  export ACCEL_BACKEND="tensorrt"
else
  echo "[WARN] No CUDA device detected on host. Falling back to ARM64 NEON CPU/OpenVINO backend..."
  export ACCEL_BACKEND="cpu-neon"
fi

echo "[MODEL] Loading model yolov8n (input resolution 640x640)..."
exec "$@"`,
    envVars: {
      MODEL_PRECISION: 'FP16',
      CAMERA_FPS: '60',
      WARMUP_ITERATIONS: '10',
      ENABLE_TENSORRT: '1',
      INFERENCE_BATCH_SIZE: '1',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '135 FPS',
        latency: '7.4 ms',
        notes: 'Accelerated via Ampere TensorRT FP16 plan. Steady 11.2W power draw.',
      },
      'pi-5': {
        fpsOrTokens: '22 FPS (CPU) / 88 FPS (Hailo)',
        latency: '45.2 ms',
        notes: 'CPU NEON vector compute at 100% load on 4 cores. Active cooler fan spins up.',
      },
      'thor-nano': {
        fpsOrTokens: '390 FPS',
        latency: '2.5 ms',
        notes: 'Blackwell 5th gen Tensor Cores with zero-copy unified memory. 18.5W draw.',
      },
    },
  },

  {
    id: 'llama-cpp-edge',
    name: 'Llama.cpp Edge Quantized LLM',
    repoUrl: 'https://github.com/ggerganov/llama.cpp',
    branch: 'master',
    category: 'Edge LLM',
    description: 'Ultra-efficient C/C++ LLM inference engine supporting 4-bit (Q4_K_M) & 8-bit quantized models on embedded ARM64.',
    stars: '72.1k',
    recommendedPrecision: 'INT8',
    workloadType: 'llm',
    modelName: 'DeepSeek-R1-Distill-1.5B-Q4_K_M (1.1GB GGUF)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM ubuntu:22.04 as builder

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    cmake \\
    git \\
    curl \\
    ca-certificates \\
    libgomp1 \\
    && rm -rf /var/lib/apt/lists/*

# Clone llama.cpp
RUN git clone https://github.com/ggerganov/llama.cpp.git .

# Build with CUDA or ARM NEON depending on available arch
ARG LLAMA_CUDA=1
RUN if [ "$LLAMA_CUDA" = "1" ] && [ -d "/usr/local/cuda" ]; then \\
      cmake -B build -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="87;90" && cmake --build build --config Release -j$(nproc); \\
    else \\
      cmake -B build -DGGML_BLAS=OFF -DGGML_NATIVE=OFF && cmake --build build --config Release -j$(nproc); \\
    fi

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["./build/bin/llama-server", "-m", "models/deepseek-1.5b-q4.gguf", "-c", "2048", "--host", "0.0.0.0", "--port", "8080"]`,
    dockerCompose: `version: '3.8'
services:
  llm-server:
    build: .
    image: edge-llama-cpp:latest
    runtime: nvidia
    environment:
      - N_GPU_LAYERS=35
      - N_THREADS=6
      - CONTEXT_SIZE=2048
    ports:
      - "8080:8080"
    shm_size: '2gb'`,
    entrypoint: `#!/bin/bash
set -e
echo "[LLAMA.CPP] Initializing Edge LLM Server on $(uname -m)..."
echo "[MEMORY] Checking available system RAM for 1.1GB GGUF weights..."
free -h
exec "$@"`,
    envVars: {
      N_GPU_LAYERS: '33',
      N_THREADS: '6',
      CONTEXT_LENGTH: '2048',
      QUANT_SCHEME: 'Q4_K_M',
      TEMPERATURE: '0.6',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '28.4 tok/sec',
        latency: '35 ms / tok',
        notes: 'Full 33 layers offloaded to Ampere GPU. Fits well in 8GB unified memory.',
      },
      'pi-5': {
        fpsOrTokens: '7.8 tok/sec',
        latency: '128 ms / tok',
        notes: 'All 4 Cortex-A76 cores utilized via ARM NEON SIMD. Bandwidth limited (17 GB/s).',
      },
      'thor-nano': {
        fpsOrTokens: '74.2 tok/sec',
        latency: '13.4 ms / tok',
        notes: 'FP8/INT4 Blackwell acceleration + 136 GB/s memory bandwidth delivers lightning tokens.',
      },
    },
  },

  {
    id: 'whisper-edge-asr',
    name: 'Whisper.cpp Real-Time Speech ASR',
    repoUrl: 'https://github.com/ggerganov/whisper.cpp',
    branch: 'master',
    category: 'Speech & Audio',
    description: 'High-performance on-device automatic speech recognition for edge robotics, smart microphones, and embedded audio pipelines.',
    stars: '39.8k',
    recommendedPrecision: 'INT8',
    workloadType: 'audio',
    modelName: 'whisper-base.en (74M params)',
    dockerfile: `FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /whisper

RUN apt-get update && apt-get install -y --no-install-recommends \\
    git build-essential cmake alsa-utils libasound2-dev curl ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/ggerganov/whisper.cpp.git . \\
    && bash ./models/download-ggml-model.sh base.en \\
    && cmake -B build && cmake --build build --config Release -j$(nproc)

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["./build/bin/whisper-stream", "-m", "models/ggml-base.en.bin", "--step", "500", "--length", "3000"]`,
    dockerCompose: `version: '3.8'
services:
  whisper-asr:
    build: .
    image: edge-whisper:latest
    devices:
      - /dev/snd:/dev/snd
    environment:
      - AUDIO_SAMPLE_RATE=16000
      - LANGUAGE=en`,
    entrypoint: `#!/bin/bash
set -e
echo "[WHISPER] Audio stream processor loaded on $(uname -m)..."
echo "[AUDIO] Microphones listening on /dev/snd..."
exec "$@"`,
    envVars: {
      MODEL: 'base.en',
      STEP_MS: '500',
      BEAM_SIZE: '1',
      LANGUAGE: 'en',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '4.2x real-time',
        latency: '42 ms chunk',
        notes: 'CUDA accelerated encoder and beam search decoder.',
      },
      'pi-5': {
        fpsOrTokens: '1.8x real-time',
        latency: '110 ms chunk',
        notes: 'Cortex-A76 NEON vector compute handles real-time audio comfortably.',
      },
      'thor-nano': {
        fpsOrTokens: '14.5x real-time',
        latency: '11 ms chunk',
        notes: 'Sub-frame transcription latency; instant keyword spotting.',
      },
    },
  },

  {
    id: 'ros2-nav2-slam',
    name: 'ROS 2 Humble Nav2 Edge Robot Node',
    repoUrl: 'https://github.com/ros-planning/navigation2',
    branch: 'humble',
    category: 'Robotics',
    description: 'Autonomous Mobile Robot (AMR) navigation stack integrating LiDAR SLAM, costmaps, path planning, and obstacle avoidance.',
    stars: '2.8k',
    recommendedPrecision: 'FP32',
    workloadType: 'robotics',
    modelName: 'Nav2 Costmap + DWB Controller + Cartographer SLAM',
    dockerfile: `FROM ros:humble-ros-base

ENV DEBIAN_FRONTEND=noninteractive
ENV RMW_IMPLEMENTATION=rmw_cyclonedds_cpp

RUN apt-get update && apt-get install -y --no-install-recommends \\
    ros-humble-navigation2 \\
    ros-humble-nav2-bringup \\
    ros-humble-cartographer-ros \\
    ros-humble-cyclonedds \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /ros2_ws
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["ros2", "launch", "nav2_bringup", "bringup_launch.py", "use_sim_time:=True"]`,
    dockerCompose: `version: '3.8'
services:
  nav2-stack:
    build: .
    image: edge-ros2-nav2:latest
    network_mode: host
    privileged: true
    ipc: host
    environment:
      - ROS_DOMAIN_ID=42
      - CYCLONEDDS_URI=/etc/cyclonedds.xml`,
    entrypoint: `#!/bin/bash
set -e
source /opt/ros/humble/setup.bash
echo "[ROS2] ROS 2 Humble Navigation 2 Stack initialized..."
echo "[DDS] CycloneDDS discovery domain 42 active."
exec "$@"`,
    envVars: {
      ROS_DOMAIN_ID: '42',
      UPDATE_FREQUENCY_HZ: '20',
      GLOBAL_COSTMAP_SIZE: '100x100m',
      LOCAL_PLANNER: 'DWB',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '20 Hz control loop',
        latency: '8 ms plan compute',
        notes: 'CUDA point cloud downsampling and fast costmap ray-tracing.',
      },
      'pi-5': {
        fpsOrTokens: '12 Hz control loop',
        latency: '34 ms plan compute',
        notes: 'CPU handles 2D LiDAR SLAM, but high memory bus traffic under large costmaps.',
      },
      'thor-nano': {
        fpsOrTokens: '50 Hz control loop',
        latency: '2.1 ms plan compute',
        notes: 'Handles dual 3D LiDAR + multi-camera surround perception simultaneously.',
      },
    },
  },

  {
    id: 'cuda-benchmark-stress',
    name: 'PyTorch Edge Matrix & GEMM Stress Benchmark',
    repoUrl: 'https://github.com/pytorch/benchmark',
    branch: 'main',
    category: 'Benchmark',
    description: 'High-stress edge compute benchmark evaluating FP16, FP8, and INT8 matrix multiplies, memory bandwidth saturation, and thermal stability.',
    stars: '1.4k',
    recommendedPrecision: 'FP16',
    workloadType: 'compute-benchmark',
    modelName: 'Dense FP16 GEMM 4096x4096x4096 + Conv2D Bench',
    dockerfile: `FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

WORKDIR /benchmark
RUN pip install --no-cache-dir psutil tabulate

COPY <<EOF /benchmark/bench.py
import torch, time, psutil, os

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"[BENCHMARK] Device initialized: {device}")
if device == 'cuda':
    print(f"[CUDA] Device Name: {torch.cuda.get_device_name(0)}")
    print(f"[CUDA] Compute Capability: {torch.cuda.get_device_capability(0)}")

# Run repeated matrix multiplications
size = 2048
a = torch.randn(size, size, device=device, dtype=torch.float16 if device=='cuda' else torch.float32)
b = torch.randn(size, size, device=device, dtype=torch.float16 if device=='cuda' else torch.float32)

print("[BENCHMARK] Starting continuous GEMM stress loop...")
while True:
    t0 = time.time()
    for _ in range(50):
        c = torch.matmul(a, b)
    if device == 'cuda':
        torch.cuda.synchronize()
    dt = time.time() - t0
    tflops = (50 * 2 * (size**3) / dt) / 1e12
    print(f"[METRIC] GEMM 50-batch: {dt*1000:.1f}ms | Compute: {tflops:.2f} TFLOPS | CPU: {psutil.cpu_percent()}%")
    time.sleep(0.1)
EOF

ENTRYPOINT ["python3", "/benchmark/bench.py"]`,
    dockerCompose: `version: '3.8'
services:
  stress-bench:
    build: .
    image: edge-cuda-bench:latest
    runtime: nvidia
    restart: always`,
    entrypoint: `#!/bin/bash
exec python3 /benchmark/bench.py`,
    envVars: {
      BENCHMARK_DTYPE: 'float16',
      MATRIX_SIZE: '2048',
      STRESS_DURATION_SEC: '300',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '5.8 TFLOPS FP16',
        latency: '18 ms / cycle',
        notes: 'Ampere Tensor Cores at 98% utilization. Power peaks at 14.8W.',
      },
      'pi-5': {
        fpsOrTokens: '0.12 TFLOPS (CPU NEON)',
        latency: '820 ms / cycle',
        notes: 'CPU 4-core saturated. VideoCore does not support PyTorch CUDA tensors.',
      },
      'thor-nano': {
        fpsOrTokens: '34.2 TFLOPS FP8/FP16',
        latency: '2.8 ms / cycle',
        notes: 'Blackwell 5th Gen Tensor Cores with NVLink-C2C memory pump. 26.5W draw.',
      },
    },
  },

  {
    id: 'microsoft-sparrow',
    name: 'Microsoft SPARROW (Solar Wildlife Node)',
    repoUrl: 'https://github.com/microsoft/SPARROW',
    branch: 'main',
    category: 'Wildlife AI',
    description: 'Autonomous solar-powered edge AI node by Microsoft AI for Good Lab. Combines camera traps, AudioMoth acoustic sensors, and LEO satellite uplinks for unattended conservation.',
    stars: '1.8k',
    recommendedPrecision: 'FP16',
    workloadType: 'wildlife',
    modelName: 'SPARROW Dual-Edge (MegaDetector v5 + AudioMoth AED)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3 as base

ENV DEBIAN_FRONTEND=noninteractive
ENV SPARROW_MODE=autonomous_field
ENV SOLAR_POWER_MGMT=enabled

WORKDIR /opt/sparrow

# Install system dependencies for camera traps & AudioMoth PAM
RUN apt-get update && apt-get install -y --no-install-recommends \\
    alsa-utils \\
    libasound2-dev \\
    ffmpeg \\
    v4l-utils \\
    libgeos-dev \\
    && rm -rf /var/lib/apt/lists/*

# Clone Microsoft SPARROW repo and install edge dependencies
RUN git clone --depth 1 https://github.com/microsoft/SPARROW.git . \\
    && pip install --no-cache-dir \\
       Pytorch-Wildlife \\
       onnxruntime-gpu \\
       pyserial \\
       scipy \\
       soundfile

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python3", "-m", "sparrow.orchestrator", "--solar-budget=15W", "--sat-uplink=auto"]`,
    dockerCompose: `version: '3.8'
services:
  sparrow-node:
    build: .
    image: edge-sparrow:latest
    restart: always
    runtime: nvidia
    devices:
      - /dev/video0:/dev/video0
      - /dev/snd:/dev/snd
      - /dev/ttyUSB0:/dev/ttyUSB0 # Satellite transmitter (Swarm/Starlink)
    environment:
      - POWER_PROFILE=solar_autonomous
      - BURST_MODE=motion_trigger
      - AUDIO_SAMPLE_RATE_HZ=32000
    ipc: host`,
    entrypoint: `#!/bin/bash
set -e
echo "[SPARROW] Initializing Microsoft SPARROW Edge Field Node on $(uname -m)..."
echo "[POWER] Verifying solar harvester and LiFePO4 battery BMS telemetry..."
echo "[SENSORS] Camera trap PIR sensor and AudioMoth microphone active..."
echo "[AI] Loading MegaDetector v5a and bioacoustic AED pipeline..."
exec "$@"`,
    envVars: {
      SOLAR_POWER_BUDGET_W: '15.0',
      BURST_CAPTURE_FPS: '30',
      AUDIO_WINDOW_SEC: '3.0',
      LEO_SAT_UPLINK_FREQ_MIN: '15',
      EDGE_FILTER_CONFIDENCE: '0.75',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '68 FPS / 8.5x Audio',
        latency: '14.7 ms / frame',
        notes: 'Processes both 4K camera burst and 32kHz continuous audio within 10W solar budget.',
      },
      'pi-5': {
        fpsOrTokens: '14 FPS / 3.2x Audio',
        latency: '71.4 ms / frame',
        notes: 'CPU NEON vector compute handles periodic PIR triggers; higher power draw per inference.',
      },
      'thor-nano': {
        fpsOrTokens: '210 FPS / 28x Audio',
        latency: '4.7 ms / frame',
        notes: 'Can monitor up to 4 high-res camera traps + multi-channel microphone array simultaneously.',
      },
    },
  },

  {
    id: 'megadetector-wildlife',
    name: 'MegaDetector v5/v6 (Camera Trap AI)',
    repoUrl: 'https://github.com/agentmorris/MegaDetector',
    branch: 'main',
    category: 'Wildlife AI',
    description: 'The global standard camera trap model identifying animals, people, vehicles, and empty frames across multi-terabyte conservation field surveys.',
    stars: '2.4k',
    recommendedPrecision: 'FP16',
    workloadType: 'wildlife',
    modelName: 'MegaDetector v5a (YOLOv5x-based 1280px)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace/megadetector

RUN apt-get update && apt-get install -y --no-install-recommends \\
    libgl1-mesa-glx libglib2.0-0 ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/agentmorris/MegaDetector.git . \\
    && pip install --no-cache-dir \\
       ultralytics \\
       onnxruntime-gpu \\
       Pytorch-Wildlife \\
       timm

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python3", "run_detector_batch.py", "md_v5a.0.0.pt", "/data/images", "/data/output.json", "--output_relative_filenames"]`,
    dockerCompose: `version: '3.8'
services:
  megadetector:
    build: .
    image: edge-megadetector:latest
    runtime: nvidia
    volumes:
      - /data/trap_sdcard:/data/images
      - /data/results:/data/output
    environment:
      - CONFIDENCE_THRESHOLD=0.2
      - EXCLUDE_EMPTY_FRAMES=1`,
    entrypoint: `#!/bin/bash
set -e
echo "[MEGADETECTOR] Starting camera trap AI triage engine..."
echo "[MODEL] MegaDetector v5a (1280x1280 high-res camera trap resolution)..."
exec "$@"`,
    envVars: {
      MODEL_VERSION: 'v5a.0.0',
      INPUT_IMG_SIZE: '1280',
      CONFIDENCE_THRESHOLD: '0.25',
      BATCH_SIZE: '1',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '52 FPS (1280px)',
        latency: '19.2 ms',
        notes: 'High accuracy at 1280px resolution with TensorRT FP16 plan. Eliminates 88% empty frames.',
      },
      'pi-5': {
        fpsOrTokens: '8.4 FPS (1280px)',
        latency: '119 ms',
        notes: 'ARM NEON SIMD processing. Best suited for offline SD card batch triage in field camps.',
      },
      'thor-nano': {
        fpsOrTokens: '185 FPS (1280px)',
        latency: '5.4 ms',
        notes: 'Massive throughput for instant real-time live video streams in anti-poaching towers.',
      },
    },
  },

  {
    id: 'megadetector-acoustic',
    name: 'MegaDetector Acoustic (Bioacoustics PAM)',
    repoUrl: 'https://github.com/kitzeslab/opensoundscape',
    branch: 'master',
    category: 'Wildlife AI',
    description: 'Automated bioacoustic event detection (AED) and soundscape analysis identifying animal vocalizations (birds, bats, primates) from raw AudioMoth recordings.',
    stars: '1.2k',
    recommendedPrecision: 'FP16',
    workloadType: 'bioacoustic',
    modelName: 'OpenSoundscape ResNet-50 AED (32kHz Mel-Spectrograms)',
    dockerfile: `FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app/bioacoustic

RUN apt-get update && apt-get install -y --no-install-recommends \\
    libsndfile1 \\
    ffmpeg \\
    sox \\
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \\
    opensoundscape \\
    librosa \\
    torchaudio \\
    scipy

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python3", "-m", "opensoundscape.predict", "--audio_dir", "/data/recordings", "--model", "resnet50_aed"]`,
    dockerCompose: `version: '3.8'
services:
  acoustic-aed:
    build: .
    image: edge-bioacoustic:latest
    devices:
      - /dev/snd:/dev/snd
    environment:
      - SAMPLE_RATE=32000
      - SPECTROGRAM_N_FFT=1024
      - HOP_LENGTH=256`,
    entrypoint: `#!/bin/bash
set -e
echo "[BIOACOUSTIC] Initializing Passive Acoustic Monitoring (PAM) system..."
echo "[AUDIO] Processing continuous 32kHz AudioMoth audio streams into Mel-Spectrograms..."
exec "$@"`,
    envVars: {
      SAMPLE_RATE_HZ: '32000',
      WINDOW_LENGTH_SEC: '3.0',
      FREQUENCY_MIN_HZ: '250',
      FREQUENCY_MAX_HZ: '14000',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '18.4x real-time',
        latency: '16.3 ms / 3s clip',
        notes: 'Instant bat and bird vocalization tagging with zero buffer backlog.',
      },
      'pi-5': {
        fpsOrTokens: '4.8x real-time',
        latency: '62.5 ms / 3s clip',
        notes: 'Runs comfortably in real time on 2 CPU cores with low 4.2W power draw.',
      },
      'thor-nano': {
        fpsOrTokens: '65x real-time',
        latency: '3.1 ms / 3s clip',
        notes: 'Capable of monitoring 16 microphone channels concurrently across a reserve.',
      },
    },
  },

  {
    id: 'pytorch-wildlife',
    name: 'Microsoft PyTorch Wildlife (Unified Suite)',
    repoUrl: 'https://github.com/microsoft/PyTorch-Wildlife',
    branch: 'main',
    category: 'Wildlife AI',
    description: 'Microsoft AI for Good Lab unified ecosystem integrating MegaDetector, global taxonomic species classifiers, animal re-ID, and bioacoustics with edge ONNX/TensorRT export.',
    stars: '3.1k',
    recommendedPrecision: 'FP16',
    workloadType: 'wildlife',
    modelName: 'PyTorch-Wildlife Hub (MegaDetector + ODD Taxa Classifier)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace/wildlife

RUN apt-get update && apt-get install -y --no-install-recommends \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    ffmpeg \\
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/microsoft/PyTorch-Wildlife.git . \\
    && pip install --no-cache-dir \\
       Pytorch-Wildlife \\
       gradio \\
       onnxruntime-gpu \\
       timm

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7860
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python3", "-m", "Pytorch_Wildlife.entrypoint", "--server_port=7860", "--server_name=0.0.0.0"]`,
    dockerCompose: `version: '3.8'
services:
  wildlife-hub:
    build: .
    image: edge-pytorch-wildlife:latest
    runtime: nvidia
    ports:
      - "7860:7860"
    environment:
      - DETECTION_MODEL=MegaDetectorV5
      - CLASSIFICATION_MODEL=AmazonRainforestTaxa
      - EXPORT_DARWIN_CORE=1`,
    entrypoint: `#!/bin/bash
set -e
echo "[PYTORCH-WILDLIFE] Microsoft AI for Good Lab Conservation Suite ready..."
echo "[EDGE] Serving Gradio Field Biologist UI at http://0.0.0.0:7860..."
exec "$@"`,
    envVars: {
      MODEL_CHAIN: 'MegaDetector+TaxaClassifier',
      CONFIDENCE_THRESHOLD: '0.2',
      OUTPUT_FORMAT: 'DarwinCore_JSON',
      EXPORT_EDGE_ONNX: '1',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '44 FPS dual-stage',
        latency: '22.7 ms (detect + classify)',
        notes: 'Detects animal bounding box and classifies species in a single unified edge pipeline.',
      },
      'pi-5': {
        fpsOrTokens: '6.2 FPS dual-stage',
        latency: '161 ms (detect + classify)',
        notes: 'Processes full camera trap SD cards overnight while battery powered.',
      },
      'thor-nano': {
        fpsOrTokens: '155 FPS dual-stage',
        latency: '6.4 ms (detect + classify)',
        notes: 'Real-time multi-species tracking and individual animal re-identification.',
      },
    },
  },

  {
    id: 'nvidia-jetson-inference',
    name: 'NVIDIA Jetson Inference (Hello AI World)',
    repoUrl: 'https://github.com/dusty-nv/jetson-inference',
    branch: 'master',
    category: 'NVIDIA Workshop',
    description: 'Official NVIDIA Deep Learning Institute (DLI) hands-on workshop repository for real-time edge vision (detectNet, segNet, poseNet) accelerated with TensorRT.',
    stars: '9.3k',
    recommendedPrecision: 'FP16',
    workloadType: 'vision',
    modelName: 'SSD-Mobilenet-v2 & ResNet-18 (TensorRT Engine)',
    dockerfile: `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /jetson-inference

RUN apt-get update && apt-get install -y --no-install-recommends \\
    git cmake build-essential libgl1-mesa-glx v4l-utils \\
    && rm -rf /var/lib/apt/lists/*

RUN git clone --recursive --depth 1 https://github.com/dusty-nv/jetson-inference.git . \\
    && mkdir build && cd build \\
    && cmake ../ && make -j$(nproc) && make install && ldconfig

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["detectnet", "--model=ssd-mobilenet-v2", "csi://0", "display://0"]`,
    dockerCompose: `version: '3.8'
services:
  jetson-inference:
    build: .
    image: edge-jetson-inference:latest
    runtime: nvidia
    devices:
      - /dev/video0:/dev/video0
    environment:
      - DISPLAY=:0
      - TENSORRT_PRECISION=FP16`,
    entrypoint: `#!/bin/bash
set -e
echo "[NVIDIA DLI] Jetson Inference 'Hello AI World' workshop initializing..."
echo "[TENSORRT] Compiling optimized engine cache for SM $(uname -m)..."
exec "$@"`,
    envVars: {
      MODEL_NAME: 'ssd-mobilenet-v2',
      PRECISION: 'FP16',
      CAMERA_INPUT: 'v4l2:///dev/video0',
      OVERLAY: 'box,labels,conf',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '162 FPS',
        latency: '6.1 ms',
        notes: 'Direct TensorRT execution utilizing hardware video decoders (NVDEC).',
      },
      'pi-5': {
        fpsOrTokens: '26 FPS',
        latency: '38.4 ms',
        notes: 'CPU NEON vector fallback; no TensorRT available on Raspberry Pi.',
      },
      'thor-nano': {
        fpsOrTokens: '480 FPS',
        latency: '2.0 ms',
        notes: 'Peak Blackwell performance running with sub-2 millisecond frame time.',
      },
    },
  },

  {
    id: 'nvidia-deepstream-apps',
    name: 'NVIDIA DeepStream Multi-Sensor Pipeline',
    repoUrl: 'https://github.com/NVIDIA-AI-IOT/deepstream_python_apps',
    branch: 'master',
    category: 'NVIDIA Workshop',
    description: 'NVIDIA DLI workshop framework for multi-stream edge video analytics, GStreamer hardware decoders, NvDCF object tracking, and low-latency inference.',
    stars: '3.8k',
    recommendedPrecision: 'INT8',
    workloadType: 'vision',
    modelName: 'DeepStream 4x 1080p Streams (NvDCF + ResNet10 PGIE)',
    dockerfile: `FROM nvcr.io/nvidia/deepstream-l4t:6.4-samples

WORKDIR /opt/nvidia/deepstream/deepstream/sources/deepstream_python_apps

RUN git clone https://github.com/NVIDIA-AI-IOT/deepstream_python_apps.git . \\
    && cd apps/deepstream-test1 && make

ENTRYPOINT ["python3", "deepstream_test_1.py", "/opt/nvidia/deepstream/deepstream/samples/streams/sample_720p.h264"]`,
    dockerCompose: `version: '3.8'
services:
  deepstream:
    build: .
    image: edge-deepstream:latest
    runtime: nvidia
    environment:
      - STREAM_COUNT=4
      - TRACKER_TYPE=NvDCF`,
    entrypoint: `#!/bin/bash
set -e
echo "[DEEPSTREAM] NVIDIA GStreamer hardware pipeline active..."
echo "[NVDEC] Decoding 4 simultaneous 1080p H.264 streams..."
exec "$@"`,
    envVars: {
      NUM_STREAMS: '4',
      RESOLUTION: '1920x1080',
      TRACKER: 'NvDCF',
      GPU_ID: '0',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '120 FPS (4x30 FPS)',
        latency: '8.3 ms / batch',
        notes: 'NVDEC hardware decoder handles 4 streams in parallel without touching CPU.',
      },
      'pi-5': {
        fpsOrTokens: '18 FPS total',
        latency: '55 ms / frame',
        notes: 'DeepStream is exclusive to NVIDIA Tegra/GPUs; runs under CPU emulation with high overhead.',
      },
      'thor-nano': {
        fpsOrTokens: '480 FPS (16x30 FPS)',
        latency: '2.1 ms / batch',
        notes: 'Massive video analytics appliance handling 16 high-definition camera feeds.',
      },
    },
  },

  {
    id: 'nvidia-generative-ai-edge',
    name: 'NVIDIA Generative AI Edge Examples',
    repoUrl: 'https://github.com/NVIDIA/Generative-AI-Examples',
    branch: 'main',
    category: 'NVIDIA Workshop',
    description: 'NVIDIA workshop examples demonstrating edge RAG, LangChain agents, NeMo Guardrails, and quantized TensorRT-LLM on embedded devices.',
    stars: '6.4k',
    recommendedPrecision: 'FP8',
    workloadType: 'llm',
    modelName: 'NeMo Edge RAG Pipeline + Llama-3.2-3B (TensorRT-LLM)',
    dockerfile: `FROM nvcr.io/nvidia/l4t-tensorrt-llm:r36.2.0

WORKDIR /workspace/nemo-rag
RUN pip install --no-cache-dir langchain langchain-nvidia-ai-endpoints faiss-gpu

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python3", "app.py", "--model", "meta-llama/Llama-3.2-3B-Instruct"]`,
    dockerCompose: `version: '3.8'
services:
  edge-rag:
    build: .
    image: edge-nemo-rag:latest
    runtime: nvidia
    environment:
      - TENSORRT_LLM_MAX_BATCH_SIZE=2
      - QUANT_MODE=FP8`,
    entrypoint: `#!/bin/bash
set -e
echo "[NVIDIA GENAI] NeMo Guardrails & TensorRT-LLM RAG engine initialized..."
exec "$@"`,
    envVars: {
      RAG_CHUNK_SIZE: '512',
      VECTOR_DB: 'faiss-gpu',
      LLM_ENGINE: 'TensorRT-LLM-FP8',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '32.5 tok/sec',
        latency: '30.7 ms / tok',
        notes: 'FP8 KV-cache compression enables large document context in 8GB unified memory.',
      },
      'pi-5': {
        fpsOrTokens: '4.2 tok/sec',
        latency: '238 ms / tok',
        notes: 'CPU vector math struggles with 3B parameter model without dedicated NPU/GPU.',
      },
      'thor-nano': {
        fpsOrTokens: '95.0 tok/sec',
        latency: '10.5 ms / tok',
        notes: 'Blackwell Dual Transformer Engine with native FP8/FP4 yields conversational speeds.',
      },
    },
  },

  {
    id: 'nvidia-isaac-ros',
    name: 'NVIDIA Isaac ROS Autonomous Machines',
    repoUrl: 'https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common',
    branch: 'main',
    category: 'NVIDIA Workshop',
    description: 'Hardware-accelerated ROS 2 packages from the NVIDIA Robotics workshop, featuring cuVSLAM, stereo disparity, and NVBLOX 3D voxel reconstruction.',
    stars: '2.1k',
    recommendedPrecision: 'FP16',
    workloadType: 'robotics',
    modelName: 'Isaac ROS cuVSLAM + NVBLOX 3D Grid Controller',
    dockerfile: `FROM ros:humble-ros-base

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \\
    ros-humble-isaac-ros-visual-slam \\
    ros-humble-isaac-ros-nvblox \\
    ros-humble-isaac-ros-dnn-inference \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces/isaac_ros-dev
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["ros2", "launch", "isaac_ros_visual_slam", "isaac_ros_visual_slam.launch.py"]`,
    dockerCompose: `version: '3.8'
services:
  isaac-ros:
    build: .
    image: edge-isaac-ros:latest
    runtime: nvidia
    network_mode: host
    privileged: true`,
    entrypoint: `#!/bin/bash
set -e
source /opt/ros/humble/setup.bash
echo "[ISAAC ROS] NVIDIA Hardware-Accelerated ROS 2 GEMs ready..."
echo "[VSLAM] cuVSLAM stereo visual odometry streaming at 60 Hz..."
exec "$@"`,
    envVars: {
      CAMERA_TYPE: 'stereolabs_zed2i',
      VOXEL_GRID_RESOLUTION_M: '0.05',
      VSLAM_ODOMETRY_HZ: '60',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '60 Hz SLAM loop',
        latency: '4.2 ms odometry',
        notes: 'Sub-centimeter drift accuracy with GPU stereo rectification.',
      },
      'pi-5': {
        fpsOrTokens: '10 Hz SLAM loop',
        latency: '38 ms odometry',
        notes: 'CPU handles feature extraction at reduced resolution; high CPU utilization.',
      },
      'thor-nano': {
        fpsOrTokens: '120 Hz SLAM loop',
        latency: '1.2 ms odometry',
        notes: 'Full 3D dynamic volumetric obstacle mapping with NVBLOX and LiDAR fusion.',
      },
    },
  },

  {
    id: 'nvidia-dli-notebooks',
    name: 'NVIDIA DLI CUDA & RAPIDS Workshop',
    repoUrl: 'https://github.com/NVDLI/notebooks',
    branch: 'master',
    category: 'NVIDIA Workshop',
    description: 'Official hands-on workshop repository for NVIDIA Deep Learning Institute courses on CUDA C/C++, RAPIDS GPU accelerated data science, and TensorRT.',
    stars: '1.9k',
    recommendedPrecision: 'FP32',
    workloadType: 'compute-benchmark',
    modelName: 'cuDF DataFrame Filter + cuML Random Forest (CUDA 12.2)',
    dockerfile: `FROM nvcr.io/nvidia/rapidsai/rapidsai-core:23.12-cuda12.0-py3.10

WORKDIR /rapids/notebooks
RUN git clone --depth 1 https://github.com/NVDLI/notebooks.git .

ENTRYPOINT ["python3", "-c", "import cudf, cuml; print('[RAPIDS] cuDF and cuML initialized successfully on CUDA device.')"]`,
    dockerCompose: `version: '3.8'
services:
  dli-rapids:
    build: .
    image: edge-dli-rapids:latest
    runtime: nvidia`,
    entrypoint: `#!/bin/bash
set -e
echo "[NVIDIA DLI] Launching accelerated data science benchmark suite..."
exec "$@"`,
    envVars: {
      CUDA_VISIBLE_DEVICES: '0',
      BENCHMARK_ROWS: '1000000',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '14.2x speedup vs CPU',
        latency: '45 ms (1M rows)',
        notes: 'cuDF columnar processing saturates Orin 68 GB/s memory bandwidth.',
      },
      'pi-5': {
        fpsOrTokens: '1.0x baseline (pandas)',
        latency: '640 ms (1M rows)',
        notes: 'Runs standard pandas/scikit-learn on ARM Cortex-A76 cores.',
      },
      'thor-nano': {
        fpsOrTokens: '42x speedup vs CPU',
        latency: '15 ms (1M rows)',
        notes: '136 GB/s LPDDR5X bandwidth crushes data science operations.',
      },
    },
  },

  {
    id: 'nvidia-tensorrt-bench',
    name: 'NVIDIA TensorRT Model Optimizer',
    repoUrl: 'https://github.com/NVIDIA/TensorRT',
    branch: 'main',
    category: 'NVIDIA Workshop',
    description: 'NVIDIA high-performance deep learning inference optimizer, trtexec profiling utilities, and INT8 calibration engine for edge deployment.',
    stars: '10.7k',
    recommendedPrecision: 'INT8',
    workloadType: 'compute-benchmark',
    modelName: 'trtexec INT8 Entropy Calibrated Engine (SM 8.7 / SM 10.0)',
    dockerfile: `FROM nvcr.io/nvidia/l4t-tensorrt:r8.6.2-py3

WORKDIR /workspace/tensorrt

ENTRYPOINT ["trtexec", "--onnx=model.onnx", "--int8", "--calib=calibration.cache", "--avgRuns=100"]`,
    dockerCompose: `version: '3.8'
services:
  trtexec-bench:
    build: .
    image: edge-trtexec:latest
    runtime: nvidia`,
    entrypoint: `#!/bin/bash
set -e
echo "[TENSORRT] Starting trtexec hardware profiling benchmark..."
exec "$@"`,
    envVars: {
      CALIBRATION_METHOD: 'EntropyCalibration2',
      TIMING_CACHE: '/tmp/trtexec.cache',
      PRECISION: 'INT8',
    },
    expectedPerformance: {
      'orin-nano': {
        fpsOrTokens: '40 TOPS INT8',
        latency: '3.8 ms',
        notes: 'Full 40 INT8 TOPS saturation using 32 3rd Gen Tensor Cores.',
      },
      'pi-5': {
        fpsOrTokens: 'N/A (No TensorRT)',
        latency: 'N/A',
        notes: 'TensorRT requires NVIDIA GPU hardware. Alternative: ONNX Runtime OpenVINO EP.',
      },
      'thor-nano': {
        fpsOrTokens: '180 TOPS INT8 / FP8',
        latency: '0.9 ms',
        notes: 'Sub-millisecond inference latency with 64 5th Gen Blackwell Tensor Cores.',
      },
    },
  },
];
