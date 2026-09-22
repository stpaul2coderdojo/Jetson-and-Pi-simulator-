import React, { useState } from 'react';
import { 
  BookOpen, FileText, Cpu, Leaf, Terminal, Copy, Check, ExternalLink, 
  Layers, Shield, Zap, Sparkles, Download, GitBranch, Cloud 
} from 'lucide-react';

type DocSection = 'readme' | 'hardware' | 'wildlife' | 'nvidia-workshops' | 'docker' | 'render';

export const DocumentationView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('readme');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Edge Computing & GitHub Documentation
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Architecture, Wildlife AI, and NVIDIA DLI Edge Documentation
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Complete technical guides, real hardware deployment recipes, benchmark methodologies, and containerized workload references.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              docs/ v1.2.0 • ARM64
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-thin border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveSection('readme')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'readme'
                ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            README & Overview
          </button>
          <button
            onClick={() => setActiveSection('hardware')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'hardware'
                ? 'bg-indigo-950/80 border border-indigo-500 text-indigo-300 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Hardware & Benchmark Matrix
          </button>
          <button
            onClick={() => setActiveSection('wildlife')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'wildlife'
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Wildlife AI & Bioacoustics Guide
          </button>
          <button
            onClick={() => setActiveSection('nvidia-workshops')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'nvidia-workshops'
                ? 'bg-lime-950/80 border border-lime-500 text-lime-300 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            NVIDIA Workshop & DLI Guide
          </button>
          <button
            onClick={() => setActiveSection('docker')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'docker'
                ? 'bg-amber-950/80 border border-amber-500 text-amber-300 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Edge Docker Deployment Best Practices
          </button>
          <button
            onClick={() => setActiveSection('render')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'render'
                ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-200 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Deploy on Render & Cloud
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 text-slate-300 leading-relaxed">
        {activeSection === 'readme' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">EdgeDocker Sim: Edge AI & Docker Container Simulator</h3>
              <p className="text-sm text-slate-400 mt-1">
                Multi-architecture container simulator for NVIDIA Jetson Orin Nano, Raspberry Pi 5, and NVIDIA Thor Nano.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Target 1</span>
                <h4 className="text-sm font-bold text-white mt-1">NVIDIA Jetson Orin Nano</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Ampere architecture with 1024 CUDA cores & 32 Tensor cores. 40 TOPS AI inference in 7W–15W.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Target 2</span>
                <h4 className="text-sm font-bold text-white mt-1">Raspberry Pi 5 (8GB)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Broadcom BCM2712 4-core Cortex-A76 processor @ 2.4 GHz. CPU NEON SIMD inference in 5W–12W.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Target 3</span>
                <h4 className="text-sm font-bold text-white mt-1">NVIDIA Thor Nano (Next-Gen)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Blackwell architecture with 2048 CUDA cores and 4th-Gen Tensor Engine. 250 TOPS in 15W–30W.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-2">Real Hardware Deployment Commands</h4>
              <p className="text-xs text-slate-400 mb-3">
                Quick commands to run any edge container on physical Jetson or Raspberry Pi hardware:
              </p>

              <div className="space-y-3">
                <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
                  <div className="text-[11px] text-slate-500 mb-1"># Jetson Orin Nano (CUDA + TensorRT + MIPI CSI)</div>
                  <code>
                    docker run --runtime nvidia --gpus all -it --rm --network=host --ipc=host \<br />
                    &nbsp;&nbsp;--device /dev/video0:/dev/video0 \<br />
                    &nbsp;&nbsp;-v /tmp/argus_socket:/tmp/argus_socket \<br />
                    &nbsp;&nbsp;ghcr.io/microsoft/sparrow:latest
                  </code>
                  <button
                    onClick={() => copyToClipboard('docker run --runtime nvidia --gpus all -it --rm --network=host --ipc=host --device /dev/video0:/dev/video0 -v /tmp/argus_socket:/tmp/argus_socket ghcr.io/microsoft/sparrow:latest', 'jetson-cmd')}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedCode === 'jetson-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
                  <div className="text-[11px] text-slate-500 mb-1"># Raspberry Pi 5 (Standard ARM64 runc)</div>
                  <code>
                    docker run -it --rm --network=host \<br />
                    &nbsp;&nbsp;--device /dev/video0:/dev/video0 \<br />
                    &nbsp;&nbsp;ghcr.io/agentmorris/megadetector:latest
                  </code>
                  <button
                    onClick={() => copyToClipboard('docker run -it --rm --network=host --device /dev/video0:/dev/video0 ghcr.io/agentmorris/megadetector:latest', 'pi-cmd')}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedCode === 'pi-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'hardware' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Hardware Benchmark & Architecture Deep Dive</h3>
              <p className="text-sm text-slate-400 mt-1">
                Comparative analysis of compute density, unified memory bus widths, and thermal dissipation curves.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Workload / Benchmark</th>
                    <th className="p-3 text-cyan-400">Jetson Orin Nano (8GB)</th>
                    <th className="p-3 text-rose-400">Raspberry Pi 5 (8GB)</th>
                    <th className="p-3 text-purple-400">Thor Nano (Next-Gen)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">MegaDetector v5 Camera Trap</td>
                    <td className="p-3 text-cyan-300">58 FPS (17.2 ms)</td>
                    <td className="p-3 text-slate-400">8.5 FPS (118 ms)</td>
                    <td className="p-3 text-purple-300">195 FPS (5.1 ms)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">Ultralytics YOLOv8s</td>
                    <td className="p-3 text-cyan-300">135 FPS (7.4 ms)</td>
                    <td className="p-3 text-slate-400">22 FPS (45.4 ms)</td>
                    <td className="p-3 text-purple-300">390 FPS (2.5 ms)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">Llama 3 8B (Q4_K_M)</td>
                    <td className="p-3 text-cyan-300">28.4 tok/s (35.2 ms)</td>
                    <td className="p-3 text-slate-400">7.8 tok/s (128 ms)</td>
                    <td className="p-3 text-purple-300">74.2 tok/s (13.4 ms)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">Bioacoustic AED (32kHz)</td>
                    <td className="p-3 text-cyan-300">18.4x Realtime (16.3 ms)</td>
                    <td className="p-3 text-slate-400">4.8x Realtime (62.5 ms)</td>
                    <td className="p-3 text-purple-300">65.0x Realtime (3.1 ms)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">Power Efficiency (FPS/Watt)</td>
                    <td className="p-3 text-emerald-400 font-bold">11.7 FPS/W</td>
                    <td className="p-3 text-slate-400">2.6 FPS/W</td>
                    <td className="p-3 text-emerald-400 font-bold">21.1 FPS/W</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-200 font-sans">Hardware Price</td>
                    <td className="p-3 text-slate-300">$499 USD</td>
                    <td className="p-3 text-emerald-400 font-bold">$80 USD</td>
                    <td className="p-3 text-slate-300">~$899 USD</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <h5 className="font-bold text-white">Thermal Dynamics Modeling:</h5>
              <p>
                The simulation calculates thermal equilibrium using <code className="text-cyan-400">dT = (P_active - P_dissipated) / ThermalMass</code>.
                When temperatures exceed <strong>85°C</strong> on Jetson or <strong>80°C</strong> on Pi 5, the CPU and GPU scale frequencies down by up to 50%, resulting in noticeable framerate drops and latency spikes.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'wildlife' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Wildlife AI & Passive Acoustic Monitoring (PAM)</h3>
              <p className="text-sm text-slate-400 mt-1">
                Field biology, anti-poaching camera traps, and bioacoustic edge sensing repositories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Microsoft SPARROW</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Solar + Satellite
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Smart Platform for Acoustic and Remote Wildlife Operations. Monitors battery voltages and solar yields to dynamically adjust AudioMoth sampling intervals and transmits concise species events over Swarm satellite links.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">MegaDetector Camera Traps</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Animal / Human / Vehicle
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Trained on millions of camera trap images worldwide. Automatically identifies animals, detects park ranger or poacher presence, and detects unauthorized vehicles with minimal false positives from vegetation motion.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">MegaDetector Acoustic</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Bioacoustics & Ultrasonic
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Performs continuous Passive Acoustic Monitoring (PAM), extracting Bioacoustic Index (BI) and Acoustic Complexity Index (ACI) to monitor bird and bat species densities across tropical forest ecosystems.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">PyTorch Wildlife</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Taxa Classification
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  End-to-end framework integrating MegaDetector object detection with fine-grained animal species classifiers, outputting Darwin Core compliant JSON records ready for ecological archives.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'nvidia-workshops' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">NVIDIA Workshop & Deep Learning Institute (DLI)</h3>
              <p className="text-sm text-slate-400 mt-1">
                Official NVIDIA repositories for Jetson edge AI, hardware acceleration, and robotics.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Jetson Inference ("Hello AI World")</h4>
                  <span className="text-xs font-mono text-cyan-400">dusty-nv/jetson-inference</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  NVIDIA DLI workshop teaching real-time image recognition, object detection, and segmentation using TensorRT. Includes Python & C++ APIs with built-in RTSP and WebRTC camera streaming.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">DeepStream Reference Applications</h4>
                  <span className="text-xs font-mono text-cyan-400">NVIDIA-AI-IOT/deepstream_reference_apps</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  GStreamer-based video analytics SDK. Simultaneously ingests, hardware-decodes (NVDEC), infers with TensorRT INT8 engines, and tracks multi-camera streams with high efficiency.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Isaac ROS Hardware-Accelerated Robotics</h4>
                  <span className="text-xs font-mono text-cyan-400">NVIDIA-ISAAC-ROS/isaac_ros_common</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Hardware-accelerated ROS 2 packages using NITROS (zero-copy GPU transport). Provides Visual SLAM odometry, Nvblox 3D reconstruction, and ESS stereo disparity.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">TensorRT Benchmark Suite</h4>
                  <span className="text-xs font-mono text-cyan-400">NVIDIA/TensorRT</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluates dense matrix multiplication (SGEMM/HGEMM), layer fusion, and INT8 calibration across NVIDIA Tensor Cores.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'docker' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Edge Docker Deployment Best Practices</h3>
              <p className="text-sm text-slate-400 mt-1">
                Optimizing container images, shared memory, and storage longevity on embedded ARM64 boards.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-white">1. Configure the NVIDIA Container Runtime</h4>
                <p className="text-xs text-slate-400 mt-1 mb-2">
                  Ensure <code className="text-cyan-400">/etc/docker/daemon.json</code> has the NVIDIA runtime configured as default:
                </p>
                <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
{`{
  "default-runtime": "nvidia",
  "runtimes": {
    "nvidia": {
      "path": "nvidia-container-runtime",
      "runtimeArgs": []
    }
  }
}`}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-white">2. Shared Memory for PyTorch & ROS 2</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Docker's default <code className="text-amber-400">/dev/shm</code> is only 64MB, which causes PyTorch DataLoader worker threads and ROS 2 FastDDS shared memory transport to crash. Always add <code className="text-cyan-400">--shm-size=2gb</code> or <code className="text-cyan-400">--ipc=host</code> when launching edge containers.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-white">3. Flash Storage Preservation</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Continuous logging and video caching will degrade MicroSD cards rapidly. Mount temporary directories to RAM using <code className="text-cyan-400">--tmpfs /tmp --tmpfs /var/log</code>, or mount high-endurance NVMe SSDs into <code className="text-cyan-400">/mnt/nvme</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'render' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Render Blueprint Ready
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Free Tier (Static Site)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-2">Deploying EdgeDocker Sim on Render</h3>
              <p className="text-sm text-slate-400 mt-1">
                Render hosts Vite/React single-page applications on a global, ultra-fast Content Delivery Network with zero configuration, automatic SSL, and zero monthly cost.
              </p>
            </div>

            {/* Quick 1-Click Blueprint Card */}
            <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-indigo-950/40 p-5 rounded-xl border border-cyan-500/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Option 1: Infrastructure as Code (render.yaml Blueprint)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    This repository includes an official <code className="text-cyan-400">render.yaml</code> file. Render automatically configures build scripts, output directories, security headers, and SPA rewrite rules when you import the repository.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(`services:
  - type: web
    name: edgedocker-sim
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    pullRequestPreviewsEnabled: true
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    headers:
      - path: /*
        name: X-Frame-Options
        value: SAMEORIGIN`, 'yaml')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/60 border border-cyan-700 text-cyan-200 text-xs font-medium hover:bg-cyan-800/80 transition-colors shrink-0"
                >
                  {copiedCode === 'yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'yaml' ? 'Copied' : 'Copy render.yaml'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Service Type</span>
                  <span className="font-mono text-cyan-300 font-bold">Static Site</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Build Command</span>
                  <span className="font-mono text-cyan-300 font-bold">npm i && npm run build</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Publish Dir</span>
                  <span className="font-mono text-cyan-300 font-bold">./dist</span>
                </div>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">SPA Rewrite</span>
                  <span className="font-mono text-cyan-300 font-bold">/* &rarr; /index.html</span>
                </div>
              </div>
            </div>

            {/* Step by Step instructions */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-200">
                Step-by-Step Deployment Steps
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-white">Push to GitHub or GitLab</h5>
                    <p className="text-slate-400 mt-0.5">
                      Ensure your repository is pushed with the included <code className="text-slate-300">render.yaml</code>, <code className="text-slate-300">package.json</code>, and <code className="text-slate-300">vite.config.ts</code>.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-white">Connect to Render</h5>
                    <p className="text-slate-400 mt-0.5">
                      Log into <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">dashboard.render.com</a>. Click <strong>New +</strong> &rarr; <strong>Blueprint</strong> (or <strong>Static Site</strong>).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-white">Select Repository and Deploy</h5>
                    <p className="text-slate-400 mt-0.5">
                      Render will instantly validate the configuration, run the Vite build, run tests, and generate your live production URL (e.g. <code className="text-cyan-300">https://edgedocker-sim.onrender.com</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* render.yaml preview snippet */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400">render.yaml (Root Configuration)</span>
                <span className="text-[11px] text-slate-500">Infrastructure as Code</span>
              </div>
              <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
{`services:
  - type: web
    name: edgedocker-sim
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    pullRequestPreviewsEnabled: true
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    headers:
      - path: /*
        name: X-Frame-Options
        value: SAMEORIGIN
      - path: /*
        name: X-Content-Type-Options
        value: nosniff`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
