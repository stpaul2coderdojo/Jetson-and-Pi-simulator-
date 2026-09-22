# NVIDIA Workshop & Deep Learning Institute (DLI) Edge Guide

This guide covers setting up, containerizing, and running NVIDIA's official workshop, DLI (Deep Learning Institute), and edge AI repositories on NVIDIA Jetson hardware.

---

## 1. Jetson Inference & "Hello AI World"

**Repository**: [dusty-nv/jetson-inference](https://github.com/dusty-nv/jetson-inference)  
**Curriculum**: Getting Started with AI on Jetson Nano / Orin Nano.

### Core Modules:
- `imagenet`: Image recognition using ResNet, MobileNet, EfficientNet.
- `detectnet`: Object detection using SSD-Mobilenet-v2, YOLO, and custom TensorRT engines.
- `segnet`: Semantic segmentation for autonomous navigation.
- `actionnet`: Temporal action recognition.

### Docker Execution with CSI Camera Access:
```bash
docker run --runtime nvidia -it --rm --network host \
  --volume /tmp/argus_socket:/tmp/argus_socket \
  --device /dev/video0 \
  dustynv/jetson-inference:r36.2.0
```

---

## 2. NVIDIA DeepStream SDK

**Repository**: [NVIDIA-AI-IOT/deepstream_reference_apps](https://github.com/NVIDIA-AI-IOT/deepstream_reference_apps)  
**Use Case**: Multi-stream video ingestion, decoding, inference, tracking, and metadata telemetry.

### Architectural Flow:
```
[RTSP / CSI Camera] 
   ──> [NVDEC Hardware Decoder] 
   ──> [nvstreammux (Batching)] 
   ──> [nvinfer (TensorRT Engine)] 
   ──> [nvtracker (NvSORT / DeepSORT)] 
   ──> [nvdsosd (On-Screen Display)] 
   ──> [Kafka / MQTT / RTSP Sink]
```

### Orin Nano DeepStream Capability:
- Concurrently decodes and analyzes up to 4x 1080p30 video streams at INT8 precision within a 12W power envelope.

---

## 3. Jetson Generative AI Playground

**Repository**: [NVIDIA-AI-IOT/jetson-generative-ai-playground](https://github.com/NVIDIA-AI-IOT/jetson-generative-ai-playground)  
**Focus**: Running Vision-Language Models (VLMs), Local LLMs, and Diffusion models on Jetson Orin.

### Supported Models:
- **Llama 3 8B**: 4-bit AWQ quantized for real-time inference (>25 tokens/s on Orin Nano).
- **VILA 1.5 (Vision Language)**: Visual question answering on live camera frames.
- **Whisper & Piper**: Local offline speech-to-text and text-to-speech.

---

## 4. Isaac ROS Hardware-Accelerated Robotics

**Repository**: [NVIDIA-ISAAC-ROS/isaac_ros_common](https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common)  
**Framework**: ROS 2 Humble / Iron with NITROS (NVIDIA Isaac Transport for ROS).

### Highlights:
- Zero-copy IPC: Passes GPU memory pointers between ROS nodes without CPU memory copying.
- **Isaac ROS Visual SLAM**: High-fidelity 6-DOF odometry using stereo cameras and IMU.
- **Isaac ROS Nvblox**: Real-time 3D reconstruction and Euclidean Signed Distance Field (ESDF) generation for obstacle avoidance.
