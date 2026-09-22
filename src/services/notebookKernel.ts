import { DeviceId, NotebookCellOutput } from '../types';

export interface KernelExecutionResult {
  outputs: NotebookCellOutput[];
  executionTimeMs: number;
}

export class NotebookKernelService {
  private sessionState: Record<string, any> = {};
  private targetHardware: DeviceId = 'orin-nano';

  constructor(targetHardware: DeviceId = 'orin-nano') {
    this.targetHardware = targetHardware;
    this.reset();
  }

  public setTargetHardware(hardware: DeviceId): void {
    this.targetHardware = hardware;
  }

  public reset(): void {
    this.sessionState = {
      torch_version: '2.2.0+nv24.03',
      cuda_available: this.targetHardware !== 'pi-5',
      device_name:
        this.targetHardware === 'orin-nano'
          ? 'NVIDIA Orin Nano (40 TOPS)'
          : this.targetHardware === 'thor-nano'
          ? 'NVIDIA Thor Nano (250 TOPS)'
          : 'ARM Cortex-A76 (Raspberry Pi 5)',
    };
  }

  public async executeCell(source: string): Promise<KernelExecutionResult> {
    const startTime = performance.now();
    const outputs: NotebookCellOutput[] = [];

    // Simulate realistic execution delay between 80ms and 350ms
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 150) + 100));

    const lines = source.split('\n');
    const printedLines: string[] = [];
    let detectedTable: { headers: string[]; rows: (string | number)[][] } | null = null;
    let detectedPlot: 'latency' | 'throughput' | 'spectrogram' | 'detection' | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Shell magic commands
      if (line.startsWith('!')) {
        const cmd = line.slice(1).trim();
        if (cmd.startsWith('nvidia-smi')) {
          if (this.targetHardware === 'pi-5') {
            printedLines.push('bash: nvidia-smi: command not found (Raspberry Pi 5 uses VideoCore VII / CPU NEON)');
          } else {
            const isThor = this.targetHardware === 'thor-nano';
            printedLines.push(
              `+---------------------------------------------------------------------------------------+\n` +
              `| NVIDIA-SMI 550.54.14             Driver Version: 550.54.14    CUDA Version: ${isThor ? '12.4' : '12.2'}     |\n` +
              `|-----------------------------------------+----------------------+----------------------+\n` +
              `| GPU  Name                  Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |\n` +
              `| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |\n` +
              `|=========================================+======================+======================|\n` +
              `|   0  ${isThor ? 'Thor (Blackwell Edge)' : 'Orin (Ampere)'}            On | 00000000:00:00.0 Off |                  N/A |\n` +
              `| N/A   ${isThor ? '49C' : '44C'}    P0             ${isThor ? '18.4W / 45W' : '6.2W / 15W'} |    ${isThor ? '3840MiB / 16384MiB' : '1420MiB / 7860MiB'} |     ${isThor ? '24%' : '14%'}      Default |\n` +
              `+-----------------------------------------+----------------------+----------------------+`
            );
          }
        } else if (cmd.startsWith('jetson_clocks')) {
          if (this.targetHardware === 'pi-5') {
            printedLines.push('jetson_clocks: command only supported on NVIDIA Tegra/Orin/Thor SoCs');
          } else {
            printedLines.push(
              `SOC Power Mode: ${this.targetHardware === 'thor-nano' ? 'MAXN 45W (8-Core Blackwell)' : '15W 6-Core (MAXN)'}\n` +
              `EMC Clock: 2133 MHz | GPU Clock: 625 MHz | CPU Clock: 1510 MHz`
            );
          }
        } else if (cmd.startsWith('lscpu') || cmd.startsWith('cat /proc/cpuinfo')) {
          if (this.targetHardware === 'pi-5') {
            printedLines.push(
              `Model name:            Cortex-A76\n` +
              `CPU max MHz:           2400.0000\n` +
              `Flags:                 fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp asimddp sha512`
            );
          } else {
            printedLines.push(
              `Architecture:          aarch64\n` +
              `CPU op-mode(s):        64-bit\n` +
              `Model name:            ARM Cortex-A78AE (NVIDIA Tegra Orin)\n` +
              `CPU max MHz:           2000.0000\n` +
              `Flags:                 fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp`
            );
          }
        } else if (cmd.startsWith('pip install')) {
          const pkg = cmd.replace('pip install', '').trim();
          printedLines.push(
            `Collecting ${pkg}\n` +
            `  Downloading ${pkg}-py3-none-any.whl (1.4 MB)\n` +
            `Installing collected packages: ${pkg}\n` +
            `Successfully installed ${pkg}`
          );
        } else if (cmd.startsWith('uname')) {
          printedLines.push(`Linux edge-node 5.15.136-tegra #1 SMP PREEMPT aarch64 GNU/Linux`);
        } else {
          printedLines.push(`$ ${cmd}\nCommand executed successfully with return code 0.`);
        }
        continue;
      }

      // PyTorch / TensorRT checks
      if (line.includes('print(')) {
        const match = line.match(/print\((.*)\)/);
        if (match) {
          const inner = match[1].trim();
          if (inner.startsWith('f"') || inner.startsWith("f'")) {
            // Simulated formatted strings
            let rendered = inner.slice(2, -1);
            rendered = rendered
              .replace('{torch.__version__}', this.sessionState.torch_version)
              .replace('{torch.cuda.is_available()}', String(this.sessionState.cuda_available))
              .replace('{torch.cuda.get_device_name(0)}', this.sessionState.device_name)
              .replace('{categories}', "{1: 'animal', 2: 'person', 3: 'vehicle'}")
              .replace('{mean_latency_ms:.2f}', this.targetHardware === 'thor-nano' ? '3.82' : this.targetHardware === 'pi-5' ? '28.60' : '14.20')
              .replace('{p95_latency_ms:.2f}', this.targetHardware === 'thor-nano' ? '4.91' : this.targetHardware === 'pi-5' ? '34.10' : '16.80')
              .replace('{fps:.1f}', this.targetHardware === 'thor-nano' ? '261.8' : this.targetHardware === 'pi-5' ? '34.9' : '70.4')
              .replace('{fps / power_w:.2f}', this.targetHardware === 'thor-nano' ? '12.46' : this.targetHardware === 'pi-5' ? '3.84' : '7.49');
            printedLines.push(rendered);
          } else {
            const cleanStr = inner.replace(/^['"]|['"]$/g, '');
            printedLines.push(cleanStr);
          }
        }
      } else if (line.includes('trtexec') || line.includes('TensorRT') || line.includes('yolov8n_int8.engine')) {
        printedLines.push(
          `[TensorRT 8.6] Loaded ONNX graph successfully.\n` +
          `[TensorRT] Precision mode: INT8 with dynamic range calibration.\n` +
          `[TensorRT] Serialized engine built for Ampere SM 8.7.`
        );
        detectedPlot = 'latency';
      } else if (line.includes('MegaDetector') || line.includes('md_v5a') || line.includes('trap_images')) {
        detectedTable = {
          headers: ['Frame File', 'Classification', 'Confidence', 'Action', 'Inference Latency'],
          rows: [
            ['IMG_0042.JPG', 'Animal (Snow Leopard)', '94.2%', 'Save & Tag GPS', '42.3 ms'],
            ['IMG_0043.JPG', 'Animal (Ibex)', '88.7%', 'Save & Tag GPS', '41.8 ms'],
            ['IMG_0044.JPG', 'Person (Field Ranger)', '96.5%', 'Alert Ops Room', '43.1 ms'],
            ['IMG_0045.JPG', 'Empty (Wind branch)', '8.2%', 'Discard / Save Battery', '39.6 ms'],
          ],
        };
        detectedPlot = 'detection';
      } else if (line.includes('spectrogram') || line.includes('n_mels') || line.includes('SPARROW')) {
        detectedPlot = 'spectrogram';
      }
    }

    const elapsed = Math.round(performance.now() - startTime);

    if (printedLines.length > 0) {
      outputs.push({
        id: `out-${Date.now()}-txt`,
        type: 'text',
        content: printedLines.join('\n'),
        executionTimeMs: elapsed,
      });
    }

    if (detectedTable) {
      outputs.push({
        id: `out-${Date.now()}-tbl`,
        type: 'table',
        content: 'Tabular Execution Output',
        executionTimeMs: elapsed,
        tableData: detectedTable,
      });
    }

    if (detectedPlot) {
      outputs.push({
        id: `out-${Date.now()}-plt`,
        type: 'plot',
        content: 'Telemetry & Metric Visualization',
        plotType: detectedPlot,
      });
    }

    // Default output if nothing explicitly printed
    if (outputs.length === 0) {
      outputs.push({
        id: `out-${Date.now()}-ok`,
        type: 'text',
        content: `Cell executed in ${elapsed} ms. State synchronized in ARM64 Python kernel.`,
        executionTimeMs: elapsed,
      });
    }

    return {
      outputs,
      executionTimeMs: elapsed,
    };
  }
}
