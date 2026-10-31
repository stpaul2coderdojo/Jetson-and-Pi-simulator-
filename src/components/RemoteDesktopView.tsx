import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Monitor,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Maximize2,
  Minimize2,
  Clipboard,
  Check,
  Layers,
  Activity,
  Code2,
  Camera,
  Server,
  Sparkles,
  Laptop,
  Command,
  ShieldCheck,
  Video,
  Circle,
  Square,
  Download,
  Film,
  Trash2,
  Folder,
  FileText,
  Search,
  Settings,
  LayoutGrid,
  Plus,
  Play,
  ChevronRight,
  Globe,
  Eye,
  Share2
} from 'lucide-react';
import { VncMercorFreeMacHub, VncConnectionConfig } from './VncMercorFreeMacHub';

export type VdiProviderId = 'aws-workspaces' | 'm365-win11' | 'macos-15-mchip';
export type DesktopWindowId = 'terminal' | 'files' | 'ide' | 'monitor';
export type WindowArrangement = 'cascade' | 'tiled-2x2' | 'left-right' | 'maximized';

export interface WindowState {
  id: DesktopWindowId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FileEntry {
  name: string;
  type: 'folder' | 'file';
  size: string;
  modified: string;
  permissions: string;
  contentPreview?: string;
}

export interface VdiInstance {
  id: VdiProviderId;
  name: string;
  providerBadge: string;
  osName: string;
  osVersion: string;
  windowSystem: string;
  architecture: string;
  cpuModel: string;
  cores: string;
  gpuModel: string;
  memoryGb: number;
  storageDesc: string;
  protocol: string;
  region: string;
  privateIp: string;
  hostname: string;
  resolution: string;
  refreshRateHz: number;
  status: 'RUNNING' | 'REBOOTING';
  latencyMs: number;
  bandwidthMbps: number;
  fps: number;
  cpuLoad: number;
  ramUsedGb: number;
  gpuLoad: number;
  uptime: string;
}

export interface RecordedDesktopMp4 {
  id: string;
  filename: string;
  vdiId: VdiProviderId;
  vdiName: string;
  windowSystem: string;
  durationSec: number;
  sizeMb: string;
  resolution: string;
  fps: number;
  codec: string;
  createdAt: string;
  videoUrl: string;
  activeWindowsSummary: string;
}

const INITIAL_VDI_INSTANCES: Record<VdiProviderId, VdiInstance> = {
  'aws-workspaces': {
    id: 'aws-workspaces',
    name: 'Amazon WorkSpaces — Linux X11 Desktop',
    providerBadge: 'AWS WorkSpaces Linux X11',
    osName: 'Ubuntu 24.04.1 LTS (X.Org X11R7.7)',
    osVersion: 'Kernel 6.8.0-45-aws • XFCE4 / Xfwm4 Window Manager',
    windowSystem: 'X11 / X.Org Server 21.1.11 (DISPLAY=:0.0)',
    architecture: 'x86_64 (AMD EPYC 7R13)',
    cpuModel: 'AMD EPYC 7R13 64-Core Processor',
    cores: '16 vCPU',
    gpuModel: 'NVIDIA L4 Tensor Core (24 GB VRAM • GLX 1.4)',
    memoryGb: 64,
    storageDesc: '500 GB gp3 NVMe (3,000 IOPS)',
    protocol: 'AWS WSP / X11-over-WebRTC H.265',
    region: 'us-west-2 (Oregon) • AZ-a',
    privateIp: '10.24.88.142',
    hostname: 'ws-x11-ubuntu24.ec2.internal',
    resolution: '2560 × 1440',
    refreshRateHz: 60,
    status: 'RUNNING',
    latencyMs: 14,
    bandwidthMbps: 36.4,
    fps: 60,
    cpuLoad: 28,
    ramUsedGb: 18.4,
    gpuLoad: 32,
    uptime: '14d 07h 22m'
  },
  'm365-win11': {
    id: 'm365-win11',
    name: 'Amazon WorkSpaces on Browser — Web Access (WSP)',
    providerBadge: 'AWS WorkSpaces Web Access',
    osName: 'Amazon WorkSpaces PowerPro Bundle (WSP 2.0 HTML5 Browser)',
    osVersion: 'clients.amazonworkspaces.com/webclient • DeviceTypeWeb=ALLOW',
    windowSystem: 'AWS WSP 2.0 Browser Client (WebRTC H.264 / HTTPS 443)',
    architecture: 'x86_64 (AWS Nitro System • Intel Xeon 8375C)',
    cpuModel: 'Intel Xeon Scalable 8375C @ 3.50GHz (PowerPro)',
    cores: '8 vCPU',
    gpuModel: 'AWS GraphicsPro G4dn NVIDIA T4 (16 GB VRAM • WSP)',
    memoryGb: 32,
    storageDesc: '175 GB Root + 100 GB User KMS-Encrypted EBS gp3',
    protocol: 'Amazon WSP 2.0 over WebRTC (Browser HTTPS/UDP 4195)',
    region: 'us-west-2 (Oregon) • Directory d-9267481a2b',
    privateIp: '10.0.14.88',
    hostname: 'ws-9f84c2a10.corp.edge-vdi.aws',
    resolution: '2560 × 1440',
    refreshRateHz: 60,
    status: 'RUNNING',
    latencyMs: 15,
    bandwidthMbps: 31.2,
    fps: 60,
    cpuLoad: 22,
    ramUsedGb: 11.6,
    gpuLoad: 18,
    uptime: '11d 04h 19m'
  },
  'macos-15-mchip': {
    id: 'macos-15-mchip',
    name: 'macOS 15 Sequoia — Apple Silicon M4 Max (Amazon DCV & bVNC SSH)',
    providerBadge: 'Amazon DCV & bVNC Console',
    osName: 'macOS Sequoia 15.3 (Darwin 24.3.0)',
    osVersion: 'Build 24D60 • arm64e Quartz Compositor • launchctl gui/501',
    windowSystem: 'macOS WindowServer (Metal 3 Quartz) • DCV Console Session',
    architecture: 'arm64 (Apple M4 Max SoC)',
    cpuModel: 'Apple M4 Max (12P + 4E Cores)',
    cores: '16-Core CPU / 40-Core GPU / 16-Core ANE',
    gpuModel: 'Apple M4 Max Integrated 40-Core Metal 3',
    memoryGb: 64,
    storageDesc: '1 TB Apple Fabric NVMe (7.4 GB/s)',
    protocol: 'Amazon DCV (QUIC :8443) • launchctl bootstrap gui/501 (bVNC SSH :5900)',
    region: 'us-west-sjc1 (Bare-Metal / EC2 Mac)',
    privateIp: '192.168.108.55',
    hostname: 'mac2-m4max-sequoia.local',
    resolution: '2880 × 1620 (HiDPI)',
    refreshRateHz: 120,
    status: 'RUNNING',
    latencyMs: 11,
    bandwidthMbps: 48.5,
    fps: 120,
    cpuLoad: 16,
    ramUsedGb: 21.8,
    gpuLoad: 24,
    uptime: '27d 11h 05m'
  }
};

const DEFAULT_WINDOWS_BY_VDI: Record<VdiProviderId, Record<DesktopWindowId, WindowState>> = {
  'aws-workspaces': {
    terminal: {
      id: 'terminal',
      title: 'xterm — ws-user@ws-x11-ubuntu24: ~/workspace (DISPLAY=:0.0)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 4,
      x: 24,
      y: 20,
      width: 48,
      height: 46
    },
    files: {
      id: 'files',
      title: 'Thunar File Manager — /home/ws-user/workspace',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      x: 51,
      y: 20,
      width: 47,
      height: 46
    },
    ide: {
      id: 'ide',
      title: 'Code - OSS (X11) — x11_window_pipeline.py',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      x: 24,
      y: 50,
      width: 48,
      height: 46
    },
    monitor: {
      id: 'monitor',
      title: 'NVIDIA X Server Settings & xosview — DISPLAY :0.0',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      x: 51,
      y: 50,
      width: 47,
      height: 46
    }
  },
  'm365-win11': {
    files: {
      id: 'files',
      title: 'WorkSpaces Browser File Manager — D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 4,
      x: 20,
      y: 18,
      width: 48,
      height: 46
    },
    terminal: {
      id: 'terminal',
      title: 'AWS CLI & WorkSpaces WSP Shell — ws-9f84c2a10 (DeviceTypeWeb=ALLOW)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      x: 50,
      y: 18,
      width: 48,
      height: 46
    },
    ide: {
      id: 'ide',
      title: 'AWS CloudFormation & Terraform IaC Studio — aws-workspaces-browser-stack.yaml',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      x: 20,
      y: 50,
      width: 48,
      height: 46
    },
    monitor: {
      id: 'monitor',
      title: 'Amazon WorkSpaces WSP 2.0 Browser Telemetry & CloudWatch Session Monitor',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      x: 50,
      y: 50,
      width: 48,
      height: 46
    }
  },
  'macos-15-mchip': {
    files: {
      id: 'files',
      title: 'Finder — Macintosh HD ▸ Users ▸ dev-m4max ▸ Projects',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 4,
      x: 18,
      y: 16,
      width: 48,
      height: 46
    },
    terminal: {
      id: 'terminal',
      title: 'iTerm2 — dev-m4max@mac2-m4max-sequoia — zsh (arm64e)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      x: 50,
      y: 16,
      width: 48,
      height: 46
    },
    ide: {
      id: 'ide',
      title: 'Xcode 16.2 — MetalComputeEngine.swift',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      x: 18,
      y: 49,
      width: 48,
      height: 46
    },
    monitor: {
      id: 'monitor',
      title: 'Activity Monitor — All Processes (Apple M4 Max)',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      x: 50,
      y: 49,
      width: 48,
      height: 46
    }
  }
};

const FILESYSTEM_BY_VDI: Record<VdiProviderId, Record<string, FileEntry[]>> = {
  'aws-workspaces': {
    '/home/ws-user/workspace': [
      { name: 'x11_window_pipeline.py', type: 'file', size: '14.2 KB', modified: 'Today 03:22', permissions: '-rwxr-xr-x', contentPreview: 'import Xlib\nfrom Xlib import display, X\nd = display.Display(":0.0")\nroot = d.screen().root\nprint("Connected to X.Org Server", d.get_display_name())' },
      { name: 'xorg.conf.d', type: 'folder', size: '4.0 KB', modified: 'Yesterday', permissions: 'drwxr-xr-x' },
      { name: 'tensorrt_engine.plan', type: 'file', size: '184.6 MB', modified: 'Today 01:15', permissions: '-rw-r--r--', contentPreview: 'Binary TensorRT FP16 Serialized Engine (NVIDIA L4 sm_89)' },
      { name: 'docker-compose.x11.yml', type: 'file', size: '2.8 KB', modified: '2 days ago', permissions: '-rw-r--r--', contentPreview: 'services:\n  x11-desktop:\n    environment:\n      - DISPLAY=:0.0\n    volumes:\n      - /tmp/.X11-unix:/tmp/.X11-unix:rw' },
      { name: '.Xauthority', type: 'file', size: '128 B', modified: 'Today 00:04', permissions: '-rw-------', contentPreview: 'MIT-MAGIC-COOKIE-1 9f84c201a7e3b9104d2c...' }
    ],
    '/etc/X11': [
      { name: 'xorg.conf', type: 'file', size: '3.4 KB', modified: 'Oct 02', permissions: '-rw-r--r--', contentPreview: 'Section "Device"\n  Identifier "NVIDIA L4"\n  Driver "nvidia"\n  BusID "PCI:0:30:0"\nEndSection' },
      { name: 'Xsession', type: 'file', size: '5.1 KB', modified: 'Sep 19', permissions: '-rwxr-xr-x', contentPreview: '#!/bin/sh\n# /etc/X11/Xsession - run by xdm/lightdm' },
      { name: 'app-defaults', type: 'folder', size: '4.0 KB', modified: 'Aug 14', permissions: 'drwxr-xr-x' }
    ]
  },
  'm365-win11': {
    'D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack': [
      { name: 'aws-workspaces-browser-stack.yaml', type: 'file', size: '12.6 KB', modified: 'Today 04:15', permissions: 'CloudFormation', contentPreview: 'AWSTemplateFormatVersion: "2010-09-09"\nDescription: Amazon WorkSpaces WSP Browser Access Stack\nResources:\n  WorkSpacesDirectory:\n    Type: AWS::DirectoryService::MicrosoftAD\n  BrowserWorkSpace:\n    Type: AWS::WorkSpaces::Workspace' },
      { name: 'main.tf', type: 'file', size: '8.4 KB', modified: 'Today 04:12', permissions: 'Terraform HCL', contentPreview: 'resource "aws_workspaces_directory" "browser_vdi" {\n  directory_id = aws_directory_service_directory.ad.id\n  workspace_access_properties {\n    device_type_web = "ALLOW"\n  }\n}' },
      { name: 'enable-browser-access.sh', type: 'file', size: '3.2 KB', modified: 'Today 04:05', permissions: 'AWS CLI Script', contentPreview: 'aws workspaces modify-workspace-access-properties \\\n  --resource-id d-9267481a2b \\\n  --workspace-access-properties DeviceTypeWeb=ALLOW,DeviceTypeOsx=ALLOW' },
      { name: 'wsp-webrtc-policy.json', type: 'file', size: '4.9 KB', modified: 'Yesterday', permissions: 'IAM / WSP Policy', contentPreview: '{\n  "Protocol": "WSP",\n  "WebAccess": "ENABLED",\n  "ClientUrl": "https://clients.amazonworkspaces.com/webclient",\n  "ClipboardRedirection": true\n}' },
      { name: 'CloudWatch_WSP_Logs', type: 'folder', size: '64.0 MB', modified: 'Today 03:50', permissions: 'Directory' }
    ],
    'C:\\Program Files\\Amazon\\WSP': [
      { name: 'wsp-host-service.exe', type: 'file', size: '6.40 MB', modified: 'WSP 2.0.14', permissions: 'AWS Service', contentPreview: 'Amazon WorkSpaces Streaming Protocol (WSP) H.264/WebRTC Host Agent' },
      { name: 'dcv-webrtc-gateway.dll', type: 'file', size: '3.18 MB', modified: 'WSP 2.0.14', permissions: 'AWS Service', contentPreview: 'HTTPS/WSS 443 & UDP 4195 Browser Media Transport' },
      { name: 'workspaces-agent.json', type: 'file', size: '1.85 KB', modified: 'WSP 2.0.14', permissions: 'Config', contentPreview: '{"registrationCode": "WSP+us-west-2+9XK4P2", "webAccess": true}' }
    ]
  },
  'macos-15-mchip': {
    '/Users/dev-m4max/Projects': [
      { name: 'setup-amazon-dcv-macos.sh', type: 'file', size: '3.8 KB', modified: 'Just now', permissions: '-rwxr-xr-x', contentPreview: '#!/usr/bin/env bash\n# Amazon DCV Server Setup on macOS (Apple Silicon arm64)\nsudo installer -pkg nice-dcv-server-macos-arm64.pkg -target /\nsudo launchctl bootstrap system /Library/LaunchDaemons/com.nicesoftware.dcvserver.plist\nsudo dcv create-session --type console --owner $(whoami) console' },
      { name: 'launchctl-bootstrap-bvnc-console.sh', type: 'file', size: '3.4 KB', modified: 'Just now', permissions: '-rwxr-xr-x', contentPreview: '#!/usr/bin/env bash\n# launchctl bootstrap a Console Session for bVNC over SSH\nsudo systemsetup -setremotelogin on\nlaunchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.bvnc.macconsole.plist' },
      { name: 'com.bvnc.macconsole.plist', type: 'file', size: '920 B', modified: 'Just now', permissions: '-rw-r--r--', contentPreview: '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n  <key>Label</key><string>com.bvnc.macconsole</string>\n  <key>ProgramArguments</key><array><string>/System/Library/CoreServices/RemoteManagement/AppleVNCServer.bundle/Contents/MacOS/AppleVNCServer</string></array>\n  <key>LimitLoadToSessionType</key><array><string>Aqua</string></array>\n</dict>\n</plist>' },
      { name: 'dcv.conf', type: 'file', size: '1.4 KB', modified: 'Just now', permissions: '-rw-r--r--', contentPreview: '[session-management]\ncreate-session = true\n[display]\nresolution = "2880x1620"\n[connectivity]\nweb-port = 8443\nenable-quic = true' },
      { name: 'bvnc-connection-profile.json', type: 'file', size: '840 B', modified: 'Just now', permissions: '-rw-r--r--', contentPreview: '{\n  "connectionType": "SSH_TUNNELED_VNC",\n  "sshHost": "mac2-m4max-sequoia.local",\n  "sshPort": 22,\n  "vncTarget": "127.0.0.1:5900"\n}' },
      { name: 'MetalComputeEngine.swift', type: 'file', size: '21.6 KB', modified: 'Today 03:31', permissions: 'rw-r--r--', contentPreview: 'import Metal\nimport MetalPerformanceShadersGraph\nimport AppKit\n\n@MainActor\nfinal class QuartzWorkspaceController {\n    let device = MTLCreateSystemDefaultDevice()!\n}' },
      { name: 'SequoiaWindowTiling.plist', type: 'file', size: '3.1 KB', modified: 'Yesterday', permissions: 'rw-r--r--', contentPreview: '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n  <key>StageManagerEnabled</key><true/>\n  <key>QuartzHiDPI</key><string>2880x1620@120Hz</string>\n</dict>\n</plist>' },
      { name: 'MLX_Checkpoints', type: 'folder', size: '1.2 GB', modified: 'Today 01:40', permissions: 'rwxr-xr-x' }
    ],
    '/Applications': [
      { name: 'Xcode.app', type: 'folder', size: '12.4 GB', modified: '16.2 (16C5032a)', permissions: 'rwxr-xr-x' },
      { name: 'iTerm.app', type: 'folder', size: '94.2 MB', modified: '3.5.5 arm64e', permissions: 'rwxr-xr-x' },
      { name: 'Activity Monitor.app', type: 'folder', size: '18.6 MB', modified: 'macOS 15.3', permissions: 'rwxr-xr-x' }
    ]
  }
};

const INITIAL_TERMINAL_LOGS: Record<VdiProviderId, string[]> = {
  'aws-workspaces': [
    'Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-aws x86_64)',
    'X.Org X Server 1.21.1.11 • Release Date: 2024-04-12 • Protocol Version 11, Revision 0',
    'ws-user@ws-x11-ubuntu24:~/workspace$ echo $DISPLAY && xdpyinfo | head -n 5',
    ':0.0',
    'name of display:    :0.0',
    'version number:    11.0',
    'vendor string:    The X.Org Foundation',
    'default screen number:    0',
    'ws-user@ws-x11-ubuntu24:~/workspace$ wmctrl -l',
    '0x01800003  0 ws-x11-ubuntu24 xterm — ws-user@ws-x11-ubuntu24',
    '0x02400007  0 ws-x11-ubuntu24 Thunar File Manager — /home/ws-user/workspace',
    '0x03200012  0 ws-x11-ubuntu24 Code - OSS (X11) — x11_window_pipeline.py',
    '0x0400000a  0 ws-x11-ubuntu24 NVIDIA X Server Settings — DISPLAY :0.0'
  ],
  'm365-win11': [
    'Amazon WorkSpaces WSP 2.0 Browser Shell • Region: us-west-2 • WorkspaceId: ws-9f84c2a10',
    'Browser Client Endpoint: https://clients.amazonworkspaces.com/webclient#/session/ws-9f84c2a10',
    'aws-admin@ws-9f84c2a10 D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack> aws workspaces describe-workspaces --workspace-ids ws-9f84c2a10',
    '{',
    '  "Workspaces": [{',
    '    "WorkspaceId": "ws-9f84c2a10",',
    '    "DirectoryId": "d-9267481a2b",',
    '    "UserName": "ws-admin",',
    '    "IpAddress": "10.0.14.88",',
    '    "State": "AVAILABLE",',
    '    "BundleId": "wsb-8vbl42p1r (PowerPro 8vCPU 32GB WSP)",',
    '    "WorkspaceProperties": { "Protocols": ["WSP"], "RunningMode": "AUTO_STOP" }',
    '  }]',
    '}',
    'aws-admin@ws-9f84c2a10 D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack> aws workspaces describe-workspace-directories --directory-ids d-9267481a2b --query "Directories[0].WorkspaceAccessProperties"',
    '{ "DeviceTypeWeb": "ALLOW", "DeviceTypeOsx": "ALLOW", "DeviceTypeLinux": "ALLOW" }'
  ],
  'macos-15-mchip': [
    'Last login: Thu Oct  8 03:20:11 on ttys000 (Apple Silicon arm64e)',
    'dev-m4max@mac2-m4max-sequoia ~/Projects % sw_vers && uname -m',
    'ProductName:            macOS Sequoia',
    'ProductVersion:         15.3 (Build 24D60)',
    'arm64 (Apple M4 Max 16-Core CPU / 40-Core GPU)',
    'dev-m4max@mac2-m4max-sequoia ~/Projects % launchctl print gui/501/com.bvnc.macconsole | head -n 4',
    'com.bvnc.macconsole = {',
    '    active count = 1',
    '    state = running (PID 41209)',
    '    path = /System/Library/CoreServices/RemoteManagement/AppleVNCServer.bundle/Contents/MacOS/AppleVNCServer',
    '}',
    'dev-m4max@mac2-m4max-sequoia ~/Projects % dcv describe-sessions',
    '{ "sessions": [{ "id": "console", "owner": "dev-m4max", "type": "console", "port": 8443, "quic": true }] }',
    'dev-m4max@mac2-m4max-sequoia ~/Projects % echo "[Amazon DCV WebRTC] https://mac2-m4max-sequoia.local:8443#console"',
    'dev-m4max@mac2-m4max-sequoia ~/Projects % echo "[bVNC over SSH] Loopback 127.0.0.1:5900 via ssh -L 5900:127.0.0.1:5900"'
  ]
};

const INITIAL_IDE_CODE: Record<VdiProviderId, string> = {
  'aws-workspaces': `#!/usr/bin/env python3
# X11 / X.Org Native Window Inspector & GLX Frame Compositor (Ubuntu 24.04 AWS WorkSpaces)
import os
import time

class X11WorkspaceSession:
    def __init__(self, display_id=":0.0"):
        self.display = display_id
        self.window_manager = "Xfwm4 / X.Org 21.1.11"
        self.gpu_renderer = "NVIDIA L4 GLX 1.4"

    def query_x11_tree(self):
        return [
            {"xid": "0x01800003", "class": "XTerm", "geometry": "1240x720+40+40"},
            {"xid": "0x02400007", "class": "Thunar", "geometry": "1240x720+1290+40"},
            {"xid": "0x03200012", "class": "Code-OSS", "geometry": "1240x720+40+780"},
        ]

if __name__ == "__main__":
    session = X11WorkspaceSession()
    print(f"[X11] Connected to {session.display} ({session.window_manager})")
    for win in session.query_x11_tree():
        print(f"  -> Window {win['xid']} [{win['class']}] @ {win['geometry']}")`,

  'm365-win11': `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Amazon WorkSpaces on Browser (WSP Web Access) + Directory + VPC Stack'
Resources:
  WorkSpacesBrowserDirectory:
    Type: AWS::DirectoryService::MicrosoftAD
    Properties:
      Name: corp.edge-vdi.aws
      Edition: Standard
      Password: '{{resolve:secretsmanager:WorkSpacesADPassword}}'
      VpcSettings:
        VpcId: !Ref WorkSpacesVPC
        SubnetIds: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]

  BrowserEnabledWorkSpace:
    Type: AWS::WorkSpaces::Workspace
    Properties:
      DirectoryId: !Ref WorkSpacesBrowserDirectory
      UserName: ws-admin
      BundleId: wsb-8vbl42p1r # PowerPro 8 vCPU / 32 GB RAM (WSP Protocol)
      RootVolumeEncryptionEnabled: true
      UserVolumeEncryptionEnabled: true
      WorkspaceProperties:
        RunningMode: AUTO_STOP
        RunningModeAutoStopTimeoutInMinutes: 60
        ComputeTypeName: POWERPRO`,

  'macos-15-mchip': `// macOS 15 Sequoia — Apple M4 Max Quartz WindowServer & Metal 3 Workspace
import Foundation
import Metal

struct QuartzWindowDescriptor {
    let windowNumber: Int
    let ownerName: String
    let bounds: String
    let stageCluster: Int
}

final class SequoiaWorkspaceEngine {
    let socName = "Apple M4 Max (16-Core CPU / 40-Core Metal 3 GPU)"
    
    func listOnScreenWindows() -> [QuartzWindowDescriptor] {
        return [
            QuartzWindowDescriptor(windowNumber: 1402, ownerName: "Finder", bounds: "{0, 28, 1440, 800}", stageCluster: 1),
            QuartzWindowDescriptor(windowNumber: 1408, ownerName: "iTerm2", bounds: "{1440, 28, 1440, 800}", stageCluster: 1),
            QuartzWindowDescriptor(windowNumber: 1419, ownerName: "Xcode", bounds: "{0, 828, 1440, 792}", stageCluster: 1)
        ]
    }
}`
};

export const RemoteDesktopView: React.FC = () => {
  const [activeVdiId, setActiveVdiId] = useState<VdiProviderId>('m365-win11');
  const [layoutMode, setLayoutMode] = useState<'single-desktop' | 'triple-vdi-grid'>('single-desktop');
  const [vdiMap, setVdiMap] = useState<Record<VdiProviderId, VdiInstance>>(INITIAL_VDI_INSTANCES);
  const [showAwsConfigStack, setShowAwsConfigStack] = useState<boolean>(true);
  const [awsStackTab, setAwsStackTab] = useState<'cloudformation' | 'terraform' | 'aws-cli' | 'workspaces-web-portal'>('cloudformation');
  const [awsRegion, setAwsRegion] = useState<string>('us-west-2');
  const [awsBundleType, setAwsBundleType] = useState<'POWERPRO_WSP' | 'PERFORMANCE_WSP' | 'GRAPHICS_G4DN_WSP'>('POWERPRO_WSP');
  const [awsRunningMode, setAwsRunningMode] = useState<'AUTO_STOP' | 'ALWAYS_ON'>('AUTO_STOP');
  const [awsCopiedStack, setAwsCopiedStack] = useState<string | null>(null);

  // Per-VDI Multi-Window Desktop State
  const [windowsByVdi, setWindowsByVdi] = useState<Record<VdiProviderId, Record<DesktopWindowId, WindowState>>>(
    DEFAULT_WINDOWS_BY_VDI
  );

  // Per-VDI File Browser State
  const [currentPathByVdi, setCurrentPathByVdi] = useState<Record<VdiProviderId, string>>({
    'aws-workspaces': '/home/ws-user/workspace',
    'm365-win11': 'D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack',
    'macos-15-mchip': '/Users/dev-m4max/Projects'
  });
  const [selectedFileByVdi, setSelectedFileByVdi] = useState<Record<VdiProviderId, FileEntry | null>>({
    'aws-workspaces': FILESYSTEM_BY_VDI['aws-workspaces']['/home/ws-user/workspace'][0],
    'm365-win11': FILESYSTEM_BY_VDI['m365-win11']['D:\\Users\\ws-admin\\AWS-WorkSpaces-Stack'][0],
    'macos-15-mchip': FILESYSTEM_BY_VDI['macos-15-mchip']['/Users/dev-m4max/Projects'][0]
  });

  // Per-VDI Terminal & IDE State
  const [terminalLogs, setTerminalLogs] = useState<Record<VdiProviderId, string[]>>(INITIAL_TERMINAL_LOGS);
  const [commandInput, setCommandInput] = useState<string>('');
  const [ideCodeByVdi, setIdeCodeByVdi] = useState<Record<VdiProviderId, string>>(INITIAL_IDE_CODE);

  // OS Shell menus (Start Menu for Win11, Applications Menu for X11, Apple Menu / Stage Manager for macOS)
  const [win11StartOpen, setWin11StartOpen] = useState(false);
  const [x11MenuOpen, setX11MenuOpen] = useState(false);
  const [macAppleMenuOpen, setMacAppleMenuOpen] = useState(false);
  const [macStageManager, setMacStageManager] = useState(true);
  const [x11WorkspaceNum, setX11WorkspaceNum] = useState<number>(1);

  // Fullscreen & Clipboard
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboardSynced, setClipboardSynced] = useState(false);

  // Live WebRTC RTCPeerConnection Desktop Streamer (shares Linux X11, Windows 11, macOS 15, or All-3-OS Matrix)
  const webrtcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webrtcVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcSenderRef = useRef<RTCPeerConnection | null>(null);
  const pcReceiverRef = useRef<RTCPeerConnection | null>(null);
  const [isWebRtcStreaming, setIsWebRtcStreaming] = useState<boolean>(true);
  const [showWebRtcMonitor, setShowWebRtcMonitor] = useState<boolean>(true);
  const [webRtcTargetMode, setWebRtcTargetMode] = useState<'active-os' | 'linux-x11' | 'win11' | 'macos-15' | 'all-os'>('active-os');
  const [webRtcBitrateMbps, setWebRtcBitrateMbps] = useState<string>('6.4');

  // Synchronize active OS & terminal/IDE state to /vnc.html via BroadcastChannel so left & right browser windows stay in sync
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('mercor-vdi-webrtc-bus');
      const mappedOs =
        webRtcTargetMode !== 'active-os'
          ? webRtcTargetMode
          : layoutMode === 'triple-vdi-grid'
          ? 'all-os'
          : activeVdiId === 'aws-workspaces'
          ? 'linux-x11'
          : activeVdiId === 'm365-win11'
          ? 'win11'
          : 'macos-15';
      bc.postMessage({
        osMode: mappedOs,
        activeVdiId,
        terminalLogs: terminalLogs[activeVdiId]?.slice(-7) || []
      });
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.fromVncHtml && ev.data.osMode) {
          const incoming = ev.data.osMode as 'linux-x11' | 'win11' | 'macos-15' | 'all-os';
          setWebRtcTargetMode(incoming);
          if (incoming === 'linux-x11') {
            setActiveVdiId('aws-workspaces');
            setLayoutMode('single-desktop');
          } else if (incoming === 'win11') {
            setActiveVdiId('m365-win11');
            setLayoutMode('single-desktop');
          } else if (incoming === 'macos-15') {
            setActiveVdiId('macos-15-mchip');
            setLayoutMode('single-desktop');
          } else if (incoming === 'all-os') {
            setLayoutMode('triple-vdi-grid');
          }
        }
      };
      return () => bc.close();
    } catch {
      return undefined;
    }
  }, [activeVdiId, layoutMode, webRtcTargetMode, terminalLogs]);

  // Continuous 60 FPS WebRTC Desktop Compositor & RTCPeerConnection Loopback
  useEffect(() => {
    const canvas = webrtcCanvasRef.current;
    if (!canvas || !isWebRtcStreaming) return;

    let animId: number;
    let tick = 0;

    const drawOsRegion = (
      ctx: CanvasRenderingContext2D,
      vdiId: VdiProviderId,
      rx: number,
      ry: number,
      rw: number,
      rh: number
    ) => {
      const vdi = vdiMap[vdiId];
      const wins = windowsByVdi[vdiId];
      const openWins = (Object.values(wins) as WindowState[]).filter((w) => w.isOpen && !w.isMinimized);

      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      // OS Wallpaper
      const grad = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
      if (vdiId === 'aws-workspaces') {
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#111827');
        grad.addColorStop(1, '#1e1b4b');
      } else if (vdiId === 'm365-win11') {
        grad.addColorStop(0, '#082f49');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e3a8a');
      } else {
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#3b0764');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);

      // Top OS Panel / Menu Bar
      ctx.fillStyle = '#090d16';
      ctx.fillRect(rx, ry, rw, 28);
      ctx.fillStyle = vdiId === 'aws-workspaces' ? '#fbbf24' : vdiId === 'm365-win11' ? '#38bdf8' : '#e9d5ff';
      ctx.font = 'bold 11px monospace';
      const topLabel =
        vdiId === 'aws-workspaces'
          ? `X11 DISPLAY=:0.0 • X.Org 21.1.11 (XFCE4) • ${vdi.resolution}`
          : vdiId === 'm365-win11'
          ? `Amazon WorkSpaces on Browser (WSP 2.0) • clients.amazonworkspaces.com • ${vdi.resolution}`
          : ` macOS 15.3 Sequoia (Quartz Metal 3) • Apple M4 Max • ${vdi.resolution}`;
      ctx.fillText(topLabel, rx + 12, ry + 18);

      // 2x2 Window Quadrants inside region
      const pad = 12;
      const cellW = Math.floor((rw - pad * 3) / 2);
      const cellH = Math.floor((rh - 64 - pad * 3) / 2);
      const slots = [
        { x: rx + pad, y: ry + 36 },
        { x: rx + pad * 2 + cellW, y: ry + 36 },
        { x: rx + pad, y: ry + 36 + cellH + pad },
        { x: rx + pad * 2 + cellW, y: ry + 36 + cellH + pad }
      ];

      openWins.slice(0, 4).forEach((win, idx) => {
        const s = slots[idx % slots.length];
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(s.x, s.y, cellW, cellH);
        ctx.strokeStyle = vdiId === 'aws-workspaces' ? '#f59e0b' : vdiId === 'm365-win11' ? '#38bdf8' : '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x, s.y, cellW, cellH);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(s.x, s.y, cellW, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(win.title.slice(0, 46), s.x + 8, s.y + 15);

        ctx.font = '10px monospace';
        if (win.id === 'terminal') {
          const logs = terminalLogs[vdiId].slice(-5);
          logs.forEach((line, lIdx) => {
            ctx.fillStyle = line.includes('$') || line.includes('>') || line.includes('%') ? '#34d399' : '#cbd5e1';
            ctx.fillText(line.slice(0, 52), s.x + 8, s.y + 38 + lIdx * 16);
          });
        } else if (win.id === 'files') {
          const files = FILESYSTEM_BY_VDI[vdiId][currentPathByVdi[vdiId]] || [];
          files.slice(0, 5).forEach((f, fIdx) => {
            ctx.fillStyle = f.type === 'folder' ? '#60a5fa' : '#e2e8f0';
            ctx.fillText(`${f.type === 'folder' ? '[DIR]' : '[FILE]'} ${f.name}`, s.x + 8, s.y + 38 + fIdx * 16);
          });
        } else if (win.id === 'ide') {
          const codeLines = ideCodeByVdi[vdiId].split('\n').slice(0, 5);
          codeLines.forEach((cl, cIdx) => {
            ctx.fillStyle = '#c084fc';
            ctx.fillText(cl.slice(0, 52), s.x + 8, s.y + 38 + cIdx * 16);
          });
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(`CPU: ${vdi.cpuLoad}% | RAM: ${vdi.ramUsedGb}/${vdi.memoryGb}GB | GPU: ${vdi.gpuLoad}%`, s.x + 8, s.y + 42);
          ctx.fillStyle = '#34d399';
          ctx.fillText(`WebRTC Stream: 60 FPS (${vdi.windowSystem.slice(0, 28)})`, s.x + 8, s.y + 62);
        }
      });

      // Bottom Taskbar / Dock
      ctx.fillStyle = '#090d16';
      ctx.fillRect(rx, ry + rh - 24, rw, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`WebRTC RTCPeerConnection Active • ${vdi.name} • 60 FPS`, rx + 12, ry + rh - 8);

      ctx.restore();
    };

    const renderLoop = () => {
      tick += 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const W = canvas.width;
        const H = canvas.height;
        const resolvedMode =
          webRtcTargetMode !== 'active-os'
            ? webRtcTargetMode
            : layoutMode === 'triple-vdi-grid'
            ? 'all-os'
            : activeVdiId === 'aws-workspaces'
            ? 'linux-x11'
            : activeVdiId === 'm365-win11'
            ? 'win11'
            : 'macos-15';

        if (resolvedMode === 'linux-x11') {
          drawOsRegion(ctx, 'aws-workspaces', 0, 0, W, H);
        } else if (resolvedMode === 'win11') {
          drawOsRegion(ctx, 'm365-win11', 0, 0, W, H);
        } else if (resolvedMode === 'all-os') {
          const colW = Math.floor(W / 3);
          drawOsRegion(ctx, 'aws-workspaces', 0, 0, colW, H);
          drawOsRegion(ctx, 'm365-win11', colW, 0, colW, H);
          drawOsRegion(ctx, 'macos-15-mchip', colW * 2, 0, W - colW * 2, H);
        } else {
          drawOsRegion(ctx, 'macos-15-mchip', 0, 0, W, H);
        }

        // Animated live cursor pulse
        const cx = Math.floor(W * 0.5 + Math.cos(tick * 0.03) * (W * 0.22));
        const cy = Math.floor(H * 0.5 + Math.sin(tick * 0.04) * (H * 0.22));
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isWebRtcStreaming, webRtcTargetMode, layoutMode, activeVdiId, vdiMap, windowsByVdi, terminalLogs, currentPathByVdi, ideCodeByVdi]);

  // Establish real RTCPeerConnection loopback for the WebRTC video receiver monitor
  useEffect(() => {
    const canvas = webrtcCanvasRef.current;
    const videoEl = webrtcVideoRef.current;
    if (!canvas || !videoEl || !isWebRtcStreaming) return;

    let isCancelled = false;
    const setupPeerConnection = async () => {
      try {
        if (pcSenderRef.current) pcSenderRef.current.close();
        if (pcReceiverRef.current) pcReceiverRef.current.close();

        const stream = canvas.captureStream(60);
        const sender = new RTCPeerConnection();
        const receiver = new RTCPeerConnection();
        pcSenderRef.current = sender;
        pcReceiverRef.current = receiver;

        sender.onicecandidate = (e) => {
          if (e.candidate) receiver.addIceCandidate(e.candidate).catch(() => {});
        };
        receiver.onicecandidate = (e) => {
          if (e.candidate) sender.addIceCandidate(e.candidate).catch(() => {});
        };
        receiver.ontrack = (e) => {
          if (!isCancelled && e.streams && e.streams[0] && videoEl) {
            videoEl.srcObject = e.streams[0];
          }
        };

        stream.getTracks().forEach((track) => sender.addTrack(track, stream));
        const offer = await sender.createOffer();
        await sender.setLocalDescription(offer);
        await receiver.setRemoteDescription(offer);
        const answer = await receiver.createAnswer();
        await receiver.setLocalDescription(answer);
        await sender.setRemoteDescription(answer);
      } catch {
        if (!isCancelled && videoEl) {
          videoEl.srcObject = canvas.captureStream(60);
        }
      }
    };

    setupPeerConnection();

    const statTimer = setInterval(() => {
      setWebRtcBitrateMbps((5.9 + Math.sin(Date.now() / 900) * 0.5).toFixed(1));
    }, 1200);

    return () => {
      isCancelled = true;
      clearInterval(statTimer);
      if (pcSenderRef.current) pcSenderRef.current.close();
      if (pcReceiverRef.current) pcReceiverRef.current.close();
    };
  }, [isWebRtcStreaming, showWebRtcMonitor]);

  // Optional Desktop Screen Recording (.mp4) of the actual VDI desktop windows
  const backingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecordingMp4, setIsRecordingMp4] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [recordings, setRecordings] = useState<RecordedDesktopMp4[]>([]);
  const [showRecordingsDrawer, setShowRecordingsDrawer] = useState(false);

  // Free GitHub Actions macos-15 + noVNC / Cloudflare Tunnel & Mercor VNC Screen Share Hub State
  const [showVncMercorHub, setShowVncMercorHub] = useState<boolean>(true);
  const [vncConfig, setVncConfig] = useState<VncConnectionConfig>({
    isConnected: true,
    mode: 'internal-rfb-bridge',
    tunnelUrl:
      typeof window !== 'undefined'
        ? `${window.location.origin}/vnc.html?autoconnect=true&resize=scale&os=win11&mercor_project=MERCOR-AWS-WORKSPACES-01`
        : '/vnc.html?autoconnect=true&resize=scale&os=win11&mercor_project=MERCOR-AWS-WORKSPACES-01',
    rfbHost: typeof window !== 'undefined' ? window.location.host : '127.0.0.1:6080',
    rfbPort: 5900,
    wsPath: '/websockify',
    encoding: 'Tight + Zlib (RFB 3.8)',
    colorDepth: '24-bit TrueColor',
    viewOnly: false,
    sharedSession: true,
    mercorProjectId: 'MERCOR-AWS-WORKSPACES-01',
    mercorTaskPrompt: 'Amazon WorkSpaces on Browser (WSP) & Multi-OS VDI Evaluation',
    candidateHandle: 'bheemaiah@alumni.iitm.ac.in',
    sessionToken: 'mrc_rfb_99482a10f'
  });

  const handleInjectTerminalLog = useCallback((vdiId: VdiProviderId, lines: string[]) => {
    setTerminalLogs((prev) => ({
      ...prev,
      [vdiId]: [...prev[vdiId], ...lines]
    }));
  }, []);

  const activeVdi = vdiMap[activeVdiId];
  const activeWindows = windowsByVdi[activeVdiId];

  // AWS Configuration Stack Templates for Amazon WorkSpaces on Browser (WSP Web Access)
  const bundleIdMap: Record<'POWERPRO_WSP' | 'PERFORMANCE_WSP' | 'GRAPHICS_G4DN_WSP', { id: string; spec: string; compute: string }> = {
    POWERPRO_WSP: { id: 'wsb-8vbl42p1r', spec: '8 vCPU / 32 GB RAM (WSP 2.0)', compute: 'POWERPRO' },
    PERFORMANCE_WSP: { id: 'wsb-3t9k81m2p', spec: '2 vCPU / 8 GB RAM (WSP 2.0)', compute: 'PERFORMANCE' },
    GRAPHICS_G4DN_WSP: { id: 'wsb-g4dn99x1w', spec: '4 vCPU / 16 GB RAM / NVIDIA T4 GPU (WSP 2.0)', compute: 'GRAPHICS_G4DN' }
  };
  const selectedBundle = bundleIdMap[awsBundleType];

  const awsCloudFormationTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Amazon WorkSpaces on Browser (WSP Web Access) Full Configuration Stack (${awsRegion}).
  Provisions VPC, 2 Private Subnets, AWS Managed Microsoft AD, IP Access Control Group,
  Directory WebAccess (DeviceTypeWeb=ALLOW), and WSP-enabled WorkSpace instance.

Parameters:
  DirectoryAdminPassword:
    Type: String
    NoEcho: true
    Default: 'WorkSpaces#2026!AwsVdi'
  WorkSpaceUserName:
    Type: String
    Default: 'ws-admin'
  WorkSpaceBundleId:
    Type: String
    Default: '${selectedBundle.id}' # ${selectedBundle.spec}

Resources:
  # 1. VPC & Dual-AZ Networking for AWS Directory Service + WorkSpaces WSP
  WorkSpacesVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: aws-workspaces-browser-vpc

  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WorkSpacesVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Sub '\${AWS::Region}a'

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WorkSpacesVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Sub '\${AWS::Region}b'

  # 2. AWS Managed Microsoft AD Directory for WorkSpaces Authentication
  WorkSpacesDirectory:
    Type: AWS::DirectoryService::MicrosoftAD
    Properties:
      Name: corp.edge-vdi.aws
      Password: !Ref DirectoryAdminPassword
      Edition: Standard
      VpcSettings:
        VpcId: !Ref WorkSpacesVPC
        SubnetIds:
          - !Ref PrivateSubnetAZ1
          - !Ref PrivateSubnetAZ2

  # 3. IP Access Control Group for Browser Web Access (HTTPS 443 / UDP 4195 WSP)
  WorkSpacesBrowserIpGroup:
    Type: AWS::WorkSpaces::IpGroup
    Properties:
      GroupName: WorkSpacesBrowserWebAccessIpGroup
      GroupDesc: Allow HTTPS/WebRTC Browser Access to Amazon WorkSpaces
      UserRules:
        - IpRule: 0.0.0.0/0
          RuleDesc: Allow Browser Web Client Access (WSP over HTTPS/WebRTC)

  # 4. Amazon WorkSpaces WSP Instance (Accessible via https://clients.amazonworkspaces.com/webclient)
  BrowserEnabledWorkSpace:
    Type: AWS::WorkSpaces::Workspace
    Properties:
      DirectoryId: !Ref WorkSpacesDirectory
      UserName: !Ref WorkSpaceUserName
      BundleId: !Ref WorkSpaceBundleId
      RootVolumeEncryptionEnabled: true
      UserVolumeEncryptionEnabled: true
      VolumeEncryptionKey: alias/aws/workspaces
      WorkspaceProperties:
        ComputeTypeName: ${selectedBundle.compute}
        RootVolumeSizeGib: 175
        UserVolumeSizeGib: 100
        RunningMode: ${awsRunningMode}
        ${awsRunningMode === 'AUTO_STOP' ? 'RunningModeAutoStopTimeoutInMinutes: 60' : '# Always-On 24/7 Instant Browser Access'}

Outputs:
  WorkSpacesWebAccessUrl:
    Description: Launch Amazon WorkSpaces directly in Chrome/Edge/Firefox Browser (Zero Client Install)
    Value: 'https://clients.amazonworkspaces.com/webclient'
  DirectoryId:
    Description: Directory ID to enable DeviceTypeWeb=ALLOW
    Value: !Ref WorkSpacesDirectory
  WorkSpaceId:
    Description: Provisioned WSP WorkSpace Instance ID
    Value: !Ref BrowserEnabledWorkSpace`;

  const awsTerraformConfig = `# Terraform AWS Stack: Amazon WorkSpaces on Browser (WSP Web Access)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}

provider "aws" {
  region = "${awsRegion}"
}

# 1. AWS Managed Microsoft AD for WorkSpaces
resource "aws_directory_service_directory" "workspaces_ad" {
  name     = "corp.edge-vdi.aws"
  password = var.ad_admin_password
  size     = "Small"
  type     = "MicrosoftAD"

  vpc_settings {
    vpc_id     = aws_vpc.workspaces_vpc.id
    subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  }
}

# 2. Register Directory & Explicitly Enable Browser Web Access (device_type_web = "ALLOW")
resource "aws_workspaces_directory" "browser_enabled_dir" {
  directory_id = aws_directory_service_directory.workspaces_ad.id
  subnet_ids   = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  workspace_access_properties {
    device_type_web     = "ALLOW" # CRITICAL: Enables https://clients.amazonworkspaces.com/webclient
    device_type_osx     = "ALLOW"
    device_type_windows = "ALLOW"
    device_type_linux   = "ALLOW"
    device_type_ios     = "DENY"
    device_type_android = "DENY"
  }

  workspace_creation_properties {
    enable_internet_access              = true
    enable_maintenance_mode             = true
    user_enabled_as_local_administrator = true
  }
}

# 3. Provision WSP-Enabled Amazon WorkSpace for Browser Streaming
resource "aws_workspaces_workspace" "browser_vdi" {
  directory_id = aws_workspaces_directory.browser_enabled_dir.id
  bundle_id    = "${selectedBundle.id}" # ${selectedBundle.spec}
  user_name    = "ws-admin"

  root_volume_encryption_enabled = true
  user_volume_encryption_enabled = true
  volume_encryption_key          = "alias/aws/workspaces"

  workspace_properties {
    compute_type_name                         = "${selectedBundle.compute}"
    user_volume_size_gib                      = 100
    root_volume_size_gib                      = 175
    running_mode                              = "${awsRunningMode}"
    running_mode_auto_stop_timeout_in_minutes = ${awsRunningMode === 'AUTO_STOP' ? 60 : 0}
  }
}

output "amazon_workspaces_browser_url" {
  value = "https://clients.amazonworkspaces.com/webclient"
}`;

  const awsCliCommandsScript = `#!/usr/bin/env bash
# AWS CLI Script: Deploy & Enable Amazon WorkSpaces on Browser (WSP Web Access) in ${awsRegion}
set -euo pipefail
export AWS_DEFAULT_REGION="${awsRegion}"

# 1. Register your AWS Directory with Amazon WorkSpaces
aws workspaces register-workspace-directory \\
  --directory-id d-9267481a2b \\
  --subnet-ids subnet-0a1b2c3d4e subnet-0f5e6d7c8b \\
  --enable-work-docs false

# 2. CRITICAL: Enable Browser Web Access (DeviceTypeWeb=ALLOW) on the Directory
aws workspaces modify-workspace-access-properties \\
  --resource-id d-9267481a2b \\
  --workspace-access-properties \\
    DeviceTypeWeb=ALLOW,DeviceTypeOsx=ALLOW,DeviceTypeWindows=ALLOW,DeviceTypeLinux=ALLOW

# 3. Enable Bi-Directional Clipboard & WebRTC WSP Streaming Policies
aws workspaces create-workspaces \\
  --workspaces '[{
    "DirectoryId": "d-9267481a2b",
    "UserName": "ws-admin",
    "BundleId": "${selectedBundle.id}",
    "VolumeEncryptionKey": "alias/aws/workspaces",
    "UserVolumeEncryptionEnabled": true,
    "RootVolumeEncryptionEnabled": true,
    "WorkspaceProperties": {
      "RunningMode": "${awsRunningMode}",
      "RunningModeAutoStopTimeoutInMinutes": 60,
      "RootVolumeSizeGib": 175,
      "UserVolumeSizeGib": 100,
      "ComputeTypeName": "${selectedBundle.compute}",
      "Protocols": ["WSP"]
    }
  }]'

# 4. Fetch Registration Code & Open Browser Web Client
aws workspaces describe-workspace-directories \\
  --directory-ids d-9267481a2b \\
  --query "Directories[0].{RegistrationCode:RegistrationCode,WebAccess:WorkspaceAccessProperties.DeviceTypeWeb}"
echo "Open Browser Client: https://clients.amazonworkspaces.com/webclient"`;

  const awsWorkSpacesWebPortalYaml = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Amazon WorkSpaces Secure Browser (AWS::WorkSpacesWeb::Portal) CloudFormation Stack'
Resources:
  SecureBrowserPortal:
    Type: AWS::WorkSpacesWeb::Portal
    Properties:
      DisplayName: 'EdgeDocker & Mercor Browser Workspace Portal'
      AuthenticationType: Standard
      BrowserType: Chrome

  SecureBrowserNetworkSettings:
    Type: AWS::WorkSpacesWeb::NetworkSettings
    Properties:
      VpcId: !Ref WorkSpacesVPC
      SubnetIds: [!Ref PrivateSubnetAZ1, !Ref PrivateSubnetAZ2]
      SecurityGroupIds: [!Ref WorkSpacesSecurityGroup]

  SecureBrowserSettings:
    Type: AWS::WorkSpacesWeb::BrowserSettings
    Properties:
      BrowserPolicy: |
        {
          "chromePolicies": {
            "ClipboardAllowedForUrls": { "Value": ["*"] },
            "DownloadRestrictions": { "Value": 0 }
          }
        }

Outputs:
  WorkSpacesWebPortalEndpoint:
    Description: Direct Browser Streaming Portal URL
    Value: !GetAtt SecureBrowserPortal.PortalEndpoint`;

  const activeAwsStackCode =
    awsStackTab === 'cloudformation'
      ? awsCloudFormationTemplate
      : awsStackTab === 'terraform'
      ? awsTerraformConfig
      : awsStackTab === 'aws-cli'
      ? awsCliCommandsScript
      : awsWorkSpacesWebPortalYaml;

  const handleCopyAwsStack = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setAwsCopiedStack(id);
    setTimeout(() => setAwsCopiedStack(null), 2000);
  };

  const handleDownloadAwsStack = () => {
    const ext =
      awsStackTab === 'cloudformation'
        ? 'aws-workspaces-browser-stack.yaml'
        : awsStackTab === 'terraform'
        ? 'main.tf'
        : awsStackTab === 'aws-cli'
        ? 'deploy-workspaces-browser.sh'
        : 'aws-workspaces-web-portal.yaml';
    const blob = new Blob([activeAwsStackCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ext;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live telemetry jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setVdiMap((prev) => {
        const next = { ...prev };
        (Object.keys(next) as VdiProviderId[]).forEach((id) => {
          const inst = next[id];
          if (inst.status !== 'RUNNING') return;
          const jitterCpu = Math.max(8, Math.min(92, inst.cpuLoad + (Math.random() > 0.5 ? 2 : -2)));
          const jitterGpu = Math.max(6, Math.min(88, inst.gpuLoad + (Math.random() > 0.5 ? 2 : -2)));
          const jitterLat = Math.max(8, Math.min(35, inst.latencyMs + (Math.random() > 0.5 ? 1 : -1)));
          next[id] = {
            ...inst,
            cpuLoad: jitterCpu,
            gpuLoad: jitterGpu,
            latencyMs: jitterLat
          };
        });
        return next;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Bring a desktop window to front
  const focusWindow = useCallback((vdiId: VdiProviderId, winId: DesktopWindowId) => {
    setWindowsByVdi((prev) => {
      const vdiWins = prev[vdiId];
      const maxZ = Math.max(...(Object.values(vdiWins) as WindowState[]).map((w) => w.zIndex), 1);
      return {
        ...prev,
        [vdiId]: {
          ...vdiWins,
          [winId]: {
            ...vdiWins[winId],
            isOpen: true,
            isMinimized: false,
            zIndex: maxZ + 1
          }
        }
      };
    });
  }, []);

  // Toggle window minimize
  const toggleMinimizeWindow = useCallback((vdiId: VdiProviderId, winId: DesktopWindowId) => {
    setWindowsByVdi((prev) => {
      const vdiWins = prev[vdiId];
      const target = vdiWins[winId];
      return {
        ...prev,
        [vdiId]: {
          ...vdiWins,
          [winId]: {
            ...target,
            isMinimized: !target.isMinimized
          }
        }
      };
    });
  }, []);

  // Toggle window maximize
  const toggleMaximizeWindow = useCallback((vdiId: VdiProviderId, winId: DesktopWindowId) => {
    setWindowsByVdi((prev) => {
      const vdiWins = prev[vdiId];
      const target = vdiWins[winId];
      const maxZ = Math.max(...(Object.values(vdiWins) as WindowState[]).map((w) => w.zIndex), 1);
      return {
        ...prev,
        [vdiId]: {
          ...vdiWins,
          [winId]: {
            ...target,
            isMaximized: !target.isMaximized,
            isMinimized: false,
            zIndex: maxZ + 1
          }
        }
      };
    });
  }, []);

  // Close or reopen window
  const setWindowOpen = useCallback((vdiId: VdiProviderId, winId: DesktopWindowId, open: boolean) => {
    setWindowsByVdi((prev) => {
      const vdiWins = prev[vdiId];
      const maxZ = Math.max(...(Object.values(vdiWins) as WindowState[]).map((w) => w.zIndex), 1);
      return {
        ...prev,
        [vdiId]: {
          ...vdiWins,
          [winId]: {
            ...vdiWins[winId],
            isOpen: open,
            isMinimized: false,
            isMaximized: false,
            zIndex: open ? maxZ + 1 : vdiWins[winId].zIndex
          }
        }
      };
    });
  }, []);

  // Arrange all windows on the active VDI
  const arrangeWindows = useCallback((vdiId: VdiProviderId, arrangement: WindowArrangement) => {
    setWindowsByVdi((prev) => {
      const current = prev[vdiId];
      if (arrangement === 'tiled-2x2') {
        return {
          ...prev,
          [vdiId]: {
            terminal: { ...current.terminal, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 4 },
            files: { ...current.files, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 3 },
            ide: { ...current.ide, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 2 },
            monitor: { ...current.monitor, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 1 }
          }
        };
      }
      if (arrangement === 'left-right') {
        return {
          ...prev,
          [vdiId]: {
            terminal: { ...current.terminal, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 4 },
            ide: { ...current.ide, isOpen: true, isMinimized: false, isMaximized: false, zIndex: 3 },
            files: { ...current.files, isOpen: true, isMinimized: true, isMaximized: false, zIndex: 2 },
            monitor: { ...current.monitor, isOpen: true, isMinimized: true, isMaximized: false, zIndex: 1 }
          }
        };
      }
      // Maximize highest zIndex window
      const sorted = (Object.values(current) as WindowState[]).sort((a, b) => b.zIndex - a.zIndex);
      const topId = sorted[0].id;
      return {
        ...prev,
        [vdiId]: {
          ...current,
          [topId]: { ...current[topId], isOpen: true, isMinimized: false, isMaximized: true, zIndex: 10 }
        }
      };
    });
  }, []);

  // Execute terminal command inside the active VDI
  const handleRunCommand = useCallback(
    (e?: React.FormEvent, customCmd?: string) => {
      if (e) e.preventDefault();
      const raw = (customCmd ?? commandInput).trim();
      if (!raw) return;

      const promptPrefix =
        activeVdiId === 'aws-workspaces'
          ? 'ws-user@ws-x11-ubuntu24:~/workspace$'
          : activeVdiId === 'm365-win11'
          ? 'aws-admin@ws-9f84c2a10 D:\\AWS-WorkSpaces-Stack>'
          : 'dev-m4max@mac2-m4max-sequoia ~/Projects %';

      let outputLines: string[] = [];
      const lower = raw.toLowerCase();

      if (lower === 'clear' || lower === 'cls') {
        setTerminalLogs((prev) => ({ ...prev, [activeVdiId]: [] }));
        if (!customCmd) setCommandInput('');
        return;
      } else if (lower.includes('xrandr') || lower.includes('xdpyinfo')) {
        outputLines = [
          'Screen 0: minimum 320 x 200, current 2560 x 1440, maximum 16384 x 16384',
          'DP-0 connected primary 2560x1440+0+0 (normal left inverted right x axis y axis) 597mm x 336mm',
          '   2560x1440     60.00*+  120.00',
          '   1920x1080     60.00'
        ];
      } else if (lower.includes('wmctrl') || lower.includes('xlsclients')) {
        outputLines = [
          'ws-x11-ubuntu24  xterm -geometry 110x32',
          'ws-x11-ubuntu24  thunar /home/ws-user/workspace',
          'ws-x11-ubuntu24  code-oss --enable-features=UseOzonePlatform --ozone-platform=x11',
          'ws-x11-ubuntu24  nvidia-settings --ctrl-display=:0.0'
        ];
      } else if (lower.includes('nvidia-smi')) {
        outputLines = [
          '+-----------------------------------------------------------------------------------------+',
          '| NVIDIA-SMI 550.90.07              Driver Version: 550.90.07      CUDA Version: 12.4     |',
          '| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |',
          '|   0  NVIDIA L4                      On  |   00000000:00:1E.0 Off |                    0 |',
          '|  0%   42C    P0             34W /   72W |    4120MiB /  23034MiB |     32%      Default |',
          '+-----------------------------------------------------------------------------------------+'
        ];
      } else if (lower.includes('describe-workspaces') || lower.includes('modify-workspace') || lower.includes('aws workspaces')) {
        outputLines = [
          '{',
          '  "WorkspaceId": "ws-9f84c2a10",',
          '  "DirectoryId": "d-9267481a2b",',
          '  "BundleId": "' + selectedBundle.id + ' (' + selectedBundle.spec + ')",',
          '  "WorkspaceAccessProperties": { "DeviceTypeWeb": "ALLOW", "Protocols": ["WSP"] },',
          '  "BrowserClientUrl": "https://clients.amazonworkspaces.com/webclient#/session/ws-9f84c2a10",',
          '  "RegistrationCode": "WSP+' + awsRegion + '+9XK4P2",',
          '  "State": "AVAILABLE"',
          '}'
        ];
      } else if (lower.includes('cloudformation') || lower.includes('terraform')) {
        outputLines = [
          '[AWS CloudFormation / Terraform] Validating aws-workspaces-browser-stack.yaml...',
          'CREATE_COMPLETE  AWS::EC2::VPC                        WorkSpacesVPC',
          'CREATE_COMPLETE  AWS::DirectoryService::MicrosoftAD   WorkSpacesDirectory (d-9267481a2b)',
          'CREATE_COMPLETE  AWS::WorkSpaces::IpGroup             WorkSpacesBrowserIpGroup (0.0.0.0/0)',
          'CREATE_COMPLETE  AWS::WorkSpaces::Workspace           BrowserEnabledWorkSpace (ws-9f84c2a10)',
          'Outputs: WorkSpacesWebAccessUrl = https://clients.amazonworkspaces.com/webclient'
        ];
      } else if (lower.includes('launchctl') && (lower.includes('bootstrap') || lower.includes('enable') || lower.includes('print') || lower.includes('list'))) {
        outputLines = [
          '[launchctl bootstrap gui/501] Bootstrapping ~/Library/LaunchAgents/com.bvnc.macconsole.plist...',
          '  -> Domain: gui/501 (Aqua WindowServer Session Attached)',
          '  -> Service Label: com.bvnc.macconsole (State: running, PID: 41209)',
          '  -> Binary: /System/Library/CoreServices/RemoteManagement/AppleVNCServer.bundle/Contents/MacOS/AppleVNCServer',
          '  -> Local Port: 127.0.0.1:5900 (Secure Loopback RFB 3.8)',
          '  -> Ready for bVNC over SSH Tunnel: ssh -L 5900:127.0.0.1:5900 dev-m4max@mac2-m4max-sequoia.local'
        ];
      } else if (lower.includes('dcv') && (lower.includes('create-session') || lower.includes('describe-sessions') || lower.includes('list-endpoints') || lower.includes('server'))) {
        outputLines = [
          '[Amazon DCV Server 2024.0 (macOS arm64e Metal 3 VideoToolbox)]',
          '{',
          '  "sessions": [{',
          '    "id": "console",',
          '    "owner": "dev-m4max",',
          '    "type": "console",',
          '    "state": "RUNNING",',
          '    "display": "2880x1620 (Retina HiDPI @ 120Hz)",',
          '    "web-port": 8443,',
          '    "quic-enabled": true,',
          '    "browser-url": "https://mac2-m4max-sequoia.local:8443#console",',
          '    "clients": [{ "client-id": "webrtc-dcv-01", "ip": "127.0.0.1", "transport": "QUIC/UDP" }]',
          '  }]',
          '}'
        ];
      } else if (lower.includes('ssh') && (lower.includes('5900') || lower.includes('-l') || lower.includes('tunnel'))) {
        outputLines = [
          '[SSH Port Forwarding Established]',
          'Local Port Forward: 127.0.0.1:5900 -> remote mac2-m4max-sequoia.local:5900',
          'Authenticated: dev-m4max via SSH Ed25519 key on port 22',
          'bVNC Client Channel: Active and accepting connections on localhost:5900'
        ];
      } else if (lower.includes('setup-amazon-dcv') || lower.includes('setup_dcv')) {
        outputLines = [
          '🚀 [Amazon DCV Installer] Downloading nice-dcv-server-macos-arm64.pkg...',
          '📦 Installing DCV Server into /Library/LaunchDaemons/com.nicesoftware.dcvserver.plist...',
          '⚙️  Writing /etc/dcv/dcv.conf (web-port=8443, quic=true, resolution=2880x1620)...',
          '🔄 sudo launchctl bootstrap system /Library/LaunchDaemons/com.nicesoftware.dcvserver.plist',
          '🖥️  sudo dcv create-session --type console --owner dev-m4max console',
          '✅ Amazon DCV Server is ACTIVE on https://mac2-m4max-sequoia.local:8443#console'
        ];
      } else if (lower.includes('systemsetup') && lower.includes('remotelogin')) {
        outputLines = [
          'Remote Login (SSH): On',
          'OpenSSH_9.8p1, LibreSSL 3.3.6',
          'sshd listening on 0.0.0.0:22 (system/com.openssh.sshd)'
        ];
      } else if (lower.includes('sw_vers') || lower.includes('sysctl') || lower.includes('system_profiler')) {
        outputLines = [
          'ProductName:            macOS Sequoia',
          'ProductVersion:         15.3 (24D60)',
          'Kernel:                 Darwin 24.3.0 arm64e (Apple M4 Max)',
          'WindowServer:           Quartz Compositor Metal 3 (2880x1620 @ 120Hz)',
          'Amazon DCV Server:      Active on :8443 (QUIC/WebRTC)',
          'bVNC Console Service:   Bootstrapped via launchctl gui/501 on :5900'
        ];
      } else if (lower.startsWith('ls') || lower.startsWith('dir')) {
        const files = FILESYSTEM_BY_VDI[activeVdiId][currentPathByVdi[activeVdiId]] || [];
        outputLines = files.map((f) => `${f.permissions.padEnd(14)} ${f.size.padStart(9)}  ${f.modified.padEnd(14)}  ${f.name}`);
      } else {
        outputLines = [
          `[Executed on ${activeVdi.hostname} (${activeVdi.windowSystem})]: ${raw}`,
          `Exit status: 0 (completed in 18ms)`
        ];
      }

      setTerminalLogs((prev) => ({
        ...prev,
        [activeVdiId]: [...prev[activeVdiId], `${promptPrefix} ${raw}`, ...outputLines]
      }));
      if (!customCmd) setCommandInput('');
      focusWindow(activeVdiId, 'terminal');
    },
    [commandInput, activeVdiId, activeVdi, currentPathByVdi, focusWindow, selectedBundle, awsRegion]
  );

  // Run code from IDE window into Terminal window
  const handleRunIdeCode = useCallback(() => {
    const cmd =
      activeVdiId === 'aws-workspaces'
        ? 'python3 x11_window_pipeline.py'
        : activeVdiId === 'm365-win11'
        ? 'aws cloudformation deploy --template-file aws-workspaces-browser-stack.yaml --stack-name amazon-workspaces-browser-vdi'
        : './launchctl-bootstrap-bvnc-console.sh';
    const out =
      activeVdiId === 'aws-workspaces'
        ? [
            '[X11] Connected to :0.0 (Xfwm4 / X.Org 21.1.11)',
            '  -> Window 0x01800003 [XTerm] @ 1240x720+40+40',
            '  -> Window 0x02400007 [Thunar] @ 1240x720+1290+40',
            '  -> Window 0x03200012 [Code-OSS] @ 1240x720+40+780'
          ]
        : activeVdiId === 'm365-win11'
        ? [
            'Waiting for changeset to be created..',
            'Waiting for stack create/update to complete',
            'Successfully created/updated stack - amazon-workspaces-browser-vdi',
            '  -> DirectoryId: d-9267481a2b (DeviceTypeWeb=ALLOW)',
            '  -> WorkSpaceId: ws-9f84c2a10 (' + selectedBundle.spec + ')',
            '  -> Browser Client URL: https://clients.amazonworkspaces.com/webclient#/session/ws-9f84c2a10'
          ]
        : [
            '[Executing macOS Console Bootstrap for bVNC & Amazon DCV]',
            '1. Remote Login (SSH) enabled: sshd listening on 0.0.0.0:22',
            '2. Screen Sharing configured with legacy RFB credentials for bVNC',
            '3. launchctl bootstrap gui/501 ~/Library/LaunchAgents/com.bvnc.macconsole.plist (Return code: 0 OK)',
            '4. AppleVNCServer bound to Aqua WindowServer framebuffer on 127.0.0.1:5900',
            '5. Amazon DCV Server running: https://mac2-m4max-sequoia.local:8443#console',
            'Ready for bVNC connection over SSH: ssh -L 5900:127.0.0.1:5900 dev-m4max@mac2-m4max-sequoia.local'
          ];

    const promptPrefix =
      activeVdiId === 'aws-workspaces'
        ? 'ws-user@ws-x11-ubuntu24:~/workspace$'
        : activeVdiId === 'm365-win11'
        ? 'aws-admin@ws-9f84c2a10 D:\\AWS-WorkSpaces-Stack>'
        : 'dev-m4max@mac2-m4max-sequoia ~/Projects %';

    setTerminalLogs((prev) => ({
      ...prev,
      [activeVdiId]: [...prev[activeVdiId], `${promptPrefix} ${cmd}`, ...out]
    }));
    focusWindow(activeVdiId, 'terminal');
  }, [activeVdiId, focusWindow, selectedBundle]);

  // Backing canvas renderer for .mp4 desktop recording of the actual OS windows
  useEffect(() => {
    if (!isRecordingMp4) return;
    let animId: number;
    let tick = 0;

    const renderDesktopFrameToCanvas = () => {
      tick += 1;
      const canvas = backingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const W = canvas.width;
          const H = canvas.height;

          // OS Background
          if (activeVdiId === 'aws-workspaces') {
            ctx.fillStyle = '#111827';
          } else if (activeVdiId === 'm365-win11') {
            ctx.fillStyle = '#0f172a';
          } else {
            ctx.fillStyle = '#1e1b4b';
          }
          ctx.fillRect(0, 0, W, H);

          // Top bar
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, W, 32);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`${activeVdi.name}  •  ${activeVdi.windowSystem}  •  ${activeVdi.resolution}`, 16, 21);

          // Draw 4 OS Windows
          const openWins = (Object.values(activeWindows) as WindowState[]).filter((w) => w.isOpen && !w.isMinimized);
          const rects = [
            { x: 24, y: 48, w: W / 2 - 36, h: H / 2 - 70 },
            { x: W / 2 + 12, y: 48, w: W / 2 - 36, h: H / 2 - 70 },
            { x: 24, y: H / 2 - 6, w: W / 2 - 36, h: H / 2 - 70 },
            { x: W / 2 + 12, y: H / 2 - 6, w: W / 2 - 36, h: H / 2 - 70 }
          ];

          openWins.forEach((win, idx) => {
            const r = rects[idx % rects.length];
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = activeVdiId === 'aws-workspaces' ? '#f59e0b' : activeVdiId === 'm365-win11' ? '#38bdf8' : '#a855f7';
            ctx.lineWidth = 2;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Titlebar
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(r.x, r.y, r.w, 26);
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(win.title, r.x + 12, r.y + 17);

            // Window body content
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px monospace';
            if (win.id === 'terminal') {
              const logs = terminalLogs[activeVdiId].slice(-8);
              logs.forEach((line, lIdx) => {
                ctx.fillStyle = line.includes('$') || line.includes('>') || line.includes('%') ? '#34d399' : '#cbd5e1';
                ctx.fillText(line.slice(0, 72), r.x + 12, r.y + 48 + lIdx * 18);
              });
            } else if (win.id === 'files') {
              const files = FILESYSTEM_BY_VDI[activeVdiId][currentPathByVdi[activeVdiId]] || [];
              files.forEach((f, fIdx) => {
                ctx.fillStyle = f.type === 'folder' ? '#60a5fa' : '#e2e8f0';
                ctx.fillText(`${f.type === 'folder' ? '[DIR]' : '[FILE]'} ${f.name} (${f.size})`, r.x + 12, r.y + 48 + fIdx * 20);
              });
            } else if (win.id === 'ide') {
              const codeLines = ideCodeByVdi[activeVdiId].split('\n').slice(0, 9);
              codeLines.forEach((cl, cIdx) => {
                ctx.fillStyle = '#c084fc';
                ctx.fillText(cl.slice(0, 72), r.x + 12, r.y + 48 + cIdx * 18);
              });
            } else {
              ctx.fillStyle = '#38bdf8';
              ctx.fillText(`CPU Load: ${activeVdi.cpuLoad}%   |   RAM: ${activeVdi.ramUsedGb}/${activeVdi.memoryGb} GB   |   GPU: ${activeVdi.gpuLoad}%`, r.x + 12, r.y + 52);
            }
          });

          // Animated cursor indicator for task recording
          const curX = Math.floor(W * 0.5 + Math.sin(tick * 0.04) * (W * 0.25));
          const curY = Math.floor(H * 0.5 + Math.cos(tick * 0.03) * (H * 0.25));
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(curX, curY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(renderDesktopFrameToCanvas);
    };

    animId = requestAnimationFrame(renderDesktopFrameToCanvas);
    return () => cancelAnimationFrame(animId);
  }, [isRecordingMp4, activeVdiId, activeVdi, activeWindows, terminalLogs, currentPathByVdi, ideCodeByVdi]);

  // Recording timer
  useEffect(() => {
    if (!isRecordingMp4) return;
    const t = setInterval(() => setRecordingSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecordingMp4]);

  const startDesktopRecording = useCallback(() => {
    const canvas = backingCanvasRef.current;
    if (!canvas || isRecordingMp4) return;

    recordedChunksRef.current = [];
    setRecordingSec(0);

    try {
      const stream = canvas.captureStream(60);
      const mimeCandidates = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=h264', 'video/webm'];
      let chosenMime = 'video/webm';
      for (const m of mimeCandidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 6_000_000
      });

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `vdi_desktop_${activeVdiId}_${stamp}.mp4`;
        const openTitles = (Object.values(windowsByVdi[activeVdiId]) as WindowState[])
          .filter((w) => w.isOpen && !w.isMinimized)
          .map((w) => w.id)
          .join(', ');

        const item: RecordedDesktopMp4 = {
          id: `rec-${Date.now()}`,
          filename,
          vdiId: activeVdiId,
          vdiName: activeVdi.name,
          windowSystem: activeVdi.windowSystem,
          durationSec: Math.max(1, recordingSec),
          sizeMb: Math.max(0.4, blob.size / (1024 * 1024)).toFixed(2),
          resolution: activeVdi.resolution,
          fps: 60,
          codec: 'H.264 / MP4',
          createdAt: new Date().toLocaleTimeString(),
          videoUrl: url,
          activeWindowsSummary: openTitles || 'Desktop Shell'
        };
        setRecordings((prev) => [item, ...prev]);
        setShowRecordingsDrawer(true);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200);
      setIsRecordingMp4(true);
    } catch {
      setIsRecordingMp4(false);
    }
  }, [isRecordingMp4, activeVdiId, activeVdi, windowsByVdi, recordingSec]);

  const stopDesktopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingMp4(false);
  }, []);

  // Render an individual OS window's interior content (Terminal, File Manager, IDE, or System Monitor)
  const renderWindowBody = (vdiId: VdiProviderId, winId: DesktopWindowId) => {
    const vdi = vdiMap[vdiId];
    const currentFolder = currentPathByVdi[vdiId];
    const folderPaths = Object.keys(FILESYSTEM_BY_VDI[vdiId]);
    const files = FILESYSTEM_BY_VDI[vdiId][currentFolder] || [];
    const selectedFile = selectedFileByVdi[vdiId];

    if (winId === 'terminal') {
      const isAwsBrowser = vdiId === 'm365-win11';
      const isMac = vdiId === 'macos-15-mchip';
      const quickCmds =
        vdiId === 'aws-workspaces'
          ? ['xrandr', 'wmctrl -l', 'nvidia-smi', 'ls -la']
          : isAwsBrowser
          ? ['aws workspaces describe-workspaces', 'aws cloudformation deploy', 'terraform apply', 'dir']
          : ['sw_vers', 'sysctl -n machdep.cpu.brand_string', 'ls -la'];

      return (
        <div
          className={`flex flex-col h-full font-mono text-xs ${
            isAwsBrowser ? 'bg-[#0b1528] text-slate-100' : isMac ? 'bg-[#10141d] text-emerald-100' : 'bg-[#090d14] text-slate-200'
          }`}
        >
          {/* Quick Command Chips */}
          <div className="px-3 py-1.5 border-b border-white/10 bg-black/30 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400">
              {vdiId === 'aws-workspaces'
                ? 'XTerm • DISPLAY=:0.0'
                : isAwsBrowser
                ? 'AWS WorkSpaces WSP Browser CLI (ws-9f84c2a10)'
                : 'iTerm2 • zsh 5.9 (arm64e)'}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {quickCmds.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleRunCommand(undefined, cmd)}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-cyan-300 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Scrollback */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1 leading-relaxed">
            {terminalLogs[vdiId].map((line, i) => {
              const isPrompt = line.includes('$') || line.includes('>') || line.includes('%');
              return (
                <div
                  key={i}
                  className={
                    isPrompt
                      ? isAwsBrowser
                        ? 'text-sky-300 font-semibold'
                        : 'text-emerald-400 font-semibold'
                      : 'text-slate-300 whitespace-pre-wrap'
                  }
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Interactive Command Input */}
          {vdiId === activeVdiId && (
            <form onSubmit={handleRunCommand} className="px-3 py-2 border-t border-white/10 bg-black/40 flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 shrink-0">
                {vdiId === 'aws-workspaces' ? 'ws-user@x11:$' : isAwsBrowser ? 'aws-wsp>' : 'dev-m4max %'}
              </span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type command (e.g., aws workspaces describe-workspaces, cloudformation, xrandr)..."
                className="flex-1 bg-transparent text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-semibold"
              >
                Run
              </button>
            </form>
          )}
        </div>
      );
    }

    if (winId === 'files') {
      return (
        <div className="flex flex-col h-full bg-[#0d131f] text-slate-200 text-xs">
          {/* File Manager Address & Toolbar */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {folderPaths.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setCurrentPathByVdi((prev) => ({ ...prev, [vdiId]: p }));
                    const first = FILESYSTEM_BY_VDI[vdiId][p]?.[0] || null;
                    setSelectedFileByVdi((prev) => ({ ...prev, [vdiId]: first }));
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    currentFolder === p
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 font-mono shrink-0">{files.length} items</span>
          </div>

          {/* Split File List + File Inspector */}
          <div className="flex-1 grid grid-cols-12 overflow-hidden">
            <div className="col-span-7 border-r border-slate-800/80 overflow-y-auto divide-y divide-slate-800/50">
              {files.map((file) => {
                const isSelected = selectedFile?.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFileByVdi((prev) => ({ ...prev, [vdiId]: file }))}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
                      isSelected ? 'bg-cyan-500/15 text-white' : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type === 'folder' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate font-medium text-[11px]">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400 font-mono">
                      <span>{file.size}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Look / Preview Pane */}
            <div className="col-span-5 p-3 bg-slate-950/60 flex flex-col justify-between overflow-y-auto">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    {selectedFile.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-amber-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-cyan-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white break-all">{selectedFile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {selectedFile.size} • {selectedFile.permissions}
                      </div>
                    </div>
                  </div>
                  {selectedFile.contentPreview ? (
                    <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedFile.contentPreview}
                    </pre>
                  ) : (
                    <div className="text-[11px] text-slate-400">Directory container ({selectedFile.modified})</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">Select a file or folder to inspect properties.</div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{vdiId === 'aws-workspaces' ? 'ext4 / NVMe' : vdiId === 'm365-win11' ? 'EBS gp3 (KMS)' : 'APFS (Encrypted)'}</span>
                <span>RW</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (winId === 'ide') {
      return (
        <div className="flex flex-col h-full bg-[#0b0f17] text-slate-200 text-xs">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[11px] text-slate-200">
                {vdiId === 'aws-workspaces'
                  ? 'x11_window_pipeline.py'
                  : vdiId === 'm365-win11'
                  ? 'aws-workspaces-browser-stack.yaml'
                  : 'MetalComputeEngine.swift'}
              </span>
            </div>
            <button
              onClick={handleRunIdeCode}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors"
            >
              <Play className="w-3 h-3" />
              {vdiId === 'm365-win11' ? 'Deploy AWS Stack in Terminal' : 'Build & Run in Terminal'}
            </button>
          </div>
          <textarea
            value={ideCodeByVdi[vdiId]}
            onChange={(e) => setIdeCodeByVdi((prev) => ({ ...prev, [vdiId]: e.target.value }))}
            spellCheck={false}
            className="flex-1 w-full p-3 bg-[#090d14] text-emerald-300 font-mono text-[11px] leading-relaxed focus:outline-none resize-none"
          />
        </div>
      );
    }

    // Monitor Window (NVIDIA X Server Settings / AWS WorkSpaces WSP Telemetry / macOS Activity Monitor)
    return (
      <div className="p-3 h-full bg-[#0d131f] text-slate-200 text-xs overflow-y-auto space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">CPU Utilization</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{vdi.cpuLoad}%</div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${vdi.cpuLoad}%` }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">{vdi.cores}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Memory Allocation</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {vdi.ramUsedGb} / {vdi.memoryGb} GB
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-purple-400 transition-all duration-300"
                style={{ width: `${Math.round((vdi.ramUsedGb / vdi.memoryGb) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">{vdi.architecture}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">GPU / WSP Encoder</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{vdi.gpuLoad}%</div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${vdi.gpuLoad}%` }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">{vdi.gpuModel}</div>
          </div>
        </div>

        {/* Active OS Window Server & Process Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-300">
            <span>{vdi.windowSystem} — Active Process Tree</span>
            <span className="font-mono text-cyan-400">{vdi.resolution} @ {vdi.refreshRateHz}Hz</span>
          </div>
          <div className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {vdiId === 'aws-workspaces' && (
              <>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-amber-300">/usr/lib/xorg/Xorg :0 -seat seat0 -auth /var/run/lightdm/root/:0</span>
                  <span className="text-slate-400">PID 1104 • 8.2% CPU</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-cyan-300">xfwm4 --display=:0.0 --compositor=on</span>
                  <span className="text-slate-400">PID 1482 • 3.1% CPU</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-emerald-300">xterm -class XTerm -title workspace</span>
                  <span className="text-slate-400">PID 2290 • 1.4% CPU</span>
                </div>
              </>
            )}
            {vdiId === 'm365-win11' && (
              <>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-sky-300">wsp-host-service.exe (Amazon WSP 2.0 WebRTC H.264 Streamer)</span>
                  <span className="text-slate-400">PID 1840 • 4.2% GPU</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-cyan-300">dcv-webrtc-gateway.dll (HTTPS 443 / UDP 4195 Browser Transport)</span>
                  <span className="text-slate-400">PID 2190 • 228 MB</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-emerald-300">aws-cli / cloudformation-stack-agent (Directory d-9267481a2b)</span>
                  <span className="text-slate-400">PID 5412 • 194 MB</span>
                </div>
              </>
            )}
            {vdiId === 'macos-15-mchip' && (
              <>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-purple-300">WindowServer (Quartz Metal 3 Compositor • ProMotion 120Hz)</span>
                  <span className="text-slate-400">PID 388 • 6.4% GPU</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-cyan-300">Finder.app (macOS 15.3 Sequoia Desktop)</span>
                  <span className="text-slate-400">PID 612 • 248 MB</span>
                </div>
                <div className="px-3 py-1.5 flex justify-between">
                  <span className="text-emerald-300">Xcode (Swift 6 + MLX Metal Unified Memory)</span>
                  <span className="text-slate-400">PID 1940 • 2.4 GB</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render OS Window Frame with authentic decorations per OS (X11 Xfwm4, Amazon WorkSpaces Browser WSP, macOS Sequoia Traffic Lights)
  const renderOsWindowFrame = (vdiId: VdiProviderId, win: WindowState) => {
    const isX11 = vdiId === 'aws-workspaces';
    const isAwsBrowser = vdiId === 'm365-win11';
    const isMac = vdiId === 'macos-15-mchip';

    return (
      <div
        key={win.id}
        onClick={() => focusWindow(vdiId, win.id)}
        style={{ zIndex: win.zIndex }}
        className={`flex flex-col rounded-lg overflow-hidden shadow-2xl border transition-all ${
          win.isMaximized ? 'col-span-2 row-span-2' : ''
        } ${
          isX11
            ? 'border-amber-500/40 bg-[#0c1017]'
            : isAwsBrowser
            ? 'border-sky-500/40 bg-[#0f172a]'
            : 'border-white/20 bg-[#141824]'
        }`}
      >
        {/* Window Titlebar */}
        {isX11 && (
          <div className="px-2.5 py-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-amber-500/30 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono text-amber-300">
                X11
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-200 truncate">{win.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimizeWindow(vdiId, win.id);
                }}
                title="Iconify (X11)"
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 flex items-center justify-center text-[10px]"
              >
                _
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximizeWindow(vdiId, win.id);
                }}
                title="Maximize (X11)"
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 flex items-center justify-center text-[10px]"
              >
                □
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWindowOpen(vdiId, win.id, false);
                }}
                title="Destroy Window (XKill)"
                className="w-5 h-5 rounded bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-rose-200 flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {isAwsBrowser && (
          <div className="pl-3 pr-1 py-1 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border-b border-sky-500/30 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-400/40 text-[9px] font-mono text-sky-300">
                AWS WSP
              </span>
              <span className="text-[11px] font-medium text-slate-100 truncate">{win.title}</span>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimizeWindow(vdiId, win.id);
                }}
                className="px-2.5 py-1 hover:bg-white/10 text-slate-300 text-xs"
                title="Minimize"
              >
                ─
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximizeWindow(vdiId, win.id);
                }}
                className="px-2.5 py-1 hover:bg-white/10 text-slate-300 text-xs"
                title="Snap / Maximize"
              >
                ▢
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWindowOpen(vdiId, win.id, false);
                }}
                className="px-2.5 py-1 hover:bg-rose-600 text-slate-300 hover:text-white text-xs rounded-tr"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {isMac && (
          <div className="px-3 py-1.5 bg-[#1e2230] border-b border-white/10 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWindowOpen(vdiId, win.id, false);
                }}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 border border-black/20"
                title="Close Window"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimizeWindow(vdiId, win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 border border-black/20"
                title="Minimize to Dock"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximizeWindow(vdiId, win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 border border-black/20"
                title="Zoom / Tile Fullscreen"
              />
            </div>
            <span className="text-[11px] font-medium text-slate-200 truncate max-w-[70%]">{win.title}</span>
            <span className="text-[10px] font-mono text-purple-300">Metal 3</span>
          </div>
        )}

        {/* Window Content */}
        <div className="flex-1 min-h-[210px] overflow-hidden">{renderWindowBody(vdiId, win.id)}</div>
      </div>
    );
  };

  // Render the complete OS Desktop Workspace for a given VDI (Linux X11, Amazon WorkSpaces on Browser, or macOS 15 Sequoia)
  const renderCompleteOsDesktop = (vdiId: VdiProviderId, compact = false) => {
    const vdi = vdiMap[vdiId];
    const wins = windowsByVdi[vdiId];
    const openWindows = (Object.values(wins) as WindowState[])
      .filter((w) => w.isOpen && !w.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex);
    const maximizedWin = openWindows.find((w) => w.isMaximized);

    // 1. LINUX X11 DESKTOP (Amazon WorkSpaces Ubuntu 24.04 X.Org / XFCE4)
    if (vdiId === 'aws-workspaces') {
      return (
        <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e1b4b] select-none overflow-hidden rounded-xl border border-amber-500/30">
          {/* X11 Top Panel (xfce4-panel / GNOME Xorg bar) */}
          <div className="h-8 px-3 bg-[#090d14]/95 border-b border-amber-500/30 flex items-center justify-between text-xs text-slate-200 z-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setX11MenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[11px]"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Applications (X11)
                </button>
                {x11MenuOpen && (
                  <div className="absolute left-0 top-7 w-56 rounded-lg bg-slate-900 border border-amber-500/40 shadow-2xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-mono text-amber-400 border-b border-slate-800">
                      X.Org Server 21.1.11 (:0.0)
                    </div>
                    {(['terminal', 'files', 'ide', 'monitor'] as DesktopWindowId[]).map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          setWindowOpen('aws-workspaces', id, true);
                          focusWindow('aws-workspaces', id);
                          setX11MenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-amber-500/20 text-slate-200 flex items-center justify-between"
                      >
                        <span className="capitalize">{id === 'ide' ? 'Code - OSS (X11)' : id === 'files' ? 'Thunar File Manager' : id === 'monitor' ? 'NVIDIA X Server Settings' : 'XTerm Terminal'}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* X11 Virtual Workspaces Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono mr-1">Workspace:</span>
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setX11WorkspaceNum(num)}
                    className={`w-5 h-4 rounded text-[10px] font-mono font-bold ${
                      x11WorkspaceNum === num ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Window Tiling Controls */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => arrangeWindows('aws-workspaces', 'tiled-2x2')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                >
                  Tile 2×2 X11
                </button>
                <button
                  onClick={() => arrangeWindows('aws-workspaces', 'maximized')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                >
                  Maximize Active
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-amber-300">DISPLAY=:0.0</span>
              <span className="text-emerald-400">{vdi.latencyMs}ms WSP</span>
              <span className="text-slate-300">ws-user@ubuntu24</span>
            </div>
          </div>

          {/* X11 Desktop Area: Left Shortcut Icons + Multi-Window Grid */}
          <div className="flex-1 flex overflow-hidden p-3 gap-3">
            {/* Desktop X11 Icons Column */}
            {!compact && (
              <div className="w-20 shrink-0 flex flex-col gap-3 items-center pt-1">
                {[
                  { id: 'terminal' as DesktopWindowId, label: 'XTerm', icon: Terminal, color: 'text-amber-400' },
                  { id: 'files' as DesktopWindowId, label: 'Thunar', icon: Folder, color: 'text-cyan-400' },
                  { id: 'ide' as DesktopWindowId, label: 'Code X11', icon: Code2, color: 'text-purple-400' },
                  { id: 'monitor' as DesktopWindowId, label: 'X Server', icon: Activity, color: 'text-emerald-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setWindowOpen('aws-workspaces', item.id, true);
                        focusWindow('aws-workspaces', item.id);
                      }}
                      className="w-full p-2 rounded-lg hover:bg-white/10 flex flex-col items-center gap-1 group transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-700 group-hover:border-amber-400 flex items-center justify-center shadow">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-[10px] text-slate-200 font-medium text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* X11 Window Manager Workspace */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto">
              {maximizedWin ? (
                <div className="lg:col-span-2 h-full">{renderOsWindowFrame('aws-workspaces', maximizedWin)}</div>
              ) : openWindows.length > 0 ? (
                openWindows.map((w) => renderOsWindowFrame('aws-workspaces', w))
              ) : (
                <div className="lg:col-span-2 flex flex-col items-center justify-center text-slate-400 py-16">
                  <Terminal className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white">All X11 windows minimized or closed on Workspace {x11WorkspaceNum}</p>
                  <button
                    onClick={() => arrangeWindows('aws-workspaces', 'tiled-2x2')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
                  >
                    Restore X11 Windows
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* X11 Bottom Window Tasklist Bar */}
          <div className="h-8 px-3 bg-[#090d14]/95 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(Object.values(wins) as WindowState[]).map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    if (!w.isOpen) setWindowOpen('aws-workspaces', w.id, true);
                    else if (w.isMinimized) toggleMinimizeWindow('aws-workspaces', w.id);
                    else focusWindow('aws-workspaces', w.id);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono truncate max-w-[180px] transition-colors ${
                    w.isOpen && !w.isMinimized
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.title}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">X.Org 21.1.11 • GLX Direct Rendering</span>
          </div>
        </div>
      );
    }

    // 2. AMAZON WORKSPACES ON BROWSER — WEB ACCESS (WSP 2.0 HTML5 / WEBRTC CLIENT)
    if (vdiId === 'm365-win11') {
      return (
        <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-[#082f49] via-[#0f172a] to-[#1e293b] select-none overflow-hidden rounded-xl border border-sky-500/40">
          {/* Simulated Chrome/Edge Browser Chrome + Amazon WorkSpaces Web Access URL Bar */}
          <div className="px-3 py-1.5 bg-[#070d19] border-b border-sky-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-sky-200">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                AWS WorkSpaces Web Access
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-[10px] text-emerald-300 truncate max-w-xl">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">https://clients.amazonworkspaces.com/webclient#/session/ws-9f84c2a10?region={awsRegion}&amp;protocol=WSP</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAwsConfigStack((v) => !v)}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold text-amber-200"
              >
                {showAwsConfigStack ? 'Hide AWS Stack YAML/TF' : 'Show AWS Stack YAML/TF'}
              </button>
              <button
                onClick={() => arrangeWindows('m365-win11', 'tiled-2x2')}
                className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-[10px] text-sky-200"
              >
                4-Quadrant WSP Grid
              </button>
              <button
                onClick={() => arrangeWindows('m365-win11', 'maximized')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
              >
                Maximize Active
              </button>
            </div>
          </div>

          {/* Amazon WorkSpaces Browser Desktop Surface: Left Shortcut Icons + WSP Windows */}
          <div className="flex-1 flex overflow-hidden p-3 gap-3 relative">
            {!compact && (
              <div className="w-20 shrink-0 flex flex-col gap-3 items-center pt-1">
                {[
                  { id: 'files' as DesktopWindowId, label: 'AWS Stack Files', icon: Folder, color: 'text-amber-400' },
                  { id: 'terminal' as DesktopWindowId, label: 'AWS CLI Shell', icon: Terminal, color: 'text-sky-400' },
                  { id: 'ide' as DesktopWindowId, label: 'CFN / TF Studio', icon: Code2, color: 'text-purple-400' },
                  { id: 'monitor' as DesktopWindowId, label: 'WSP Telemetry', icon: Activity, color: 'text-emerald-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setWindowOpen('m365-win11', item.id, true);
                        focusWindow('m365-win11', item.id);
                      }}
                      className="w-full p-2 rounded-lg hover:bg-white/10 flex flex-col items-center gap-1 group transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-900/85 border border-sky-500/30 group-hover:border-sky-400 flex items-center justify-center shadow">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-[10px] text-white font-medium text-center leading-tight drop-shadow">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* WSP Browser Window Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto">
              {maximizedWin ? (
                <div className="lg:col-span-2 h-full">{renderOsWindowFrame('m365-win11', maximizedWin)}</div>
              ) : openWindows.length > 0 ? (
                openWindows.map((w) => renderOsWindowFrame('m365-win11', w))
              ) : (
                <div className="lg:col-span-2 flex flex-col items-center justify-center text-slate-300 py-16">
                  <Globe className="w-8 h-8 text-sky-400 mb-2" />
                  <p className="text-sm font-semibold text-white">Amazon WorkSpaces Browser Session (ws-9f84c2a10)</p>
                  <button
                    onClick={() => arrangeWindows('m365-win11', 'tiled-2x2')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 text-xs font-bold"
                  >
                    Restore All 4 WorkSpaces Windows
                  </button>
                </div>
              )}
            </div>

            {/* Amazon WorkSpaces Session Menu Popup */}
            {win11StartOpen && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-80 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Amazon WorkSpaces WSP Menu</span>
                  <span className="text-[10px] font-mono text-sky-400">ws-9f84c2a10</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['files', 'terminal', 'ide', 'monitor'] as DesktopWindowId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setWindowOpen('m365-win11', id, true);
                        focusWindow('m365-win11', id);
                        setWin11StartOpen(false);
                      }}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 border border-slate-700 text-left text-xs text-slate-200 font-medium"
                    >
                      {id === 'files'
                        ? 'Stack File Explorer'
                        : id === 'terminal'
                        ? 'AWS CLI & WSP Shell'
                        : id === 'ide'
                        ? 'CloudFormation / TF'
                        : 'WSP Session Monitor'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amazon WorkSpaces WSP Browser Client Status Bar */}
          <div className="h-10 px-4 bg-[#070d19]/95 backdrop-blur-xl border-t border-sky-500/30 flex items-center justify-between z-30">
            <div className="flex items-center gap-2 text-[10px] text-sky-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Directory: d-9267481a2b (DeviceTypeWeb=ALLOW)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWin11StartOpen((v) => !v)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 flex items-center gap-1.5 text-xs font-bold"
              >
                <Globe className="w-3.5 h-3.5" />
                AWS WSP Menu
              </button>
              {(Object.values(wins) as WindowState[]).map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    if (!w.isOpen) setWindowOpen('m365-win11', w.id, true);
                    else if (w.isMinimized) toggleMinimizeWindow('m365-win11', w.id);
                    else focusWindow('m365-win11', w.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    w.isOpen && !w.isMinimized
                      ? 'bg-white/15 text-white border-b-2 border-sky-400'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {w.id === 'files' ? 'Stack Files' : w.id === 'terminal' ? 'AWS CLI' : w.id === 'ide' ? 'CFN / TF IaC' : 'WSP Monitor'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>WSP 2.0 WebRTC (HTTPS 443)</span>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. MACOS 15 SEQUOIA FULL APPLE SILICON WORKSPACE (mac2-m4max.metal)
    return (
      <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#3b0764] select-none overflow-hidden rounded-xl border border-purple-500/30">
        {/* macOS 15 Sequoia Top Menu Bar */}
        <div className="h-7 px-3 bg-black/70 backdrop-blur-xl border-b border-white/10 flex items-center justify-between text-xs text-slate-100 z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setMacAppleMenuOpen((v) => !v)}
                className="font-bold text-white hover:text-purple-300 flex items-center gap-1"
              >
                <span></span>
                <span className="font-semibold">Sequoia 15.3</span>
              </button>
              {macAppleMenuOpen && (
                <div className="absolute left-0 top-6 w-56 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] text-purple-300 border-b border-white/10">
                    Apple M4 Max • 64 GB Unified Memory
                  </div>
                  <button
                    onClick={() => {
                      arrangeWindows('macos-15-mchip', 'tiled-2x2');
                      setMacAppleMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-purple-600/40 text-slate-100"
                  >
                    Tile All Windows (Sequoia Window Tiling)
                  </button>
                  <button
                    onClick={() => {
                      setMacStageManager((s) => !s);
                      setMacAppleMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-purple-600/40 text-slate-100"
                  >
                    Toggle Stage Manager ({macStageManager ? 'On' : 'Off'})
                  </button>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-300 hidden sm:inline">Finder</span>
            <span className="text-[11px] text-slate-400 hidden md:inline">File</span>
            <span className="text-[11px] text-slate-400 hidden md:inline">Edit</span>
            <span className="text-[11px] text-slate-400 hidden md:inline">View</span>
            <button
              onClick={() => arrangeWindows('macos-15-mchip', 'tiled-2x2')}
              className="text-[11px] text-purple-300 hover:text-white font-medium"
            >
              Window ▸ Tile 2×2
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            {/* Amazon DCV Server Indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-[10px] text-purple-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DCV :8443 (QUIC/WebRTC)</span>
            </div>

            {/* bVNC Console launchctl status */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/40 text-[10px] text-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>launchctl gui/501 (bVNC :5900)</span>
            </div>

            {/* Quick Action: Trigger bootstrap */}
            <button
              onClick={() => {
                handleRunCommand(undefined, './launchctl-bootstrap-bvnc-console.sh');
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[10px] text-purple-200 font-bold"
            >
              <span>launchctl bootstrap</span>
            </button>

            <span className="text-purple-300 hidden md:inline">M4 Max • 120Hz</span>
            <span className="text-slate-200">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* macOS Sequoia Workspace Surface: Stage Manager Strip + Quartz Windows */}
        <div className="flex-1 flex overflow-hidden p-3 gap-3">
          {macStageManager && !compact && (
            <div className="w-24 shrink-0 flex flex-col gap-2.5 pt-1">
              <div className="text-[9px] font-mono uppercase tracking-wider text-purple-300 px-1">Stage Manager</div>
              {[
                { id: 'files' as DesktopWindowId, label: 'Finder', sub: 'APFS HD', icon: Folder },
                { id: 'terminal' as DesktopWindowId, label: 'iTerm2', sub: 'zsh arm64e', icon: Terminal },
                { id: 'ide' as DesktopWindowId, label: 'Xcode 16.2', sub: 'Metal 3', icon: Code2 },
                { id: 'monitor' as DesktopWindowId, label: 'Activity', sub: 'M4 Max', icon: Activity }
              ].map((st) => {
                const Icon = st.icon;
                const isOpen = wins[st.id].isOpen && !wins[st.id].isMinimized;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setWindowOpen('macos-15-mchip', st.id, true);
                      focusWindow('macos-15-mchip', st.id);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isOpen
                        ? 'bg-white/15 border-purple-400/50 shadow-lg'
                        : 'bg-black/30 border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-purple-300" />
                      <span className="text-[11px] font-bold text-white truncate">{st.label}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-300 mt-0.5">{st.sub}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quartz Window Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto">
            {maximizedWin ? (
              <div className="lg:col-span-2 h-full">{renderOsWindowFrame('macos-15-mchip', maximizedWin)}</div>
            ) : openWindows.length > 0 ? (
              openWindows.map((w) => renderOsWindowFrame('macos-15-mchip', w))
            ) : (
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-slate-300 py-16">
                <Command className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-sm font-semibold text-white">macOS 15 Sequoia Desktop</p>
                <button
                  onClick={() => arrangeWindows('macos-15-mchip', 'tiled-2x2')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold"
                >
                  Open All Workspace Windows
                </button>
              </div>
            )}
          </div>
        </div>

        {/* macOS Floating Translucent Dock */}
        <div className="py-2 flex justify-center z-20">
          <div className="px-4 py-1.5 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-3">
            {[
              { id: 'files' as DesktopWindowId, label: 'Finder', icon: Folder, color: 'bg-sky-500' },
              { id: 'terminal' as DesktopWindowId, label: 'iTerm2', icon: Terminal, color: 'bg-emerald-600' },
              { id: 'ide' as DesktopWindowId, label: 'Xcode 16', icon: Code2, color: 'bg-indigo-600' },
              { id: 'monitor' as DesktopWindowId, label: 'Activity Monitor', icon: Activity, color: 'bg-purple-600' }
            ].map((dockApp) => {
              const Icon = dockApp.icon;
              const isOpen = wins[dockApp.id].isOpen;
              return (
                <button
                  key={dockApp.id}
                  onClick={() => {
                    setWindowOpen('macos-15-mchip', dockApp.id, true);
                    focusWindow('macos-15-mchip', dockApp.id);
                  }}
                  className="group relative flex flex-col items-center"
                  title={dockApp.label}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${dockApp.color} flex items-center justify-center text-white shadow-lg group-hover:-translate-y-1 transition-transform`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {isOpen && <span className="w-1 h-1 rounded-full bg-white" />}
                    <span className="text-[10px] text-slate-200 font-medium">{dockApp.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 overflow-y-auto' : ''}`}>
      {/* Hidden backing canvas used when recording .mp4 desktop task videos */}
      <canvas ref={backingCanvasRef} width={1280} height={720} className="hidden" />
      {/* Hidden WebRTC 60 FPS Multi-OS Compositor Canvas */}
      <canvas ref={webrtcCanvasRef} width={1280} height={720} className="hidden" />

      {/* Top Cloud VDI Workspace Switcher & Control Header */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Cloud VDI Desktop Workspaces &amp; Amazon WorkSpaces Browser Stack
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                Linux X11 • Amazon WorkSpaces on Browser (WSP) • macOS 15 Sequoia
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                ● WebRTC RTCPeerConnection: {webRtcBitrateMbps} Mbps @ 60 FPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Streams Linux X-Windows (X11), Amazon WorkSpaces on Browser (<code className="text-sky-300">clients.amazonworkspaces.com/webclient</code>), and Apple Silicon macOS 15 Sequoia over WebRTC &amp; noVNC.
            </p>
          </div>
        </div>

        {/* VDI Layout & Screen Recording Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setLayoutMode('single-desktop')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                layoutMode === 'single-desktop' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Full Desktop
            </button>
            <button
              onClick={() => setLayoutMode('triple-vdi-grid')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                layoutMode === 'triple-vdi-grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              All 3 VDI Desktops
            </button>
          </div>

          <button
            onClick={() => setShowAwsConfigStack((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              showAwsConfigStack
                ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-lg shadow-amber-950/40'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>AWS WorkSpaces Stack ({showAwsConfigStack ? 'On' : 'Off'})</span>
          </button>

          <button
            onClick={() => setShowWebRtcMonitor((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              showWebRtcMonitor
                ? 'bg-cyan-600/30 border-cyan-400/60 text-cyan-200 shadow-lg shadow-cyan-950/40'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>WebRTC Stream Monitor ({showWebRtcMonitor ? 'On' : 'Off'})</span>
          </button>

          <button
            onClick={() => setShowVncMercorHub((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              showVncMercorHub
                ? 'bg-purple-600/30 border-purple-400/60 text-purple-200 shadow-lg shadow-purple-950/40'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Free macos-15 noVNC &amp; Mercor Share</span>
          </button>

          {/* Optional Desktop .mp4 Recorder */}
          {!isRecordingMp4 ? (
            <button
              onClick={startDesktopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow"
            >
              <Circle className="w-3 h-3 fill-white" />
              Record Desktop (.mp4)
            </button>
          ) : (
            <button
              onClick={stopDesktopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold animate-pulse"
            >
              <Square className="w-3 h-3 fill-slate-950" />
              Stop Recording ({recordingSec}s)
            </button>
          )}

          {recordings.length > 0 && (
            <button
              onClick={() => setShowRecordingsDrawer((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 font-mono"
            >
              <Film className="w-3.5 h-3.5" />
              Recordings ({recordings.length})
            </button>
          )}

          <button
            onClick={() => {
              setClipboardSynced(true);
              setTimeout(() => setClipboardSynced(false), 2000);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300"
          >
            {clipboardSynced ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            <span>{clipboardSynced ? 'Clipboard Synced' : 'Sync Clipboard'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Toggle Fullscreen VDI"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VDI Machine Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.values(vdiMap) as VdiInstance[]).map((inst) => {
          const isSelected = activeVdiId === inst.id;
          const badgeColor =
            inst.id === 'aws-workspaces'
              ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              : inst.id === 'm365-win11'
              ? 'text-sky-400 border-sky-500/30 bg-sky-500/10'
              : 'text-purple-400 border-purple-500/30 bg-purple-500/10';

          return (
            <button
              key={inst.id}
              onClick={() => setActiveVdiId(inst.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${badgeColor}`}>
                  {inst.providerBadge}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {inst.latencyMs}ms • {inst.fps} FPS
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate">{inst.name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{inst.windowSystem}</div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{inst.cores} • {inst.memoryGb}GB RAM</span>
                <span className="text-cyan-300">{inst.resolution}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* AWS CONFIGURATION STACK PANEL FOR AMAZON WORKSPACES ON BROWSER (WSP WEB ACCESS) */}
      {showAwsConfigStack && (
        <div className="p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">
                    AWS Configuration Stack — Amazon WorkSpaces on Browser (WSP Web Access)
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                    DeviceTypeWeb=ALLOW • https://clients.amazonworkspaces.com/webclient
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Complete Infrastructure-as-Code stack (CloudFormation, Terraform, AWS CLI &amp; WorkSpaces Secure Browser Portal) to run Amazon WorkSpaces directly in any HTML5 browser over WSP/WebRTC.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {[
                { id: 'cloudformation' as const, label: '1. CloudFormation Stack (.yaml)' },
                { id: 'terraform' as const, label: '2. Terraform HCL (main.tf)' },
                { id: 'aws-cli' as const, label: '3. AWS CLI Browser Enabler (.sh)' },
                { id: 'workspaces-web-portal' as const, label: '4. WorkSpaces Web Portal' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAwsStackTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                    awsStackTab === t.id
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: AWS Stack Parameters & Architecture Checklist */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-amber-300">
                    AWS Stack Parameters
                  </span>
                  <span className="font-mono text-[10px] text-sky-400">Protocol: WSP 2.0 WebRTC</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">AWS Region</label>
                    <select
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    >
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">WSP Compute Bundle</label>
                    <select
                      value={awsBundleType}
                      onChange={(e) => setAwsBundleType(e.target.value as 'POWERPRO_WSP' | 'PERFORMANCE_WSP' | 'GRAPHICS_G4DN_WSP')}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    >
                      <option value="POWERPRO_WSP">PowerPro (8vCPU / 32GB)</option>
                      <option value="PERFORMANCE_WSP">Performance (2vCPU / 8GB)</option>
                      <option value="GRAPHICS_G4DN_WSP">Graphics G4dn (T4 GPU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">Running Mode</label>
                    <select
                      value={awsRunningMode}
                      onChange={(e) => setAwsRunningMode(e.target.value as 'AUTO_STOP' | 'ALWAYS_ON')}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    >
                      <option value="AUTO_STOP">AUTO_STOP (Hourly Cost)</option>
                      <option value="ALWAYS_ON">ALWAYS_ON (Instant)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-sky-300">Required AWS Stack Resources for Browser Access:</div>
                  <div className="text-slate-300 space-y-1 font-mono text-[10px]">
                    <div>1. <span className="text-amber-300">AWS::EC2::VPC</span> + 2 Private Subnets in distinct AZs</div>
                    <div>2. <span className="text-amber-300">AWS::DirectoryService::MicrosoftAD</span> (corp.edge-vdi.aws)</div>
                    <div>3. <span className="text-emerald-300">WorkspaceAccessProperties.DeviceTypeWeb = ALLOW</span></div>
                    <div>4. <span className="text-sky-300">AWS::WorkSpaces::Workspace</span> with <span className="text-sky-300">WSP</span> bundle ({selectedBundle.id})</div>
                    <div>5. Browser Client: <span className="text-cyan-300">https://clients.amazonworkspaces.com/webclient</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveVdiId('m365-win11');
                      setIdeCodeByVdi((prev) => ({ ...prev, 'm365-win11': activeAwsStackCode }));
                      handleRunIdeCode();
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    Load &amp; Deploy Stack in WorkSpaces Browser VDI
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Code Viewer with Copy & Download */}
            <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-amber-300">
                  {awsStackTab === 'cloudformation'
                    ? 'aws-workspaces-browser-stack.yaml (AWS CloudFormation)'
                    : awsStackTab === 'terraform'
                    ? 'main.tf (HashiCorp Terraform AWS Provider)'
                    : awsStackTab === 'aws-cli'
                    ? 'deploy-workspaces-browser.sh (AWS CLI v2)'
                    : 'aws-workspaces-web-portal.yaml (AWS::WorkSpacesWeb::Portal)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyAwsStack(awsStackTab, activeAwsStackCode)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1"
                  >
                    {awsCopiedStack === awsStackTab ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Copied Stack
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3 h-3" />
                        Copy Stack Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadAwsStack}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download File
                  </button>
                </div>
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[300px] leading-relaxed select-all">
                {activeAwsStackCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Live WebRTC RTCPeerConnection Desktop Streamer Panel (Linux X11 / Amazon WorkSpaces on Browser / macOS 15 / All-3-OS Matrix) */}
      {showWebRtcMonitor && (
        <div className="p-4 rounded-xl bg-slate-900/95 border border-cyan-500/40 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Live WebRTC RTCPeerConnection Multi-OS Desktop Streamer
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                    P2P Connected • {webRtcBitrateMbps} Mbps • 60 FPS • Synced with /vnc.html
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Streams the full Linux X-Windows (<code className="text-amber-300">DISPLAY=:0.0</code>), Amazon WorkSpaces on Browser (<code className="text-sky-300">WSP 2.0 WebRTC</code>), or macOS 15 Sequoia (<code className="text-purple-300">Quartz Metal 3</code>) desktop over a real <code className="text-cyan-300">RTCPeerConnection</code> video track.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Share Desktop via WebRTC:</span>
              {[
                { id: 'linux-x11' as const, label: 'Linux X-Windows (X11)', vdi: 'aws-workspaces' as VdiProviderId, activeClass: 'bg-amber-500/25 border-amber-400 text-amber-200' },
                { id: 'win11' as const, label: 'Amazon WorkSpaces (Browser WSP)', vdi: 'm365-win11' as VdiProviderId, activeClass: 'bg-sky-500/25 border-sky-400 text-sky-200' },
                { id: 'macos-15' as const, label: 'macOS 15 Sequoia', vdi: 'macos-15-mchip' as VdiProviderId, activeClass: 'bg-purple-500/25 border-purple-400 text-purple-200' },
                { id: 'all-os' as const, label: 'All 3 Desktops (Matrix)', vdi: null, activeClass: 'bg-emerald-500/25 border-emerald-400 text-emerald-200' }
              ].map((btn) => {
                const currentResolved =
                  webRtcTargetMode !== 'active-os'
                    ? webRtcTargetMode
                    : layoutMode === 'triple-vdi-grid'
                    ? 'all-os'
                    : activeVdiId === 'aws-workspaces'
                    ? 'linux-x11'
                    : activeVdiId === 'm365-win11'
                    ? 'win11'
                    : 'macos-15';
                const isBtnActive = currentResolved === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => {
                      setWebRtcTargetMode(btn.id);
                      if (btn.vdi) {
                        setActiveVdiId(btn.vdi);
                        setLayoutMode('single-desktop');
                      } else {
                        setLayoutMode('triple-vdi-grid');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      isBtnActive
                        ? btn.activeClass
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live WebRTC Receiver Video + Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-8 rounded-xl overflow-hidden border border-cyan-500/40 bg-black relative">
              <video
                ref={webrtcVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[230px] object-contain bg-black block"
              />
              <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-300">
                <span className="text-cyan-300">
                  ● RTCPeerConnection Receiver Track (H.264 / VP9 • 1280×720 @ 60 FPS)
                </span>
                <span>
                  Synced live with <code className="text-emerald-300">/vnc.html</code> via BroadcastChannel
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="text-[11px] font-bold text-white flex items-center justify-between">
                <span>WebRTC + noVNC Dual-Window Sync</span>
                <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Switching between <strong>Linux X-Windows (X11)</strong>, <strong>Amazon WorkSpaces on Browser (WSP)</strong>, <strong>macOS 15 Sequoia</strong>, or <strong>All 3 Desktops</strong> updates both this workspace and any open <code className="text-cyan-300">/vnc.html</code> window in real time.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    const videoEl = webrtcVideoRef.current;
                    if (videoEl && 'requestPictureInPicture' in videoEl) {
                      (videoEl as HTMLVideoElement & { requestPictureInPicture: () => Promise<void> })
                        .requestPictureInPicture()
                        .catch(() => {});
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                >
                  Popout WebRTC PiP Monitor
                </button>
                <a
                  href={`${window.location.origin}/vnc.html?autoconnect=true&resize=scale&os=${
                    activeVdiId === 'aws-workspaces' ? 'linux-x11' : activeVdiId === 'm365-win11' ? 'win11' : 'macos-15'
                  }&mercor_project=${encodeURIComponent(vncConfig.mercorProjectId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-[11px]"
                >
                  Open /vnc.html in Split Tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free GitHub Actions macos-15 (Apple Silicon M-Chip) + noVNC / Cloudflare Tunnel & Mercor VNC Screen Share Hub */}
      {showVncMercorHub && (
        <VncMercorFreeMacHub
          activeVdiId={activeVdiId}
          onSelectVdi={(id) => setActiveVdiId(id)}
          vncConfig={vncConfig}
          onUpdateVncConfig={setVncConfig}
          isRecordingMp4={isRecordingMp4}
          recordingSec={recordingSec}
          onStartRecording={startDesktopRecording}
          onStopRecording={stopDesktopRecording}
          onInjectTerminalLog={handleInjectTerminalLog}
        />
      )}

      {/* Recorded .mp4 Desktop Clips Drawer */}
      {showRecordingsDrawer && recordings.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Captured VDI Desktop Recordings (.mp4)
              </h3>
            </div>
            <button
              onClick={() => setShowRecordingsDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recordings.map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white font-mono truncate">{rec.filename}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {rec.vdiName} ({rec.windowSystem})
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-1">
                    {rec.durationSec}s • {rec.sizeMb} MB • {rec.codec}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <a
                    href={rec.videoUrl}
                    download={rec.filename}
                    className="flex-1 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download .mp4
                  </a>
                  <button
                    onClick={() => setRecordings((prev) => prev.filter((r) => r.id !== rec.id))}
                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main VDI Desktop Workspace Viewport */}
      {vncConfig.mode === 'external-novnc-iframe' ? (
        <div className="rounded-xl bg-slate-950 border border-cyan-500/40 overflow-hidden flex flex-col h-[680px]">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-bold">Live noVNC / Cloudflare Tunnel Stream</span>
              <span className="text-cyan-300 truncate max-w-md">{vncConfig.tunnelUrl}</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-200">
                Project: {vncConfig.mercorProjectId}
              </span>
            </div>
            <button
              onClick={() => setVncConfig((prev) => ({ ...prev, mode: 'internal-rfb-bridge' }))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
            >
              Return to Built-In Multi-Window OS Desktop
            </button>
          </div>
          <iframe
            src={vncConfig.tunnelUrl}
            title="Live noVNC Remote Desktop Stream"
            className="flex-1 w-full bg-black border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      ) : layoutMode === 'single-desktop' ? (
        <div className="h-[680px] w-full">{renderCompleteOsDesktop(activeVdiId, false)}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {(['aws-workspaces', 'm365-win11', 'macos-15-mchip'] as VdiProviderId[]).map((id) => (
            <div key={id} className="h-[620px] flex flex-col">
              {renderCompleteOsDesktop(id, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
