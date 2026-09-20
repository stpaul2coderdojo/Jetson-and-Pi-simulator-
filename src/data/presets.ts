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
];
