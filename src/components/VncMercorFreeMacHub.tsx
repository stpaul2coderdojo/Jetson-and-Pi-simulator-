import React, { useState } from 'react';
import {
  Share2,
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  Globe,
  ShieldCheck,
  Eye,
  Lock,
  Unlock,
  Wifi,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Video,
  Circle,
  Square,
  Sliders,
  Server,
  Laptop,
  Code2,
  CheckCircle2
} from 'lucide-react';
import { VdiProviderId } from './RemoteDesktopView';

export interface VncConnectionConfig {
  isConnected: boolean;
  mode: 'internal-rfb-bridge' | 'external-novnc-iframe';
  tunnelUrl: string;
  rfbHost: string;
  rfbPort: number;
  wsPath: string;
  encoding: 'Tight + Zlib (RFB 3.8)' | 'ZRLE TrueColor' | 'H.264 / WebRTC Bridge';
  colorDepth: '24-bit TrueColor' | '16-bit HighColor';
  viewOnly: boolean;
  sharedSession: boolean;
  mercorProjectId: string;
  mercorTaskPrompt: string;
  candidateHandle: string;
  sessionToken: string;
}

interface VncMercorFreeMacHubProps {
  activeVdiId: VdiProviderId;
  onSelectVdi: (id: VdiProviderId) => void;
  vncConfig: VncConnectionConfig;
  onUpdateVncConfig: React.Dispatch<React.SetStateAction<VncConnectionConfig>>;
  isRecordingMp4: boolean;
  recordingSec: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onInjectTerminalLog: (vdiId: VdiProviderId, lines: string[]) => void;
}

export const VncMercorFreeMacHub: React.FC<VncMercorFreeMacHubProps> = ({
  activeVdiId,
  onSelectVdi,
  vncConfig,
  onUpdateVncConfig,
  isRecordingMp4,
  recordingSec,
  onStartRecording,
  onStopRecording,
  onInjectTerminalLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'free-macos15-gha' | 'mercor-vnc-share' | 'os-vnc-scripts'>(
    'free-macos15-gha'
  );

  // GitHub Actions Free macos-15 (Apple Silicon M-Chip) Builder State
  const [ghaRunner, setGhaRunner] = useState<'macos-15' | 'macos-15-large'>('macos-15');
  const [ghaResolution, setGhaResolution] = useState<'2560x1440' | '1920x1080' | '2880x1620'>('2560x1440');
  const [ghaSessionHours, setGhaSessionHours] = useState<number>(4);
  const [ghaVncPassword, setGhaVncPassword] = useState<string>('mercor-macos15');
  const [ghaTunnelProvider, setGhaTunnelProvider] = useState<'cloudflare' | 'ngrok'>('cloudflare');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulated GitHub Actions Runner Provisioning State
  const [isProvisioningGha, setIsProvisioningGha] = useState(false);
  const [ghaProvisionStep, setGhaProvisionStep] = useState<number>(0);
  const [generatedTunnelUrl, setGeneratedTunnelUrl] = useState<string>(
    'https://macos15-mchip-sequoia-vdi.trycloudflare.com/vnc.html?autoconnect=true&resize=scale'
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate the complete .github/workflows/macos-15-novnc.yml workflow file
  const githubActionsWorkflowYaml = `name: Free macOS 15 (Apple Silicon M-Chip) VDI + noVNC Cloudflare Tunnel

on:
  workflow_dispatch:
    inputs:
      resolution:
        description: 'macOS Quartz Display Resolution'
        required: true
        default: '${ghaResolution}'
      session_hours:
        description: 'VDI Keep-Alive Duration (Hours, Max 6)'
        required: true
        default: '${ghaSessionHours}'
      mercor_project:
        description: 'Mercor Project / Task Tag'
        required: false
        default: '${vncConfig.mercorProjectId}'

jobs:
  macos15-apple-silicon-vdi:
    name: macOS 15 Sequoia (arm64 M-Chip) noVNC Stream
    runs-on: ${ghaRunner} # Apple Silicon M-Chip (arm64e, 3-Core / 14GB RAM, Free on Public Repos / 2000m Free Tier)
    timeout-minutes: ${ghaSessionHours * 60}

    steps:
      - name: Verify Apple Silicon M-Chip Hardware & Quartz WindowServer
        run: |
          sw_vers
          uname -m
          sysctl -n machdep.cpu.brand_string
          system_profiler SPHardwareDataType

      - name: Install noVNC, Websockify, BetterDisplayCLI & Cloudflare Tunnel
        run: |
          brew install novnc websockify cloudflared

      - name: Configure macOS 15 Screen Sharing (RFB VNC Server on :5900)
        env:
          VNC_PASSWORD: "${ghaVncPassword}"
        run: |
          sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart \\
            -activate -configure -access -on \\
            -clientopts -setvnclegacy -vnclegacy yes \\
            -clientopts -setvncpw -vncpw "\$VNC_PASSWORD" \\
            -restart -agent -privs -all

      - name: Start Websockify Bridge (:6080 -> localhost:5900)
        run: |
          nohup websockify --web=\$(brew --prefix novnc)/share/novnc/ 6080 localhost:5900 > /tmp/websockify.log 2>&1 &
          sleep 2

      - name: Start Free Cloudflare Quick Tunnel & Print Live Browser VDI URL
        run: |
          nohup cloudflared tunnel --no-autoupdate --url http://localhost:6080 > /tmp/cloudflared.log 2>&1 &
          sleep 6
          TUNNEL_URL=\$(grep -o 'https://[-a-z0-9]*\\.trycloudflare\\.com' /tmp/cloudflared.log | head -n 1)
          echo "=========================================================================="
          echo "🍎 FREE APPLE SILICON macOS 15 VDI READY FOR MERCOR SCREEN SHARE!"
          echo "🔗 Live Interactive noVNC URL: \${TUNNEL_URL}/vnc.html?autoconnect=true&resize=scale"
          echo "👁️ Mercor Read-Only Evaluator URL: \${TUNNEL_URL}/vnc.html?autoconnect=true&view_only=true"
          echo "🔑 VNC Password: ${ghaVncPassword}"
          echo "=========================================================================="
          # Keep runner alive for session duration
          sleep ${ghaSessionHours * 3600}
`;

  const handleDownloadWorkflow = () => {
    const blob = new Blob([githubActionsWorkflowYaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macos-15-novnc.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simulate provisioning the GitHub Actions macos-15 runner and wiring it to the macOS 15 VDI desktop
  const handleSimulateGhaProvision = () => {
    if (isProvisioningGha) return;
    setIsProvisioningGha(true);
    setGhaProvisionStep(1);
    onSelectVdi('macos-15-mchip');

    const subdomain = `macos15-mchip-${Math.random().toString(36).substring(2, 7)}`;
    const liveUrl = `https://${subdomain}.trycloudflare.com/vnc.html?autoconnect=true&resize=scale`;

    setTimeout(() => setGhaProvisionStep(2), 650);
    setTimeout(() => setGhaProvisionStep(3), 1350);
    setTimeout(() => {
      setGhaProvisionStep(4);
      setGeneratedTunnelUrl(liveUrl);
      setIsProvisioningGha(false);
      onUpdateVncConfig((prev) => ({
        ...prev,
        isConnected: true,
        mode: 'internal-rfb-bridge',
        tunnelUrl: liveUrl,
        rfbHost: `${subdomain}.trycloudflare.com`,
        rfbPort: 5900,
        wsPath: '/websockify'
      }));
      onInjectTerminalLog('macos-15-mchip', [
        `[GitHub Actions Runner: ${ghaRunner} arm64e] Provisioned macOS 15.3 Sequoia (Apple M-Chip)`,
        '[ARDAgent] macOS Screen Sharing VNC Server listening on 127.0.0.1:5900 (RFB 3.8)',
        '[websockify] Proxying WebSocket :6080 -> 127.0.0.1:5900 (noVNC web root enabled)',
        `[cloudflared] Free Quick Tunnel established: ${liveUrl}`,
        `[Mercor VNC Bridge] Connected session ${vncConfig.mercorProjectId} @ ${ghaResolution} 60FPS`
      ]);
    }, 2100);
  };

  const evaluatorReadOnlyUrl = `${vncConfig.tunnelUrl.split('?')[0]}?autoconnect=true&view_only=true&resize=scale&mercor_project=${encodeURIComponent(
    vncConfig.mercorProjectId
  )}&token=${vncConfig.sessionToken}`;

  const candidateInteractiveUrl = `${vncConfig.tunnelUrl.split('?')[0]}?autoconnect=true&resize=scale&mercor_project=${encodeURIComponent(
    vncConfig.mercorProjectId
  )}`;

  const linuxX11VncScript = `# Amazon WorkSpaces Linux X11 (DISPLAY=:0.0) -> noVNC + Cloudflare Tunnel
sudo apt-get update && sudo apt-get install -y x11vnc novnc python3-websockify wget
x11vnc -display :0.0 -forever -shared -rfbport 5900 -passwd "${ghaVncPassword}" -bg
websockify --web=/usr/share/novnc/ 6080 localhost:5900 &
npx --yes cloudflared tunnel --url http://localhost:6080`;

  const win11VncScript = `# Microsoft 365 Windows 11 Enterprise -> TightVNC + Websockify + Cloudflare Tunnel (PowerShell Admin)
winget install -e --id GlavSoft.TightVNC
winget install -e --id Cloudflare.cloudflared
Start-Process "C:\\Program Files\\TightVNC\\tvnserver.exe" -ArgumentList "-start"
cloudflared tunnel --url tcp://localhost:5900`;

  return (
    <div className="rounded-xl bg-slate-900/95 border border-purple-500/30 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                Truly Free GitHub Actions <code className="text-purple-300 font-mono">macos-15</code> (M-Chip) + noVNC / Cloudflare Tunnel &amp; Mercor VNC Share
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                $0 Free Apple Silicon VDI • RFB 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Spin up a real Apple Silicon macOS 15 Sequoia runner with zero 24-hour AWS lock-in, tunnel via Cloudflare into noVNC, and share live VNC links for Mercor project evaluations.
            </p>
          </div>
        </div>

        {/* Sub-navigation pills */}
        <div className="flex items-center bg-slate-950/90 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('free-macos15-gha')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'free-macos15-gha'
                ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            1. Free GitHub Actions macos-15 + noVNC
          </button>
          <button
            onClick={() => setActiveSubTab('mercor-vnc-share')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'mercor-vnc-share'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            2. Mercor VNC Screen Share &amp; Stream
          </button>
          <button
            onClick={() => setActiveSubTab('os-vnc-scripts')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'os-vnc-scripts'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            3. All-OS VNC Tunnel Commands
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TRULY FREE GITHUB ACTIONS macos-15 (APPLE SILICON M-CHIP) + noVNC / CLOUDFLARE TUNNEL */}
      {activeSubTab === 'free-macos15-gha' && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Configurator & 1-Click Runner Provisioner */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  Apple Silicon Runner Configuration
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Free on Public Repos / 2,000 Min Tier
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">GitHub Runner Image</label>
                  <select
                    value={ghaRunner}
                    onChange={(e) => setGhaRunner(e.target.value as 'macos-15' | 'macos-15-large')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  >
                    <option value="macos-15">macos-15 (Apple M-Chip arm64)</option>
                    <option value="macos-15-large">macos-15-large (12-Core M-Pro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Quartz Display Resolution</label>
                  <select
                    value={ghaResolution}
                    onChange={(e) => setGhaResolution(e.target.value as '2560x1440' | '1920x1080' | '2880x1620')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  >
                    <option value="2560x1440">2560 × 1440 (QHD 60Hz)</option>
                    <option value="2880x1620">2880 × 1620 (Retina HiDPI)</option>
                    <option value="1920x1080">1920 × 1080 (1080p Fast VNC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">VNC Password (RFB :5900)</label>
                  <input
                    type="text"
                    value={ghaVncPassword}
                    onChange={(e) => setGhaVncPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Session Keep-Alive (Max 6h)</label>
                  <select
                    value={ghaSessionHours}
                    onChange={(e) => setGhaSessionHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  >
                    <option value={2}>2 Hours (120 mins)</option>
                    <option value={4}>4 Hours (240 mins)</option>
                    <option value={6}>6 Hours (360 mins Max)</option>
                  </select>
                </div>
              </div>

              {/* Tunnel Provider & Architecture Summary */}
              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-[11px] text-slate-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-purple-300">
                  <span>PIPELINE ARCHITECTURE</span>
                  <span>ZERO AWS 24H LOCK-IN</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  1. <strong className="text-white">ARDAgent Kickstart</strong> enables native macOS 15 Quartz VNC Server on <code className="text-purple-300">:5900</code>
                  <br />
                  2. <strong className="text-white">noVNC + Websockify</strong> bridges TCP <code className="text-purple-300">:5900</code> to WebSockets on <code className="text-purple-300">:6080</code>
                  <br />
                  3. <strong className="text-white">Cloudflare Quick Tunnel</strong> exposes an HTTPS <code className="text-emerald-300">trycloudflare.com</code> URL with zero account or port-forwarding required.
                </p>
              </div>

              {/* Simulate / Connect Button */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleSimulateGhaProvision}
                  disabled={isProvisioningGha}
                  className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all"
                >
                  {isProvisioningGha ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Provisioning macos-15 Runner...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Launch &amp; Connect Free macos-15 noVNC Tunnel
                    </>
                  )}
                </button>
              </div>

              {/* Provisioning Step Progress */}
              {ghaProvisionStep > 0 && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>[1/4] Runner macos-15 (Apple M-Chip arm64e) allocated</span>
                  </div>
                  {ghaProvisionStep >= 2 && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>[2/4] macOS Screen Sharing RFB :5900 + Websockify :6080 active</span>
                    </div>
                  )}
                  {ghaProvisionStep >= 3 && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>[3/4] Cloudflare Tunnel (trycloudflare.com) TLS handshake verified</span>
                    </div>
                  )}
                  {ghaProvisionStep >= 4 && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-2 text-purple-300">
                      <span className="truncate">Live: {generatedTunnelUrl}</span>
                      <button
                        onClick={() => handleCopy('live-gha-url', generatedTunnelUrl)}
                        className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-200 shrink-0"
                      >
                        {copiedId === 'live-gha-url' ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ready-to-Use .github/workflows/macos-15-novnc.yml */}
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-white">
                  .github/workflows/macos-15-novnc.yml
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Drop into any GitHub repo → Actions → Run workflow)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('gha-yaml', githubActionsWorkflowYaml)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1"
                >
                  {copiedId === 'gha-yaml' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied YAML
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Workflow
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadWorkflow}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-[11px] font-semibold text-white flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download .yml
                </button>
              </div>
            </div>
            <pre className="p-3.5 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[340px] leading-relaxed select-all">
              {githubActionsWorkflowYaml}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MERCOR PROJECT VNC SCREEN SHARE & LIVE STREAM CONNECTOR */}
      {activeSubTab === 'mercor-vnc-share' && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Mercor Session & Live noVNC URL Bridge */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Live noVNC / Cloudflare Tunnel Endpoint Connector
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  RFB 3.8 Active
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-slate-400">
                  Paste Live noVNC URL (from GitHub Actions <code className="text-purple-300">trycloudflare.com</code>, ngrok, or custom websockify gateway):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={vncConfig.tunnelUrl}
                    onChange={(e) =>
                      onUpdateVncConfig((prev) => ({
                        ...prev,
                        tunnelUrl: e.target.value
                      }))
                    }
                    placeholder="https://your-tunnel.trycloudflare.com/vnc.html?autoconnect=true&resize=scale"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() =>
                      onUpdateVncConfig((prev) => ({
                        ...prev,
                        mode:
                          prev.mode === 'external-novnc-iframe'
                            ? 'internal-rfb-bridge'
                            : 'external-novnc-iframe'
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      vncConfig.mode === 'external-novnc-iframe'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                        : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white'
                    }`}
                  >
                    {vncConfig.mode === 'external-novnc-iframe'
                      ? 'Switch to Built-In Multi-Window VDI'
                      : 'Embed External noVNC URL in Viewport'}
                  </button>
                </div>
              </div>

              {/* Mercor Project Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Mercor Project / Rubric ID</label>
                  <input
                    type="text"
                    value={vncConfig.mercorProjectId}
                    onChange={(e) =>
                      onUpdateVncConfig((prev) => ({ ...prev, mercorProjectId: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">RFB Stream Encoding</label>
                  <select
                    value={vncConfig.encoding}
                    onChange={(e) =>
                      onUpdateVncConfig((prev) => ({
                        ...prev,
                        encoding: e.target.value as VncConnectionConfig['encoding']
                      }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                  >
                    <option value="Tight + Zlib (RFB 3.8)">Tight + Zlib (RFB 3.8)</option>
                    <option value="ZRLE TrueColor">ZRLE TrueColor</option>
                    <option value="H.264 / WebRTC Bridge">H.264 / WebRTC Bridge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Access Control Mode</label>
                  <button
                    onClick={() =>
                      onUpdateVncConfig((prev) => ({ ...prev, viewOnly: !prev.viewOnly }))
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 ${
                      vncConfig.viewOnly
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {vncConfig.viewOnly ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        View-Only Spectator
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Interactive Mouse/KB
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Shareable Mercor VNC Links & Task Recording */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Shareable Mercor VNC Screen Share Links
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Multi-Viewer RFB Shared</span>
              </div>

              {/* Evaluator Read-Only Link */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Mercor Reviewer Link (Read-Only Spectator)
                  </span>
                  <button
                    onClick={() => handleCopy('eval-url', evaluatorReadOnlyUrl)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 'eval-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'eval-url' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate select-all">
                  {evaluatorReadOnlyUrl}
                </div>
              </div>

              {/* Candidate Interactive Link */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    Interactive VNC Collaborator Link (Full Control)
                  </span>
                  <button
                    onClick={() => handleCopy('cand-url', candidateInteractiveUrl)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-200 flex items-center gap-1"
                  >
                    {copiedId === 'cand-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'cand-url' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate select-all">
                  {candidateInteractiveUrl}
                </div>
              </div>

              {/* Mercor Task Recording Action */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400">
                  Capture VNC session artifact (<code className="text-slate-200">.mp4</code>):
                </div>
                {!isRecordingMp4 ? (
                  <button
                    onClick={onStartRecording}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Circle className="w-3 h-3 fill-white" />
                    Record Mercor VNC (.mp4)
                  </button>
                ) : (
                  <button
                    onClick={onStopRecording}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 animate-pulse"
                  >
                    <Square className="w-3 h-3 fill-slate-950" />
                    Stop VNC Recording ({recordingSec}s)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ALL-OS VNC TUNNEL SCRIPTS (macOS 15, Linux X11, Windows 11) */}
      {activeSubTab === 'os-vnc-scripts' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300">1. Linux X11 (x11vnc + noVNC)</span>
                <button
                  onClick={() => handleCopy('x11-script', linuxX11VncScript)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-200"
                >
                  {copiedId === 'x11-script' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {linuxX11VncScript}
              </pre>
            </div>
            <button
              onClick={() => {
                onSelectVdi('aws-workspaces');
                onInjectTerminalLog('aws-workspaces', [
                  '[x11vnc] Listening on DISPLAY=:0.0 RFB port 5900',
                  '[websockify] Serving noVNC on http://localhost:6080/vnc.html'
                ]);
              }}
              className="w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold"
            >
              Run in Linux X11 VDI Terminal
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-sky-300">2. Windows 11 (TightVNC + Tunnel)</span>
                <button
                  onClick={() => handleCopy('win11-script', win11VncScript)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-200"
                >
                  {copiedId === 'win11-script' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {win11VncScript}
              </pre>
            </div>
            <button
              onClick={() => {
                onSelectVdi('m365-win11');
                onInjectTerminalLog('m365-win11', [
                  '[TightVNC Server] Win32 DWM Mirror Driver bound to port 5900',
                  '[cloudflared] Tunneling tcp://localhost:5900 for Mercor Screen Share'
                ]);
              }}
              className="w-full py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-semibold"
            >
              Run in Windows 11 PowerShell
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-300">3. macOS 15 Sequoia (ARDAgent + noVNC)</span>
                <button
                  onClick={() => handleCopy('mac-script', githubActionsWorkflowYaml)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-200"
                >
                  {copiedId === 'mac-script' ? 'Copied!' : 'Copy YAML'}
                </button>
              </div>
              <pre className="p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {`# Enable macOS 15 Quartz VNC (:5900) + noVNC (:6080)
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -activate -configure -access -on -clientopts -setvnclegacy -vnclegacy yes -clientopts -setvncpw -vncpw "${ghaVncPassword}" -restart -agent -privs -all
websockify --web=\$(brew --prefix novnc)/share/novnc/ 6080 localhost:5900 &
cloudflared tunnel --url http://localhost:6080`}
              </pre>
            </div>
            <button
              onClick={handleSimulateGhaProvision}
              className="w-full py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold"
            >
              Run in macOS 15 iTerm2 &amp; Connect Tunnel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
