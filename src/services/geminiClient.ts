import { ChatMessage, DeviceId } from '../types';

export interface GeminiChatResponse {
  text: string;
  error?: string;
  isFallback?: boolean;
}

export async function sendGeminiChatMessage(
  messages: ChatMessage[],
  notebookContext: string,
  activeCellCode: string,
  targetHardware: DeviceId
): Promise<GeminiChatResponse> {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        notebookContext,
        activeCellCode,
        targetHardware,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || `Server responded with status ${response.status}`;
      return {
        text: getLocalIntelligentFallback(messages[messages.length - 1]?.content || '', targetHardware, activeCellCode, errorMsg),
        error: errorMsg,
        isFallback: true,
      };
    }

    const data = await response.json();
    return {
      text: data.text || 'No response returned from Gemini.',
    };
  } catch (err: any) {
    console.warn('Network error reaching /api/gemini/chat, using intelligent edge assistant fallback:', err);
    return {
      text: getLocalIntelligentFallback(
        messages[messages.length - 1]?.content || '',
        targetHardware,
        activeCellCode,
        err.message || 'Network unreachable'
      ),
      error: err.message,
      isFallback: true,
    };
  }
}

function getLocalIntelligentFallback(
  userQuery: string,
  targetHardware: DeviceId,
  activeCode: string,
  errorMessage?: string
): string {
  const q = userQuery.toLowerCase();
  const hardwareDesc =
    targetHardware === 'orin-nano'
      ? 'Jetson Orin Nano (Ampere SM 8.7, 40 TOPS, CUDA 12.2, TensorRT)'
      : targetHardware === 'pi-5'
      ? 'Raspberry Pi 5 (Quad Cortex-A76 2.4GHz, ARM NEON SIMD, ONNX Runtime)'
      : 'Thor Nano (Blackwell SM 10.0, 250 TOPS, FP8 Tensor Cores)';

  let guidance = `> ℹ️ **Notice**: *Server Gemini API returned: "${errorMessage}". Operating in Edge Offline Knowledge Mode for ${hardwareDesc}.*\n\n`;

  if (q.includes('optimize') || q.includes('tensorrt') || q.includes('speed')) {
    guidance += `### ⚡ Edge Optimization Guidance for ${hardwareDesc}:

1. **Precision Calibration**:
   Convert dynamic PyTorch layers to **INT8** or **FP16** calibration cache. On Jetson Orin Nano, this yields a **~2.4x throughput gain** while cutting thermal dissipation by 35%.

\`\`\`python
# TensorRT INT8 Engine Compilation Script
import tensorrt as trt

TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
builder = trt.Builder(TRT_LOGGER)
network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
config = builder.create_builder_config()

# Enable FP16 and INT8 Tensor Core execution
config.set_flag(trt.BuilderFlag.FP16)
config.set_flag(trt.BuilderFlag.INT8)
config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 2 << 30) # 2GB workspace
print("[TRT] Configured builder for Ampere / ARM64 execution")
\`\`\`

2. **Unified Memory Management**:
   Use \`torch.cuda.empty_cache()\` and disable autograd (\`torch.no_grad()\`) to prevent swapping on the unified 8GB LPDDR5 bus.`;
  } else if (q.includes('megadetector') || q.includes('wildlife')) {
    guidance += `### 🐾 Microsoft MegaDetector Edge Pipeline:

MegaDetector v5 operates best on edge devices with an image dimension of \`1280x1280\` using letterbox padding.

\`\`\`python
# MegaDetector v5 Batch Inference Setup
from PIL import Image
import torchvision.transforms as T

transform = T.Compose([
    T.Resize((1280, 1280)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Thresholding: 0.2 is recommended to capture low-contrast nocturnal wildlife
CONFIDENCE_THRESHOLD = 0.20
print(f"MegaDetector inference filter set to conf >= {CONFIDENCE_THRESHOLD}")
\`\`\``;
  } else if (q.includes('docker') || q.includes('container')) {
    guidance += `### 🛡️ Edge Dockerfile Recipe for ${hardwareDesc}:

\`\`\`dockerfile
# Multi-arch ARM64 Production Dockerfile
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

WORKDIR /workspace
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy notebook and scripts
COPY . .

CMD ["python3", "-c", "import torch; print('Edge Container Ready:', torch.cuda.is_available())"]
\`\`\``;
  } else {
    guidance += `### 💡 Edge Python Assistance for ${hardwareDesc}:

Here is an optimized execution snippet for your notebook:

\`\`\`python
import time
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Executing on hardware device: {device} ({'Ampere TensorRT' if device=='cuda' else 'ARM NEON SIMD'})")

# Simulated benchmark tensor
x = torch.randn(1, 3, 640, 640, device=device)
with torch.no_grad():
    for _ in range(5): # warmup
        _ = x * 2.0
    t0 = time.perf_counter()
    for _ in range(20):
        out = x * 2.0
    lat = (time.perf_counter() - t0) / 20 * 1000
    print(f"Mean kernel latency: {lat:.2f} ms")
\`\`\`

Feel free to ask me to explain cells, optimize CUDA kernels, or add new benchmark steps!`;
  }

  return guidance;
}
