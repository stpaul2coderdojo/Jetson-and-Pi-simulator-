import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

// Gemini Chatbot Endpoint for Jupyter Notebook IDE
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, notebookContext, activeCellCode, targetHardware } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the server environment. Please configure GEMINI_API_KEY in Settings > Secrets or .env.',
      });
    }

    const hardwareName =
      targetHardware === 'orin-nano'
        ? 'NVIDIA Jetson Orin Nano (40 TOPS, Ampere Architecture, CUDA 12.2, TensorRT 8.6, 8GB unified LPDDR5)'
        : targetHardware === 'pi-5'
        ? 'Raspberry Pi 5 (ARM Cortex-A76 quad-core 2.4GHz, ARM NEON SIMD, VideoCore VII, 8GB LPDDR4X)'
        : 'NVIDIA Thor Nano (250 TOPS, Blackwell Architecture, FP8 Tensor Cores, NVLink-C2C, 16GB unified)';

    const systemInstruction = `You are the EdgeDocker Sim Jupyter AI Assistant, a world-class edge computing and AI engineer specializing in ARM64 hardware, PyTorch, CUDA, TensorRT, ONNX Runtime, and containerized edge workloads.

You are embedded directly inside an interactive Jupyter Notebook IDE.
Active Target Hardware: ${hardwareName}

Your duties:
1. Help the user write, debug, and optimize Python code for edge execution.
2. Explain PyTorch tensor shapes, memory footprints (VRAM vs system RAM), and GPU vs CPU bottlenecks.
3. Provide optimization recipes: INT8/FP8 quantization, TensorRT graph optimization, torch.compile with TensorRT backend, ONNX dynamic axes, and memory-efficient batching.
4. Assist with Wildlife AI models (MegaDetector v5, Microsoft SPARROW acoustic spectrogram analysis, YOLOv8/v11-OBB) and NVIDIA edge workshops.
5. Provide executable Python code blocks (\`\`\`python ... \`\`\`) that can be directly inserted into the user's notebook. Keep explanations clear, rigorous, and concise.

${notebookContext ? `Current Notebook Context:\n${notebookContext}\n` : ''}
${activeCellCode ? `Active Cell Code:\n\`\`\`python\n${activeCellCode}\n\`\`\`\n` : ''}`;

    // Map conversation history to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      text: response.text || 'No response returned from Gemini.',
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({
      error: error.message || 'An internal error occurred while communicating with Gemini.',
    });
  }
});

// Small Language Model (SLM) & Semantic Kernel Function rewrite() Endpoint
app.post('/api/tools/rewrite', async (req, res) => {
  try {
    const {
      text,
      wordLimit = 120,
      context = 'Executive & Technical Communication',
      tone = 'Professional & Concise',
      slmModel = 'Phi-3.5-mini-instruct (3.8B)',
      subsection = 'writing',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Input text is required for rewrite().' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Server Gemini API key not configured. Falling back to local SLM rewrite engine.',
      });
    }

    const numericLimit = Math.max(10, Math.min(2000, Number(wordLimit) || 120));

    const systemInstruction = `You are an enterprise Small Language Model (${slmModel}) orchestrated by Microsoft Semantic Kernel executing the native/semantic function \`rewrite(text, wordLimit, context)\`.

Active Subsection Mode: ${subsection === 'editing' ? 'Structural Editing & Precision Refinement' : 'Professional Writing & Composition'}
Target Context: ${context}
Target Tone: ${tone}
Strict Word Limit: Maximum ${numericLimit} words.

Your task:
1. Rewrite the user's input text so that it reads significantly more professionally, clearly, and authoritatively for the specified context (${context}).
2. Strictly enforce the word limit of at most ${numericLimit} words without losing core technical or business meaning.
3. Correct any awkward phrasing, passive voice, or spelling/grammar defects automatically during the rewrite.
4. Return a JSON object matching the required schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Execute function rewrite(text, wordLimit=${numericLimit}, context="${context}"):\n\nInput Text:\n"""\n${text}\n"""`,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: {
              type: Type.STRING,
              description: 'The professionally rewritten text strictly within the requested word limit.',
            },
            keyImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 4 concise bullet points explaining the stylistic and structural improvements made.',
            },
            toneAchieved: {
              type: Type.STRING,
              description: 'Short label of the resulting professional tone.',
            },
          },
          required: ['rewrittenText', 'keyImprovements', 'toneAchieved'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawJson);

    return res.json({
      rewrittenText: parsed.rewrittenText || text,
      keyImprovements: parsed.keyImprovements || [
        'Elevated vocabulary and professional register for target context',
        `Constrained length to fit within ${numericLimit}-word limit`,
      ],
      toneAchieved: parsed.toneAchieved || tone,
      slmModel,
      engine: 'gemini-3.1-flash-lite',
    });
  } catch (error: any) {
    console.error('Error in /api/tools/rewrite:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while executing rewrite().',
    });
  }
});

// Microsoft Semantic Kernel Spelling & Grammar Checker Endpoint
app.post('/api/tools/spellcheck', async (req, res) => {
  try {
    const { text, context = 'Professional Technical & Business Writing' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Input text is required for Semantic Kernel spell checking.' });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Server Gemini API key not configured. Using local Semantic Kernel dictionary & grammar rules.',
      });
    }

    const systemInstruction = `You are a Microsoft Semantic Kernel Plugin (\`SpellCheckerPlugin.CheckSpellingAndGrammarAsync\`) integrated with a Small Language Model.
Analyze the provided text within the context of "${context}".
Identify all spelling mistakes, typographical errors, grammatical errors, punctuation issues, and unprofessional word choices.
Return both the list of specific issues and the fully corrected version of the text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Run Semantic Kernel SpellCheckerPlugin on the following text:\n\n"""\n${text}\n"""`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedText: {
              type: Type.STRING,
              description: 'The complete text with all spelling and grammar corrections applied.',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: {
                    type: Type.STRING,
                    description: 'The exact misspelled word or grammatically incorrect phrase from the original text.',
                  },
                  suggestion: {
                    type: Type.STRING,
                    description: 'The corrected replacement word or phrase.',
                  },
                  type: {
                    type: Type.STRING,
                    description: 'One of: spelling, grammar, style, punctuation',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Brief explanation of why this correction improves accuracy or professionalism.',
                  },
                },
                required: ['original', 'suggestion', 'type', 'explanation'],
              },
            },
            readabilityScore: {
              type: Type.NUMBER,
              description: 'Estimated professional clarity score from 0 to 100.',
            },
          },
          required: ['correctedText', 'issues', 'readabilityScore'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawJson);

    return res.json({
      correctedText: parsed.correctedText || text,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      readabilityScore: typeof parsed.readabilityScore === 'number' ? parsed.readabilityScore : 92,
      pluginName: 'Microsoft.SemanticKernel.Plugins.Writing.SpellCheckerPlugin',
    });
  } catch (error: any) {
    console.error('Error in /api/tools/spellcheck:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during Semantic Kernel spell check.',
    });
  }
});

// Verify whether an external Cloudflare / ngrok noVNC tunnel URL is live and reachable
app.get('/api/vnc/verify-tunnel', async (req, res) => {
  const targetUrl = String(req.query.url || '').trim();
  if (!targetUrl) {
    return res.status(400).json({ reachable: false, reason: 'Missing URL parameter' });
  }
  // Built-in local /vnc.html endpoint is always reachable
  if (targetUrl.startsWith('/') || targetUrl.includes('/vnc.html') && !targetUrl.includes('.trycloudflare.com')) {
    return res.json({ reachable: true, mode: 'builtin-novnc', url: targetUrl });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'noVNC-Tunnel-Verifier/1.0' },
    });
    clearTimeout(timeout);
    if (resp.status === 502 || resp.status === 503) {
      return res.json({
        reachable: false,
        status: resp.status,
        reason:
          'HTTP 502 Bad Gateway (Origin Connection Refused): cloudflared is running, but port 6080 refused the connection (either localhost resolved to IPv6 [::1]:6080 instead of IPv4 127.0.0.1:6080, or novnc_proxy crashed because brew install novnc is not a valid Homebrew formula). Use the patched IPv4 127.0.0.1:6080 workflow YAML or switch to the Built-In Live /vnc.html server.',
        url: targetUrl,
      });
    }
    return res.json({
      reachable: resp.ok || resp.status < 500,
      status: resp.status,
      url: targetUrl,
    });
  } catch (err: any) {
    return res.json({
      reachable: false,
      reason:
        err?.cause?.code === 'ENOTFOUND'
          ? 'DNS_NXDOMAIN: This Cloudflare Tunnel subdomain is not active yet. Run the workflow in your GitHub Actions tab first, or use the built-in live /vnc.html endpoint.'
          : err?.message || 'Tunnel unreachable',
      url: targetUrl,
    });
  }
});

// Built-in Live HTML5 noVNC (RFB 3.8) Interactive Desktop & Mercor Screen Share Endpoint
app.get('/vnc.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>noVNC & WebRTC Streamer — Linux X11 • Windows 11 • macOS 15 Sequoia</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #050811;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    }
    .novnc-bar {
      min-height: 40px;
      background: #0b1120;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px;
      font-size: 11px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .novnc-left, .novnc-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-webrtc {
      background: rgba(6, 182, 212, 0.18);
      color: #67e8f9;
      border: 1px solid rgba(6, 182, 212, 0.45);
    }
    .btn {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 4px 9px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover { background: #334155; color: #fff; }
    .btn.active-x11 {
      background: rgba(245, 158, 11, 0.25);
      border-color: #f59e0b;
      color: #fde68a;
    }
    .btn.active-win11 {
      background: rgba(56, 189, 248, 0.25);
      border-color: #38bdf8;
      color: #bae6fd;
    }
    .btn.active-mac {
      background: rgba(168, 85, 247, 0.28);
      border-color: #a855f7;
      color: #e9d5ff;
    }
    .btn.active-all {
      background: rgba(16, 185, 129, 0.25);
      border-color: #10b981;
      color: #a7f3d0;
    }
    .btn-webrtc {
      background: #0891b2;
      border-color: #06b6d4;
      color: #fff;
    }
    .btn-webrtc:hover { background: #0e7490; }
    .btn-webrtc.streaming {
      background: #059669;
      border-color: #10b981;
    }
    .viewport {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #050811;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
    }
    .webrtc-pip {
      position: absolute;
      right: 16px;
      bottom: 48px;
      width: 360px;
      background: rgba(9, 13, 22, 0.96);
      border: 2px solid #06b6d4;
      border-radius: 10px;
      box-shadow: 0 20px 45px rgba(0,0,0,0.75);
      overflow: hidden;
      z-index: 30;
      display: none;
    }
    .webrtc-pip.visible {
      display: block;
    }
    .webrtc-pip-header {
      padding: 6px 10px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      color: #67e8f9;
    }
    .webrtc-pip video {
      width: 100%;
      height: 202px;
      display: block;
      background: #000;
      object-fit: contain;
    }
    .webrtc-pip-footer {
      padding: 5px 10px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      background: #090d16;
    }
  </style>
</head>
<body>
  <div class="novnc-bar">
    <div class="novnc-left">
      <span class="badge">● RFB 3.8 + WebRTC Active</span>
      <span class="badge badge-webrtc" id="webrtc-status-badge">WebRTC PeerConnection: Streaming 60 FPS</span>
      <span id="project-label" style="color:#94a3b8;">Mercor VNC & WebRTC Stream</span>
    </div>
    <div class="novnc-right">
      <span style="color:#94a3b8;font-weight:600;">Share Desktop:</span>
      <button class="btn" id="btn-os-x11">Linux X-Windows (X11)</button>
      <button class="btn" id="btn-os-win11">Windows 11 Desktop</button>
      <button class="btn" id="btn-os-mac">macOS 15 Sequoia</button>
      <button class="btn" id="btn-os-all">All 3 Desktops (Matrix)</button>
      <button class="btn btn-webrtc streaming" id="btn-webrtc-toggle">WebRTC Receiver Monitor (On)</button>
      <button class="btn" id="btn-host-capture" title="Optional: Share physical monitor if browser allows">Host Screen (getDisplayMedia)</button>
    </div>
  </div>
  <div class="viewport">
    <canvas id="rfb-canvas" width="1600" height="900"></canvas>
    <div class="webrtc-pip visible" id="webrtc-pip-box">
      <div class="webrtc-pip-header">
        <span id="webrtc-pip-title">LIVE WEBRTC PEER STREAM (RTCPeerConnection)</span>
        <div style="display:flex;gap:6px;">
          <button class="btn" id="btn-pip-native" style="padding:1px 6px;font-size:9px;">Popout PiP</button>
          <button class="btn" id="btn-pip-close" style="padding:1px 6px;font-size:9px;">Hide</button>
        </div>
      </div>
      <video id="webrtc-remote-video" autoplay playsinline muted></video>
      <div class="webrtc-pip-footer">
        <span id="webrtc-codec-info">H.264 / VP9 • ICE: Connected (host)</span>
        <span id="webrtc-bitrate-info">6.2 Mbps • 60 FPS</span>
      </div>
    </div>
  </div>
  <script>
    const params = new URLSearchParams(window.location.search);
    const project = params.get('mercor_project') || 'MERCOR-VDI-WEBRTC-01';
    const viewOnly = params.get('view_only') === 'true';
    let osMode = params.get('os') || 'macos-15'; // 'linux-x11' | 'win11' | 'macos-15' | 'all-os'

    document.getElementById('project-label').textContent =
      'Project: ' + project + (viewOnly ? ' [VIEW-ONLY]' : ' [INTERACTIVE]');

    const canvas = document.getElementById('rfb-canvas');
    const ctx = canvas.getContext('2d');
    const remoteVideo = document.getElementById('webrtc-remote-video');
    const pipBox = document.getElementById('webrtc-pip-box');
    const webrtcBadge = document.getElementById('webrtc-status-badge');
    const webrtcTitle = document.getElementById('webrtc-pip-title');
    const webrtcBitrateInfo = document.getElementById('webrtc-bitrate-info');

    let pointer = { x: 780, y: 420, clicked: false };
    let tick = 0;
    let hostCaptureStream = null;
    let hostVideoEl = document.createElement('video');
    hostVideoEl.autoplay = true;
    hostVideoEl.playsInline = true;
    hostVideoEl.muted = true;

    function updateOsButtons(broadcast = false) {
      document.getElementById('btn-os-x11').className = 'btn' + (osMode === 'linux-x11' ? ' active-x11' : '');
      document.getElementById('btn-os-win11').className = 'btn' + (osMode === 'win11' ? ' active-win11' : '');
      document.getElementById('btn-os-mac').className = 'btn' + (osMode === 'macos-15' ? ' active-mac' : '');
      document.getElementById('btn-os-all').className = 'btn' + (osMode === 'all-os' ? ' active-all' : '');
      const labelMap = {
        'linux-x11': 'Linux X-Windows (X.Org :0.0)',
        'win11': 'Windows 11 Enterprise (DWM)',
        'macos-15': 'macOS 15 Sequoia (Quartz)',
        'all-os': 'Tri-OS Matrix (X11 + Win11 + macOS)'
      };
      webrtcTitle.textContent = 'WEBRTC STREAM: ' + (labelMap[osMode] || osMode);
      if (broadcast && bcChannel) {
        try { bcChannel.postMessage({ fromVncHtml: true, osMode }); } catch {}
      }
    }

    let bcChannel = null;
    let liveSyncLogs = null;
    try {
      bcChannel = new BroadcastChannel('mercor-vdi-webrtc-bus');
      bcChannel.onmessage = (ev) => {
        if (ev.data && !ev.data.fromVncHtml) {
          if (ev.data.osMode) {
            osMode = ev.data.osMode;
            updateOsButtons(false);
          }
          if (Array.isArray(ev.data.terminalLogs) && ev.data.terminalLogs.length > 0) {
            liveSyncLogs = ev.data.terminalLogs;
          }
        }
      };
    } catch {}

    document.getElementById('btn-os-x11').addEventListener('click', () => { osMode = 'linux-x11'; updateOsButtons(true); });
    document.getElementById('btn-os-win11').addEventListener('click', () => { osMode = 'win11'; updateOsButtons(true); });
    document.getElementById('btn-os-mac').addEventListener('click', () => { osMode = 'macos-15'; updateOsButtons(true); });
    document.getElementById('btn-os-all').addEventListener('click', () => { osMode = 'all-os'; updateOsButtons(true); });
    updateOsButtons(false);

    canvas.addEventListener('mousemove', (e) => {
      if (viewOnly) return;
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * canvas.width;
      pointer.y = ((e.clientY - r.top) / r.height) * canvas.height;
    });

    canvas.addEventListener('mousedown', () => {
      if (viewOnly) return;
      pointer.clicked = true;
      setTimeout(() => { pointer.clicked = false; }, 180);
    });

    // Real WebRTC RTCPeerConnection loopback streaming the VDI OS Desktop Canvas (X11 / Windows 11 / macOS 15)
    let pcSender = null;
    let pcReceiver = null;
    let webrtcActive = true;

    async function startWebRtcDesktopPeerConnection() {
      try {
        if (pcSender) pcSender.close();
        if (pcReceiver) pcReceiver.close();

        const desktopStream = canvas.captureStream(60);
        pcSender = new RTCPeerConnection();
        pcReceiver = new RTCPeerConnection();

        pcSender.onicecandidate = (e) => {
          if (e.candidate && pcReceiver) pcReceiver.addIceCandidate(e.candidate).catch(() => {});
        };
        pcReceiver.onicecandidate = (e) => {
          if (e.candidate && pcSender) pcSender.addIceCandidate(e.candidate).catch(() => {});
        };
        pcReceiver.ontrack = (e) => {
          if (e.streams && e.streams[0]) {
            remoteVideo.srcObject = e.streams[0];
          }
        };

        desktopStream.getTracks().forEach((track) => pcSender.addTrack(track, desktopStream));

        const offer = await pcSender.createOffer();
        await pcSender.setLocalDescription(offer);
        await pcReceiver.setRemoteDescription(offer);
        const answer = await pcReceiver.createAnswer();
        await pcReceiver.setLocalDescription(answer);
        await pcSender.setRemoteDescription(answer);

        webrtcBadge.textContent = '● WebRTC RTCPeerConnection: Live 60 FPS';
      } catch (err) {
        console.warn('WebRTC loopback fallback:', err);
        remoteVideo.srcObject = canvas.captureStream(60);
      }
    }

    startWebRtcDesktopPeerConnection();

    // Update WebRTC bitrate stats every second
    setInterval(async () => {
      if (!pcReceiver) return;
      try {
        const stats = await pcReceiver.getStats();
        let fps = 60;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            if (report.framesPerSecond) fps = Math.round(report.framesPerSecond);
          }
        });
        const mbps = (5.8 + Math.sin(Date.now() / 1000) * 0.6).toFixed(1);
        webrtcBitrateInfo.textContent = mbps + ' Mbps • ' + fps + ' FPS • P2P Connected';
      } catch {}
    }, 1000);

    document.getElementById('btn-webrtc-toggle').addEventListener('click', () => {
      webrtcActive = !webrtcActive;
      const btn = document.getElementById('btn-webrtc-toggle');
      if (webrtcActive) {
        pipBox.classList.add('visible');
        btn.textContent = 'WebRTC Receiver Monitor (On)';
        btn.classList.add('streaming');
      } else {
        pipBox.classList.remove('visible');
        btn.textContent = 'WebRTC Receiver Monitor (Off)';
        btn.classList.remove('streaming');
      }
    });

    document.getElementById('btn-pip-close').addEventListener('click', () => {
      webrtcActive = false;
      pipBox.classList.remove('visible');
      const btn = document.getElementById('btn-webrtc-toggle');
      btn.textContent = 'WebRTC Receiver Monitor (Off)';
      btn.classList.remove('streaming');
    });

    document.getElementById('btn-pip-native').addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (remoteVideo.requestPictureInPicture) {
          await remoteVideo.requestPictureInPicture();
        }
      } catch {}
    });

    document.getElementById('btn-host-capture').addEventListener('click', async () => {
      try {
        if (hostCaptureStream) {
          hostCaptureStream.getTracks().forEach((t) => t.stop());
          hostCaptureStream = null;
          document.getElementById('btn-host-capture').textContent = 'Host Screen (getDisplayMedia)';
          return;
        }
        const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 }, audio: false });
        hostCaptureStream = s;
        hostVideoEl.srcObject = s;
        document.getElementById('btn-host-capture').textContent = 'Stop Host Screen Capture';
        s.getVideoTracks()[0].addEventListener('ended', () => {
          hostCaptureStream = null;
          document.getElementById('btn-host-capture').textContent = 'Host Screen (getDisplayMedia)';
        });
      } catch (err) {
        // Fallback automatically to virtual OS WebRTC desktop share if iframe blocks getDisplayMedia
        pipBox.classList.add('visible');
        webrtcBadge.textContent = '● WebRTC Virtual OS Compositor Active (60 FPS)';
      }
    });

    // Listen to BroadcastChannel from main React VDI app so switching OS in main app updates WebRTC stream
    try {
      const bc = new BroadcastChannel('mercor-vdi-webrtc-bus');
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.osMode) {
          osMode = ev.data.osMode;
          updateOsButtons();
        }
      };
    } catch {}

    function drawLinuxX11Desktop(rx, ry, rw, rh) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#111827');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);

      // X11 Top Panel
      ctx.fillStyle = '#090d14';
      ctx.fillRect(rx, ry, rw, 30);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.strokeRect(rx, ry, rw, 30);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('Applications (X11)  |  Workspaces: [1] [2] [3] [4]  |  DISPLAY=:0.0  |  X.Org 21.1.11 (XFCE4/Xfwm4)', rx + 14, ry + 19);

      // Window 1: XTerm
      const w1 = { x: rx + 24, y: ry + 46, w: rw * 0.47, h: rh * 0.44 };
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(w1.x, w1.y, w1.w, w1.h);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(w1.x, w1.y, w1.w, w1.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w1.x, w1.y, w1.w, 26);
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('XTerm — ws-user@ws-x11-ubuntu24: ~/workspace (DISPLAY=:0.0)', w1.x + 10, w1.y + 17);

      const x11Logs = [
        'ws-user@ws-x11-ubuntu24:~/workspace$ xdpyinfo | grep "name of display"',
        'name of display:    :0.0 (X.Org Server 21.1.11 GLX Direct)',
        'ws-user@ws-x11-ubuntu24:~/workspace$ wmctrl -l',
        '0x01800003  0 ws-x11-ubuntu24 XTerm',
        '0x02400007  0 ws-x11-ubuntu24 Thunar File Manager',
        '0x03200012  0 ws-x11-ubuntu24 Code - OSS (X11)',
        'ws-user@ws-x11-ubuntu24:~/workspace$ WebRTC Stream: ACTIVE (60 FPS)'
      ];
      ctx.font = '11px monospace';
      x11Logs.forEach((l, i) => {
        ctx.fillStyle = l.includes('$') ? '#34d399' : '#e2e8f0';
        ctx.fillText(l.slice(0, 68), w1.x + 12, w1.y + 46 + i * 20);
      });

      // Window 2: Code-OSS (X11)
      const w2 = { x: rx + rw * 0.51, y: ry + 46, w: rw * 0.47, h: rh * 0.44 };
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(w2.x, w2.y, w2.w, w2.h);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(w2.x, w2.y, w2.w, w2.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w2.x, w2.y, w2.w, 26);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('Code - OSS (X11) — x11_webrtc_ compositor.py', w2.x + 10, w2.y + 17);

      const pyLines = [
        'import Xlib.display, webrtc_bridge',
        'dsp = Xlib.display.Display(":0.0")',
        'root = dsp.screen().root',
        'geom = root.get_geometry()',
        'print(f"Streaming X11 Root {geom.width}x{geom.height} @ 60fps")',
        'webrtc_bridge.publish_x11_damage_frames(root)'
      ];
      pyLines.forEach((l, i) => {
        ctx.fillStyle = '#c084fc';
        ctx.fillText(String(i + 1) + '  ' + l, w2.x + 12, w2.y + 48 + i * 21);
      });

      // Window 3: Thunar File Manager & NVIDIA L4 Telemetry
      const w3 = { x: rx + 24, y: ry + rh * 0.52, w: rw - 48, h: rh * 0.40 };
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(w3.x, w3.y, w3.w, w3.h);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(w3.x, w3.y, w3.w, w3.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w3.x, w3.y, w3.w, 26);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('Thunar File Manager (/home/ws-user/workspace)  +  NVIDIA L4 X Server Settings (24 GB VRAM)', w3.x + 10, w3.y + 17);

      const files = ['[DIR]  x11-window-manager/', '[DIR]  tensorrt-engines/', '[FILE] x11_window_pipeline.py (6.8 KB)', '[FILE] xorg.conf.d-nvidia.conf (2.1 KB)'];
      files.forEach((f, i) => {
        ctx.fillStyle = f.startsWith('[DIR]') ? '#60a5fa' : '#cbd5e1';
        ctx.fillText(f, w3.x + 16, w3.y + 52 + i * 22);
      });

      // X11 Bottom Tasklist
      ctx.fillStyle = '#090d14';
      ctx.fillRect(rx, ry + rh - 28, rw, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('[XTerm]   [Thunar File Manager]   [Code - OSS (X11)]   [NVIDIA X Server Settings]      X.Org 21.1.11 • WebRTC Shared', rx + 14, ry + rh - 10);

      ctx.restore();
    }

    function drawWindows11Desktop(rx, ry, rw, rh) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      grad.addColorStop(0, '#082f49');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);

      // Windows 11 Top Snap Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.fillRect(rx, ry, rw, 28);
      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Windows 11 Enterprise (Cloud PC)  •  CPC-ENT-8VCPU  •  Win32 DWM Desktop Window Manager  •  Snap Layouts [2x2]', rx + 14, ry + 18);

      // Win11 Window 1: Windows PowerShell 7.4
      const w1 = { x: rx + 24, y: ry + 42, w: rw * 0.47, h: rh * 0.43 };
      ctx.fillStyle = '#0c1425';
      ctx.fillRect(w1.x, w1.y, w1.w, w1.h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(w1.x, w1.y, w1.w, w1.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w1.x, w1.y, w1.w, 26);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Administrator: Windows PowerShell 7.4 (Win32 DWM)            ─   ▢   ✕', w1.x + 10, w1.y + 17);

      const psLogs = [
        'PS C:\\Users\\corp-admin\\Projects> Get-Process dwm, explorer, devenv',
        'Handles  NPM(K)    PM(K)      WS(K)     Id  ProcessName',
        '   1420      88   214800     268400   1204  dwm',
        '   2310     124   318400     392100   4410  explorer',
        '   3190     195  1284000    1482900   8842  devenv',
        'PS C:\\Users\\corp-admin\\Projects> WebRTC Desktop Capture: ONLINE (60 FPS)'
      ];
      ctx.font = '11px monospace';
      psLogs.forEach((l, i) => {
        ctx.fillStyle = l.startsWith('PS ') ? '#38bdf8' : '#e2e8f0';
        ctx.fillText(l.slice(0, 68), w1.x + 12, w1.y + 46 + i * 20);
      });

      // Win11 Window 2: Visual Studio 2022
      const w2 = { x: rx + rw * 0.51, y: ry + 42, w: rw * 0.47, h: rh * 0.43 };
      ctx.fillStyle = '#0c1425';
      ctx.fillRect(w2.x, w2.y, w2.w, w2.h);
      ctx.strokeStyle = '#818cf8';
      ctx.strokeRect(w2.x, w2.y, w2.w, w2.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w2.x, w2.y, w2.w, 26);
      ctx.fillStyle = '#c7d2fe';
      ctx.fillText('Visual Studio 2022 — CloudDesktopService.cs                 ─   ▢   ✕', w2.x + 10, w2.y + 17);

      const csLines = [
        'using System; using Windows.Graphics.Capture;',
        'namespace CloudPcEnterprise {',
        '  public static class Win11WebRtcBroadcaster {',
        '    public static void StreamDwmDesktop() =>',
        '      Console.WriteLine("Streaming Win11 DWM HWND_DESKTOP @ 60fps");',
        '  }',
        '}'
      ];
      csLines.forEach((l, i) => {
        ctx.fillStyle = '#a5b4fc';
        ctx.fillText(String(i + 1) + '  ' + l, w2.x + 12, w2.y + 46 + i * 20);
      });

      // Win11 Window 3: File Explorer (This PC) & Task Manager
      const w3 = { x: rx + 24, y: ry + rh * 0.50, w: rw - 48, h: rh * 0.39 };
      ctx.fillStyle = '#0c1425';
      ctx.fillRect(w3.x, w3.y, w3.w, w3.h);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(w3.x, w3.y, w3.w, w3.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w3.x, w3.y, w3.w, 26);
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('File Explorer — C:\\Users\\corp-admin\\Projects  +  Windows 11 Task Manager (DirectX 12)', w3.x + 10, w3.y + 17);

      const winFiles = ['[FOLDER] Enterprise-Agent-Service', '[FOLDER] WinUI3-Dashboard', '[FILE]   CloudDesktopService.csproj (4.2 KB)', '[FILE]   Program.cs (8.9 KB)'];
      winFiles.forEach((f, i) => {
        ctx.fillStyle = f.startsWith('[FOLDER]') ? '#fbbf24' : '#e2e8f0';
        ctx.fillText(f, w3.x + 16, w3.y + 52 + i * 22);
      });

      // Windows 11 Centered Fluent Taskbar
      ctx.fillStyle = '#070d19';
      ctx.fillRect(rx, ry + rh - 36, rw, 36);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Entra ID Joined          [ ⊞ Start ]   [ Explorer ]   [ PowerShell 7.4 ]   [ Visual Studio 2022 ]   [ Task Manager ]          RDP Shortpath 60 FPS', rx + 24, ry + rh - 14);

      ctx.restore();
    }

    function drawMacOs15Desktop(rx, ry, rw, rh) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#3b0764');
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);

      // macOS 15 Top Menu Bar
      ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
      ctx.fillRect(rx, ry, rw, 28);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('  Sequoia 15.3   Finder   File   Edit   View   Window   •   Apple M4 Max (Metal 3 Quartz Compositor)   •   WebRTC + RFB 3.8', rx + 14, ry + 18);

      // Window 1: iTerm2
      const w1 = { x: rx + 24, y: ry + 42, w: rw * 0.47, h: rh * 0.43 };
      ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
      ctx.fillRect(w1.x, w1.y, w1.w, w1.h);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(w1.x, w1.y, w1.w, w1.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w1.x, w1.y, w1.w, 26);
      ['#ef4444', '#f59e0b', '#10b981'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(w1.x + 14 + i * 16, w1.y + 13, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('iTerm2 — zsh (arm64e) — dev-m4max@macos15-sequoia', w1.x + 68, w1.y + 17);

      const macLogs = [
        'dev-m4max@macos15-sequoia ~ % sw_vers',
        'ProductName:            macOS Sequoia',
        'ProductVersion:         15.3 (24D60)',
        'Kernel:                 Darwin 24.3.0 arm64e (Apple M4 Max)',
        'WindowServer:           Quartz Metal 3 (WebRTC Stream Active)',
        'dev-m4max@macos15-sequoia ~ % _'
      ];
      ctx.font = '11px monospace';
      macLogs.forEach((l, i) => {
        ctx.fillStyle = l.includes('%') ? '#34d399' : '#cbd5e1';
        ctx.fillText(l.slice(0, 68), w1.x + 12, w1.y + 46 + i * 20);
      });

      // Window 2: Xcode 16.2
      const w2 = { x: rx + rw * 0.51, y: ry + 42, w: rw * 0.47, h: rh * 0.43 };
      ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
      ctx.fillRect(w2.x, w2.y, w2.w, w2.h);
      ctx.strokeStyle = '#c084fc';
      ctx.strokeRect(w2.x, w2.y, w2.w, w2.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w2.x, w2.y, w2.w, 26);
      ctx.fillStyle = '#f3e8ff';
      ctx.fillText('Xcode 16.2 — MacWorkspaceApp.swift (Metal 3)', w2.x + 14, w2.y + 17);

      const swiftLines = [
        'import Foundation',
        'import Metal',
        'final class MacSequoiaWebRtcDesktop {',
        '  func captureQuartzWorkspace() -> String {',
        '    guard let gpu = MTLCreateSystemDefaultDevice() else { return "" }',
        '    return "Streaming \\(gpu.name) Quartz Desktop via WebRTC"',
        '  }',
        '}'
      ];
      swiftLines.forEach((l, i) => {
        ctx.fillStyle = '#d8b4fe';
        ctx.fillText(String(i + 1) + '  ' + l, w2.x + 12, w2.y + 46 + i * 20);
      });

      // Window 3: Finder + Activity Monitor
      const w3 = { x: rx + 24, y: ry + rh * 0.50, w: rw - 48, h: rh * 0.38 };
      ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
      ctx.fillRect(w3.x, w3.y, w3.w, w3.h);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(w3.x, w3.y, w3.w, w3.h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w3.x, w3.y, w3.w, 26);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('Finder (/Users/dev-m4max/Projects)  +  Activity Monitor (Apple M4 Max 40-Core GPU)', w3.x + 12, w3.y + 17);

      const macFiles = ['[FOLDER] CoreML-Llama3-Runner', '[FOLDER] MetalComputeShaders', '[FILE]   Package.swift (2.4 KB)', '[FILE]   MacWorkspaceApp.swift (11.6 KB)'];
      macFiles.forEach((f, i) => {
        ctx.fillStyle = f.startsWith('[FOLDER]') ? '#38bdf8' : '#e2e8f0';
        ctx.fillText(f, w3.x + 16, w3.y + 52 + i * 22);
      });

      // macOS Floating Translucent Dock
      const dockW = Math.min(520, rw * 0.6);
      const dockX = rx + (rw - dockW) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(dockX, ry + rh - 38, dockW, 30);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.strokeRect(dockX, ry + rh - 38, dockW, 30);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('[ Finder ]     [ iTerm2 ]     [ Xcode 16.2 ]     [ Activity Monitor ]', dockX + 42, ry + rh - 19);

      ctx.restore();
    }

    function drawFrame() {
      tick++;
      const W = canvas.width;
      const H = canvas.height;

      if (hostCaptureStream && hostVideoEl.readyState >= 2) {
        ctx.drawImage(hostVideoEl, 0, 0, W, H);
      } else if (osMode === 'linux-x11') {
        drawLinuxX11Desktop(0, 0, W, H);
      } else if (osMode === 'win11') {
        drawWindows11Desktop(0, 0, W, H);
      } else if (osMode === 'all-os') {
        const colW = Math.floor(W / 3);
        drawLinuxX11Desktop(0, 0, colW, H);
        drawWindows11Desktop(colW, 0, colW, H);
        drawMacOs15Desktop(colW * 2, 0, W - colW * 2, H);
      } else {
        drawMacOs15Desktop(0, 0, W, H);
      }

      // Remote Pointer Cursor
      ctx.fillStyle = pointer.clicked ? '#f43f5e' : '#34d399';
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, pointer.clicked ? 12 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  </script>
</body>
</html>`);
});

// Start server with Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EdgeDocker Sim Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
