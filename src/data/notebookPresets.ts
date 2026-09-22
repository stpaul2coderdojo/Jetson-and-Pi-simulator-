import { NotebookDocument } from '../types';

export const NOTEBOOK_PRESETS: NotebookDocument[] = [
  {
    id: 'jetson-orin-tensorrt',
    title: '01_jetson_tensorrt_benchmark.ipynb',
    description: 'NVIDIA Jetson Orin Nano YOLOv8 INT8 calibration, TensorRT engine compilation, and latency profiling.',
    targetHardware: 'orin-nano',
    kernelName: 'Python 3.11 (CUDA 12.2 - JetPack 6.0)',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-22T08:30:00Z',
    cells: [
      {
        id: 'cell-1',
        type: 'markdown',
        source: `# Jetson Orin Nano: TensorRT INT8 Acceleration & Benchmarking
This notebook benchmarks a **YOLOv8n object detection model** running on the **NVIDIA Jetson Orin Nano (40 TOPS)**.
We will inspect CUDA environment variables, compile an FP16/INT8 TensorRT engine using \`trtexec\`, and measure latency, memory allocation, and frames-per-second (FPS).`,
        executionCount: null,
        outputs: [],
      },
      {
        id: 'cell-2',
        type: 'code',
        source: `!nvidia-smi
!jetson_clocks --show
import torch
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available:  {torch.cuda.is_available()}")
print(f"Active Device:   {torch.cuda.get_device_name(0)}")
print(f"Tensor Cores:    Ampere SM 8.7 (32 Tensor Cores)")`,
        executionCount: 1,
        outputs: [
          {
            id: 'out-1',
            type: 'text',
            content: `+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.154.05             Driver Version: 535.154.05    CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                  Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|=========================================+======================+======================|
|   0  Orin (Ampere)                   On | 00000000:00:00.0 Off |                  N/A |
| N/A   44C    P0              6.2W / 15W |    1420MiB / 7860MiB |     12%      Default |
+-----------------------------------------+----------------------+----------------------+
SOC Power Mode: 15W 6-Core (MAXN)
EMC Clock: 2133 MHz | GPU Clock: 625 MHz | CPU Clock: 1510 MHz
PyTorch Version: 2.2.0+nv24.03
CUDA Available:  True
Active Device:   NVIDIA Orin Nano (40 TOPS)
Tensor Cores:    Ampere SM 8.7 (32 Tensor Cores)`,
            executionTimeMs: 142,
          },
        ],
      },
      {
        id: 'cell-3',
        type: 'code',
        source: `import numpy as np
import time

# Simulate ONNX export and TensorRT engine generation
print("Compiling YOLOv8n to TensorRT FP16/INT8 Engine...")
print("[TRT] Loaded ONNX model: yolov8n.onnx (3.2M parameters)")
print("[TRT] Applying layer fusion: Conv+BatchNorm+SiLU -> FusedConvolution")
print("[TRT] Calibrating dynamic ranges with EntropyCalibrator2 across 100 images...")
print("[TRT] Engine serialized: yolov8n_int8.engine (4.8 MB)")`,
        executionCount: 2,
        outputs: [
          {
            id: 'out-2',
            type: 'text',
            content: `Compiling YOLOv8n to TensorRT FP16/INT8 Engine...
[TRT] Loaded ONNX model: yolov8n.onnx (3.2M parameters)
[TRT] Applying layer fusion: Conv+BatchNorm+SiLU -> FusedConvolution
[TRT] Calibrating dynamic ranges with EntropyCalibrator2 across 100 images...
[TRT] Engine serialized: yolov8n_int8.engine (4.8 MB)
[TRT] Optimization completed in 1.48s with 32 Ampere Tensor Cores active.`,
            executionTimeMs: 1480,
          },
        ],
      },
      {
        id: 'cell-4',
        type: 'code',
        source: `# Run 100-iteration inference benchmark loop
latencies = []
batch_size = 1
warmup_runs = 10
test_runs = 50

print(f"Warming up GPU cache with {warmup_runs} iterations...")
# Simulating TensorRT execution timings
mean_latency_ms = 14.2
p95_latency_ms = 16.8
fps = 1000.0 / mean_latency_ms
power_w = 9.4

print(f"Mean Latency: {mean_latency_ms:.2f} ms")
print(f"95th Percentile: {p95_latency_ms:.2f} ms")
print(f"Throughput: {fps:.1f} FPS")
print(f"Efficiency: {fps / power_w:.2f} FPS/Watt")`,
        executionCount: 3,
        outputs: [
          {
            id: 'out-3',
            type: 'table',
            content: `Benchmark Results Summary (YOLOv8n on Jetson Orin Nano)`,
            executionTimeMs: 380,
            tableData: {
              headers: ['Precision', 'Batch Size', 'Mean Latency (ms)', 'P95 Latency (ms)', 'Throughput (FPS)', 'Power (W)', 'FPS / Watt'],
              rows: [
                ['FP32 (PyTorch)', '1', 34.6, 38.2, 28.9, 12.1, 2.39],
                ['FP16 (TensorRT)', '1', 19.8, 22.4, 50.5, 10.8, 4.67],
                ['INT8 (TensorRT)', '1', 14.2, 16.8, 70.4, 9.4, 7.49],
                ['INT8 (Batch 4)', '4', 36.1, 40.5, 110.8, 14.1, 7.86],
              ],
            },
          },
          {
            id: 'out-3-plot',
            type: 'plot',
            content: 'Latency and Throughput Distribution Profile',
            plotType: 'latency',
          },
        ],
      },
      {
        id: 'cell-5',
        type: 'markdown',
        source: `### Key Observations:
- **INT8 TensorRT speedup**: Delivers **2.43x throughput** improvement compared to native FP32 PyTorch.
- **Power Efficiency**: Yields **7.49 FPS/Watt** in 15W mode, well within solar and battery field requirements.
- **Unified Memory**: Jetson's unified LPDDR5 architecture eliminates host-to-device PCIe transfer overheads.`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: 'megadetector-wildlife',
    title: '02_megadetector_wildlife_pipeline.ipynb',
    description: 'Microsoft MegaDetector v5 automated camera trap animal, person, and vehicle triage pipeline.',
    targetHardware: 'orin-nano',
    kernelName: 'Python 3.11 (PyTorch Wildlife - ARM64)',
    createdAt: '2026-09-21T11:00:00Z',
    updatedAt: '2026-09-22T08:45:00Z',
    cells: [
      {
        id: 'cell-1',
        type: 'markdown',
        source: `# Microsoft MegaDetector v5: Edge Wildlife Camera Trap Pipeline
This notebook runs **Microsoft MegaDetector v5a** on edge hardware to triage camera trap images into:
1. \`animal\`
2. \`person\`
3. \`vehicle\`
4. \`empty\` (false trigger discard)`,
        executionCount: null,
        outputs: [],
      },
      {
        id: 'cell-2',
        type: 'code',
        source: `import torch
import torchvision
print("Loading MegaDetector v5a weights: md_v5a.0.0.pt...")
# Model metadata
num_classes = 3
categories = {1: 'animal', 2: 'person', 3: 'vehicle'}
print(f"Categories registered: {categories}")
print(f"Image input resolution: 1280x1280 (Letterbox padding)")`,
        executionCount: 1,
        outputs: [
          {
            id: 'out-md-1',
            type: 'text',
            content: `Loading MegaDetector v5a weights: md_v5a.0.0.pt...
Model loaded: YOLOv5x6 backbone (140.7M parameters)
Categories registered: {1: 'animal', 2: 'person', 3: 'vehicle'}
Image input resolution: 1280x1280 (Letterbox padding)
Using device: cuda:0 (NVIDIA Orin Nano)`,
            executionTimeMs: 290,
          },
        ],
      },
      {
        id: 'cell-3',
        type: 'code',
        source: `# Simulate batch processing of 8 camera trap frames
trap_images = [
    {"frame": "IMG_0042.JPG", "label": "Snow Leopard (Panthera uncia)", "conf": 0.942, "box": [0.24, 0.31, 0.48, 0.52]},
    {"frame": "IMG_0043.JPG", "label": "Ibex (Capra sibirica)", "conf": 0.887, "box": [0.55, 0.40, 0.22, 0.35]},
    {"frame": "IMG_0044.JPG", "label": "Ranger / Person", "conf": 0.965, "box": [0.12, 0.18, 0.30, 0.75]},
    {"frame": "IMG_0045.JPG", "label": "Empty (Wind / Vegetation)", "conf": 0.082, "box": []},
]

print(f"Processed 4 field frames. Filtered 1 empty image (25% false trigger reduction).")`,
        executionCount: 2,
        outputs: [
          {
            id: 'out-md-2',
            type: 'table',
            content: 'MegaDetector Camera Trap Triage Batch',
            executionTimeMs: 410,
            tableData: {
              headers: ['Frame File', 'Classification', 'Confidence', 'Action', 'Inference Latency'],
              rows: [
                ['IMG_0042.JPG', 'Animal (Snow Leopard)', '94.2%', 'Save & Tag GPS', '42.3 ms'],
                ['IMG_0043.JPG', 'Animal (Ibex)', '88.7%', 'Save & Tag GPS', '41.8 ms'],
                ['IMG_0044.JPG', 'Person (Field Ranger)', '96.5%', 'Alert Ops Room', '43.1 ms'],
                ['IMG_0045.JPG', 'Empty (Wind branch)', '8.2%', 'Discard / Save Battery', '39.6 ms'],
              ],
            },
          },
          {
            id: 'out-md-plot',
            type: 'plot',
            content: 'Detection Bounding Box Visualization',
            plotType: 'detection',
          },
        ],
      },
    ],
  },
  {
    id: 'pi5-neon-simd',
    title: '03_pi5_arm_neon_quantization.ipynb',
    description: 'Raspberry Pi 5 Cortex-A76 quad-core INT8 dynamic quantization with ARM NEON SIMD acceleration.',
    targetHardware: 'pi-5',
    kernelName: 'Python 3.11 (Debian Bookworm - ARM64)',
    createdAt: '2026-09-21T14:30:00Z',
    updatedAt: '2026-09-22T08:50:00Z',
    cells: [
      {
        id: 'cell-1',
        type: 'markdown',
        source: `# Raspberry Pi 5: ARM NEON SIMD Optimization & INT8 Quantization
This notebook tests CPU inference on the **Raspberry Pi 5 (Broadcom BCM2712)**:
- 4x ARM Cortex-A76 cores @ 2.4 GHz
- ARMv8.2-A with 128-bit NEON SIMD & Cryptography extensions
- ONNX Runtime with CPU Execution Provider`,
        executionCount: null,
        outputs: [],
      },
      {
        id: 'cell-2',
        type: 'code',
        source: `!lscpu | grep -E "Model name|CPU max MHz|Flags"
import onnxruntime as ort
print(f"ONNX Runtime Version: {ort.__version__}")
print(f"Available Providers:  {ort.get_available_providers()}")
print("Thread pool configured: 4 worker threads (1 per Cortex-A76 core)")`,
        executionCount: 1,
        outputs: [
          {
            id: 'out-pi-1',
            type: 'text',
            content: `Model name:            Cortex-A76
CPU max MHz:           2400.0000
Flags:                 fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp cpuid asimdrdm jscvt fcma lrcpc dcpop sha3 sm3 sm4 asimddp sha512 asimdfhm dit uscat ilrcpc flagm
ONNX Runtime Version:  1.17.1
Available Providers:   ['CPUExecutionProvider']
Thread pool configured: 4 worker threads (1 per Cortex-A76 core)`,
            executionTimeMs: 95,
          },
        ],
      },
      {
        id: 'cell-3',
        type: 'code',
        source: `# Dynamic INT8 Quantization benchmark
print("Evaluating MobileNetV3 / YOLO-Nano on Pi 5 CPU:")
fp32_latency = 68.4
int8_latency = 28.6
speedup = fp32_latency / int8_latency
print(f"FP32 Mean Latency: {fp32_latency} ms (14.6 FPS)")
print(f"INT8 NEON Latency: {int8_latency} ms (34.9 FPS)")
print(f"Speedup via NEON INT8: {speedup:.2f}x")`,
        executionCount: 2,
        outputs: [
          {
            id: 'out-pi-2',
            type: 'table',
            content: 'Raspberry Pi 5 Quantization Comparison',
            executionTimeMs: 210,
            tableData: {
              headers: ['Model Format', 'Precision', 'Latency (ms)', 'FPS', 'CPU Temp (°C)', 'Core Power (W)'],
              rows: [
                ['ONNX Native', 'FP32', 68.4, 14.6, 58.2, 7.8],
                ['ONNX Dynamic', 'INT8 (NEON)', 28.6, 34.9, 62.4, 9.1],
                ['TFLite XNNPACK', 'INT8', 31.2, 32.1, 60.1, 8.5],
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'sparrow-bioacoustic',
    title: '04_sparrow_bioacoustic_inference.ipynb',
    description: 'Microsoft SPARROW acoustic spectrogram analysis and bioacoustic bird call classification.',
    targetHardware: 'thor-nano',
    kernelName: 'Python 3.11 (Audio Transformer - PyTorch)',
    createdAt: '2026-09-22T06:00:00Z',
    updatedAt: '2026-09-22T08:55:00Z',
    cells: [
      {
        id: 'cell-1',
        type: 'markdown',
        source: `# Microsoft SPARROW: Bioacoustic Wildlife Sound Classifier
This notebook runs an **Audio Spectrogram Transformer (AST)** to classify animal vocalizations from field audio recordings (e.g. dawn choruses, bird calls, bat echolocation).`,
        executionCount: null,
        outputs: [],
      },
      {
        id: 'cell-2',
        type: 'code',
        source: `import numpy as np
sample_rate = 32000
duration_sec = 5.0
n_fft = 1024
hop_length = 512
n_mels = 128

print(f"Loaded 5.0s audio clip: 'rainforest_dawn_chorus_003.wav'")
print(f"Sample Rate: {sample_rate} Hz | Total Samples: {int(sample_rate * duration_sec)}")
print(f"Computed Mel-Spectrogram matrix shape: ({n_mels}, {int(sample_rate * duration_sec // hop_length)})")`,
        executionCount: 1,
        outputs: [
          {
            id: 'out-sp-1',
            type: 'text',
            content: `Loaded 5.0s audio clip: 'rainforest_dawn_chorus_003.wav'
Sample Rate: 32000 Hz | Total Samples: 160000
Computed Mel-Spectrogram matrix shape: (128, 312)
Audio FFT range: 50 Hz - 16000 Hz`,
            executionTimeMs: 115,
          },
          {
            id: 'out-sp-plot',
            type: 'plot',
            content: 'Audio Mel-Spectrogram Frequencies (50 Hz - 16 kHz)',
            plotType: 'spectrogram',
          },
        ],
      },
      {
        id: 'cell-3',
        type: 'code',
        source: `# Run Bioacoustic Transformer Inference
detections = [
    {"species": "Great Hornbill (Buceros bicornis)", "confidence": 0.962, "time_window": "1.2s - 2.8s"},
    {"species": "White-handed Gibbon (Hylobates lar)", "confidence": 0.894, "time_window": "0.4s - 4.1s"},
    {"species": "Cicada Background Noise", "confidence": 0.741, "time_window": "0.0s - 5.0s"},
]
print("Audio Transformer Classification Finished:")
for d in detections:
    print(f"  • {d['species']} ({d['time_window']}): {d['confidence']*100:.1f}%")`,
        executionCount: 2,
        outputs: [
          {
            id: 'out-sp-2',
            type: 'table',
            content: 'Detected Bioacoustic Vocalizations',
            executionTimeMs: 82,
            tableData: {
              headers: ['Species Name', 'Vocalization Window', 'Confidence', 'Conservation Status'],
              rows: [
                ['Great Hornbill (Buceros bicornis)', '1.2s - 2.8s', '96.2%', 'Vulnerable (IUCN)'],
                ['White-handed Gibbon (Hylobates lar)', '0.4s - 4.1s', '89.4%', 'Endangered (IUCN)'],
                ['Cicada Background Noise', '0.0s - 5.0s', '74.1%', 'Ambient Insecta'],
              ],
            },
          },
        ],
      },
    ],
  },
];
