# Hardware Benchmark Matrix & SoC Deep Dive

This document details the architectural specifications, computational throughput, thermal dissipation dynamics, and memory bandwidth considerations for the three edge hardware architectures simulated in EdgeDocker Sim.

---

## 1. NVIDIA Jetson Orin Nano Developer Kit (8GB)

### Architecture Highlights
- **SoC**: NVIDIA Orin (Ampere architecture)
- **CUDA Cores**: 1024 CUDA cores with 32 3rd-Generation Tensor Cores
- **CPU**: 6-core Arm® Cortex®-A78AE v8.2 64-bit CPU @ 1.5 GHz (1.5 MB L2 + 4 MB L3)
- **AI Performance**: Up to **40 TOPS** (sparse INT8) / 20 TFLOPS (dense FP16)
- **Memory**: 8 GB 128-bit LPDDR5 running at 2133 MHz (68 GB/s unified memory bandwidth)
- **Storage**: M.2 Key M (PCIe Gen4 x4 NVMe)
- **Operating Power**: Configurable via `nvpmodel` between **7W** (Low power) and **15W** (Max performance)

### Hardware Thermal Envelope
- **Maximum Junction Temp ($T_j$)**: 95°C
- **Thermal Throttling Trigger**: 85°C
- **Critical Shutdown**: 102°C
- **Cooling Mechanism**: Active PWM fan with aluminum fin stack. Under sustained full-load GPU GEMM stress without adequate ventilation, the device triggers dynamic clock scaling, dropping frequency from 625 MHz down to 312 MHz.

### Container Runtime Configuration
- Requires NVIDIA Container Toolkit:
  ```bash
  sudo apt-get install -y nvidia-container-toolkit
  sudo systemctl restart docker
  ```
- Uses `--runtime nvidia` to pass through `/dev/nvhost-*`, `/dev/nvmap`, and CUDA driver libraries into the container without rebuilding kernel modules.

---

## 2. Raspberry Pi 5 (8GB)

### Architecture Highlights
- **SoC**: Broadcom BCM2712
- **CPU**: 4-core 64-bit Arm Cortex-A76 processor @ 2.4 GHz (512 KB L2 per core, 2 MB shared L3)
- **GPU**: VideoCore VII @ 800 MHz (Supports OpenGL ES 3.1, Vulkan 1.2 — not supported by standard PyTorch/TensorFlow CUDA backends)
- **AI Compute**: Dedicated NPU is **absent**. Inference is performed via CPU NEON SIMD vector extensions or optional PCIe Hailo-8 M.2 HAT. Pure CPU FP32 throughput is approximately **0.15 TFLOPS**.
- **Memory**: 8 GB 32-bit LPDDR4X-4267 (17.0 GB/s bandwidth)
- **Power Envelope**: 5W idle, up to 12W peak under heavy CPU compilation/inference.

### Thermal Dynamics & Throttling
- **Throttling Threshold**: 80°C (Clock scales from 2.4 GHz down to 1.5 GHz, and down to 1.0 GHz at 85°C).
- **Cooling Recommendation**: Active Cooler (aluminum heatsink with blower fan) is mandatory for continuous Docker inference workloads to avoid severe thermal drops.

---

## 3. NVIDIA Drive / Jetson Thor Nano (Simulated Next-Gen)

### Architecture Highlights
- **SoC**: NVIDIA Thor (Blackwell architecture)
- **GPU**: 2048 Blackwell CUDA Cores with 4th-Gen Transformer & Tensor Engine with native FP4/FP8 support
- **CPU**: 8-core Arm Neoverse-V3AE @ 2.6 GHz
- **AI Performance**: **250 TOPS** (Sparse FP4/INT8) / 90 TFLOPS (FP16)
- **Memory**: 16 GB 128-bit LPDDR5X (204 GB/s unified memory bandwidth)
- **Power Envelope**: 15W to 30W configurable
- **Workload Acceleration**: Native hardware acceleration for Vision-Language Models (VLMs), Transformer KV-cache offloading, and dual 8K AV1 NVDEC encoders.

---

## Benchmark Comparison Table

| Workload | Jetson Orin Nano (8GB) | Raspberry Pi 5 (8GB) | Thor Nano (Next-Gen) |
| :--- | :--- | :--- | :--- |
| **MegaDetector v5 (640x640)** | 58 FPS (17.2 ms) | 8.5 FPS (118 ms) | 195 FPS (5.1 ms) |
| **YOLOv8s Real-Time** | 135 FPS (7.4 ms) | 22 FPS (45.4 ms) | 390 FPS (2.5 ms) |
| **Llama 3 8B (Q4_K_M)** | 28.4 tok/s (35.2 ms) | 7.8 tok/s (128 ms) | 74.2 tok/s (13.4 ms) |
| **Whisper.cpp (Medium)** | 4.2x Realtime (42 ms) | 1.8x Realtime (110 ms)| 14.5x Realtime (11 ms)|
| **Bioacoustic AED (32kHz)** | 18.4x Realtime (16 ms) | 4.8x Realtime (62 ms) | 65.0x Realtime (3.1 ms)|
| **ROS 2 Nav2 Costmaps** | 20 Hz loop (8.2 ms) | 12 Hz loop (34 ms) | 50 Hz loop (2.1 ms) |
| **Power Efficiency (FPS/Watt)**| 11.7 FPS/W | 2.6 FPS/W | 21.1 FPS/W |
| **Value (FPS / Dollar)** | 0.27 FPS/$ | 0.28 FPS/$ | 0.43 FPS/$ |
