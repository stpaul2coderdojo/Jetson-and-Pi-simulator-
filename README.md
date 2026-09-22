# EdgeDocker Sim: Edge AI & Docker Container Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-ARM64%20%7C%20CUDA-emerald.svg)](#hardware-comparison)
[![Devices](https://img.shields.io/badge/Targets-Jetson%20Orin%20Nano%20%7C%20Pi%205%20%7C%20Thor%20Nano-cyan.svg)](#hardware-comparison)
[![Docker](https://img.shields.io/badge/Docker-Multi--Arch%20Edge-blue.svg)](#docker-architecture)
[![Wildlife AI](https://img.shields.io/badge/Specialty-Wildlife%20AI%20%26%20NVIDIA%20DLI-green.svg)](#curated-workloads)

**EdgeDocker Sim** is an interactive edge computing and container simulation dashboard. It simulates, benchmarks, and analyzes the performance of public GitHub repositories running in Docker containers across three distinct ARM64 edge computing architectures:
1. **NVIDIA Jetson Orin Nano Developer Kit (8GB)**
2. **Raspberry Pi 5 (8GB, ARM Cortex-A76)**
3. **NVIDIA Drive / Jetson Thor Nano (Next-Gen 250 TOPS Blackwell Architecture)**

---

## Table of Contents

- [Overview & Capabilities](#overview--capabilities)
- [Target Hardware Comparison](#target-hardware-comparison)
- [Curated GitHub Workloads](#curated-workloads)
  - [Wildlife AI & Biodiversity Conservation](#1-wildlife-ai--biodiversity-conservation)
  - [NVIDIA Workshop & Deep Learning Institute (DLI)](#2-nvidia-workshop--deep-learning-institute-dli)
  - [Edge Vision, Robotics & Local LLMs](#3-edge-vision-robotics--local-llms)
- [Simulation Engine Architecture](#simulation-engine-architecture)
- [Real Hardware Deployment Guide](#real-hardware-deployment-guide)
  - [Deploying to NVIDIA Jetson (Orin Nano / Thor)](#deploying-to-nvidia-jetson)
  - [Deploying to Raspberry Pi 5](#deploying-to-raspberry-pi-5)
- [Local Development & Building](#local-development--building)
- [Documentation Index](#documentation-index)

---

## Overview & Capabilities

Deploying machine learning models and robotic stacks on edge devices presents significant real-world challenges: thermal throttling, limited memory budgets, CUDA driver discrepancies, and distinct accelerator architectures (Tensor Cores vs. CPU NEON SIMD). 

EdgeDocker Sim allows engineers, researchers, and students to:
- **Test Any GitHub Repo**: Clone and analyze any public Git repository or pick from 15+ curated edge AI and robotics repositories.
- **Inspect Generated Dockerfiles & Compose**: Review multi-architecture Dockerfile configurations, entrypoint scripts, and container flags (`--runtime nvidia`, `--privileged`, `--ipc=host`).
- **Simulate Real-Time Telemetry**: Observe live CPU%, GPU%, Tensor Core utilization, memory allocations, power draw (Watts), and thermal dissipation with realistic throttle responses.
- **Stress-Test Cooling Limits**: Apply matrix stress tests to observe thermal throttling when core temperatures surpass critical thresholds (e.g., 85°C on Jetson, 80°C on Pi 5).
- **Side-by-Side Efficiency Metrics**: Compare throughput (FPS, tokens/sec, x-realtime audio), inference latency, FPS/Watt, and FPS/Dollar.

---

## Target Hardware Comparison

| Metric | NVIDIA Jetson Orin Nano (8GB) | Raspberry Pi 5 (8GB) | NVIDIA Thor Nano (Simulated) |
| :--- | :--- | :--- | :--- |
| **SoC Architecture** | Ampere (1024 CUDA Cores + 32 Tensor Cores) | Broadcom BCM2712 (No discrete GPU/NPU) | Blackwell Edge (2048 CUDA + 4th Gen Tensor) |
| **CPU Subsystem** | 6-core Arm Cortex-A78AE @ 1.5 GHz | 4-core Arm Cortex-A76 @ 2.4 GHz | 8-core Arm Neoverse-V3AE @ 2.6 GHz |
| **AI Compute** | **40 TOPS** (Sparse INT8) / 20 TFLOPS (FP16) | **0 TOPS** (CPU SIMD NEON ~0.15 TFLOPS) | **250 TOPS** (Sparse FP4/INT8) / 90 TFLOPS (FP16) |
| **Unified Memory** | 8 GB 128-bit LPDDR5 (68 GB/s) | 8 GB 32-bit LPDDR4X (17 GB/s) | 16 GB 128-bit LPDDR5X (204 GB/s) |
| **Power Budget** | 7W – 15W configurable | 5W – 12W | 15W – 30W |
| **Thermal Limit** | 85°C junction throttle | 80°C package throttle | 90°C thermal envelope |
| **Price Point** | ~$499 USD | ~$80 USD | ~$899 USD (projected) |
| **Hardware Video Codec**| Decode: 4K60 (NVDEC) | HEVC 4K60 decode | 8K60 AV1/NVDEC/NVENC |

---

## Curated GitHub Workloads

EdgeDocker Sim includes 15 ready-to-run configurations with full Dockerfiles, environment variables, and pre-calculated hardware telemetry profiles:

### 1. Wildlife AI & Biodiversity Conservation

| Repository | Organization | Description | Workload Type | Precision |
| :--- | :--- | :--- | :--- | :--- |
| [microsoft/sparrow](https://github.com/microsoft/sparrow) | Microsoft Research | Smart Platform for Acoustic & Remote Wildlife Operations (Solar, Satellite, AudioMoth PAM) | `wildlife` | FP16 / INT8 |
| [agentmorris/megadetector](https://github.com/agentmorris/megadetector) | MegaDetector Project | Camera-trap animal, person, and vehicle edge detector | `wildlife` | FP16 |
| [megadetector/megadetector-acoustic](https://github.com/megadetector/megadetector-acoustic) | Bioacoustics Lab | Bioacoustic Event Detection (AED) & Passive Acoustic Monitoring | `bioacoustic` | FP16 |
| [microsoft/CameraTraps](https://github.com/microsoft/CameraTraps) | Microsoft / PyTorch Wildlife | PyTorch Wildlife end-to-end taxa classification and Darwin Core export | `wildlife` | FP16 |

### 2. NVIDIA Workshop & Deep Learning Institute (DLI)

| Repository | Organization | Description | Workload Type | Precision |
| :--- | :--- | :--- | :--- | :--- |
| [dusty-nv/jetson-inference](https://github.com/dusty-nv/jetson-inference) | NVIDIA DLI | Hello AI World - Jetson inference with TensorRT & video streaming | `vision` | FP16 |
| [NVIDIA-AI-IOT/deepstream_reference_apps](https://github.com/NVIDIA-AI-IOT/deepstream_reference_apps) | NVIDIA AI IOT | Multi-stream real-time video analytics pipeline with NVDEC | `vision` | INT8 |
| [NVIDIA-AI-IOT/jetson-generative-ai-playground](https://github.com/NVIDIA-AI-IOT/jetson-generative-ai-playground) | NVIDIA AI IOT | Llama 3, VILA, and Whisper generative edge pipelines | `llm` | 4-bit AWQ |
| [NVIDIA-ISAAC-ROS/isaac_ros_common](https://github.com/NVIDIA-ISAAC-ROS) | NVIDIA Robotics | Hardware-accelerated ROS 2 packages: Visual SLAM & Nav2 | `robotics` | FP16 |
| [nvidia-dli/dli-learning-materials](https://github.com/nvidia-dli) | NVIDIA DLI | Accelerated computing & RAPIDS cuDF edge notebooks | `compute-benchmark` | FP32 |
| [NVIDIA/TensorRT](https://github.com/NVIDIA/TensorRT) | NVIDIA | Deep learning inference engine and multi-precision benchmark suite | `compute-benchmark` | INT8 / FP16 |

### 3. Edge Vision, Robotics & Local LLMs

| Repository | Organization | Description | Workload Type | Precision |
| :--- | :--- | :--- | :--- | :--- |
| [ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) | Ultralytics | YOLOv8 real-time object detection & edge tracking | `vision` | FP16 |
| [ggerganov/llama.cpp](https://github.com/ggerganov/llama.cpp) | Georgi Gerganov | Llama 3 8B quantized for edge ARM64 + CUDA | `llm` | Q4_K_M |
| [ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp) | Georgi Gerganov | High-performance Whisper speech-to-text inference | `audio` | FP16 |
| [ros-planning/navigation2](https://github.com/ros-planning/navigation2) | ROS 2 Nav2 | Autonomous robot navigation, costmaps & path planning | `robotics` | FP32 |
| [NVIDIA/cuda-samples](https://github.com/NVIDIA/cuda-samples) | NVIDIA | Matrix multiplication (SGEMM/HGEMM) stress test | `compute-benchmark` | FP16 |

---

## Simulation Engine Architecture

The simulation engine is modeled on real physical hardware constraints:

```
┌──────────────────────────────────────────────────────────────┐
│                    User Selected Workload                    │
│      (e.g., MegaDetector Camera Trap / YOLOv8 / Llama.cpp)    │
└──────────────────────────────┬───────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Jetson Orin / Thor    │             │   Raspberry Pi 5      │
│  - CUDA 12.2 / Tensor │             │  - Broadcom BCM2712   │
│  - NVDEC Hardware Acc │             │  - NEON SIMD (CPU)    │
│  - Shared LPDDR5      │             │  - 4-Core ARM Cortex  │
└───────────┬───────────┘             └───────────┬───────────┘
            │                                     │
            ▼                                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   Thermal & Power Model                      │
│ - Ambient Baseline: 38°C - 42°C                              │
│ - Thermal Dissipation: dT = (P_active - P_dissipated) / C_th │
│ - Throttling Trigger: >85°C (Orin), >80°C (Pi 5)             │
│ - Throttling Penalty: -45% to -60% Frequency Scaling         │
└──────────────────────────────────────────────────────────────┘
```

1. **Hardware Power & Thermal Modeling**:
   - Power scales quadratically with clock speed and core utilization ($P = C \cdot V^2 \cdot f + P_{\text{leak}}$).
   - Sustained workloads increase junction temperatures over time based on thermal resistance of stock heatsinks.
   - Throttling events cause realistic drops in frame rate and inference latency spikes.
2. **Inference Latency & Throughput**:
   - Tensor Core acceleration provides 6x–18x speedups over pure CPU execution.
   - Raspberry Pi 5 runs pure ARM NEON SIMD or NCNN/ONNX Runtime CPU backends.
3. **Telemetry Logs**:
   - Workload-specific runtime logs (e.g. bounding box confidence scores for wildlife, token generation for LLMs, acoustic index scores for bioacoustics).

---

## Real Hardware Deployment Guide

Every preset in EdgeDocker Sim includes production-ready Docker configurations. Here is how to run them on physical hardware:

### Deploying to NVIDIA Jetson

1. **Prerequisites**: JetPack 5.1.2 or JetPack 6.0+ installed with `nvidia-container-toolkit`.
2. Verify the NVIDIA Container Runtime:
   ```bash
   docker info | grep -i runtime
   # Should list: Runtimes: nvidia runc
   ```
3. Run the container with NVIDIA runtime access:
   ```bash
   docker run --runtime nvidia --gpus all \
     -it --rm --network=host --ipc=host \
     --device /dev/video0:/dev/video0 \
     -v /tmp/argus_socket:/tmp/argus_socket \
     -e NVIDIA_VISIBLE_DEVICES=all \
     ghcr.io/microsoft/sparrow:latest
   ```

### Deploying to Raspberry Pi 5

1. **Prerequisites**: Raspberry Pi OS (64-bit) or Ubuntu Server 24.04 LTS (ARM64).
2. Install standard Docker Engine:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
3. Run the container using standard `runc` runtime:
   ```bash
   docker run -it --rm --network=host \
     --device /dev/video0:/dev/video0 \
     ghcr.io/agentmorris/megadetector:latest
   ```

---

## Local Development & Building

This repository is built using **React 19, TypeScript, Vite, and Tailwind CSS**.

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/your-username/edge-docker-sim.git
cd edge-docker-sim

# Install dependencies
npm install

# Start the Vite development server (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your web browser.

### Production Build
```bash
npm run build
```
Compiled static assets will be output to the `dist/` directory.

---

## Documentation Index

For deeper guides and technical specifications, explore the `/docs` directory:
- [Hardware Benchmark Matrix & SoC Deep Dive](docs/HARDWARE_BENCHMARKS.md)
- [Wildlife AI & Passive Acoustic Monitoring Guide](docs/WILDLIFE_AI_GUIDE.md)
- [NVIDIA Jetson & DLI Workshops Guide](docs/NVIDIA_WORKSHOPS_GUIDE.md)
- [Edge Docker & Container Best Practices](docs/DOCKER_EDGE_DEPLOYMENT.md)

---

## License

MIT License. Designed for AI developers, robotics engineers, and wildlife conservation researchers.
