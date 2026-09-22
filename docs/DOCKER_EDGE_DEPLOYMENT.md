# Edge Docker & Container Deployment Best Practices

Deploying Docker containers to resource-constrained ARM64 devices requires specific configurations for memory management, GPU passthrough, and storage longevity.

---

## 1. Multi-Architecture ARM64 Image Building

Always target `linux/arm64` when building containers for Jetson Orin Nano, Raspberry Pi 5, or Thor Nano:

```bash
docker buildx build \
  --platform linux/arm64 \
  -t my-edge-app:latest \
  --push .
```

---

## 2. NVIDIA Container Runtime Configuration

On NVIDIA Jetson (L4T / JetPack), Docker requires the NVIDIA runtime to access CUDA:

### `/etc/docker/daemon.json`:
```json
{
  "runtimes": {
    "nvidia": {
      "path": "nvidia-container-runtime",
      "runtimeArgs": []
    }
  },
  "default-runtime": "nvidia"
}
```

Restart the Docker daemon after modifying this file:
```bash
sudo systemctl restart docker
```

---

## 3. Essential Container Flags for Edge Workloads

| Flag | Purpose |
| :--- | :--- |
| `--runtime nvidia` | Enables CUDA, TensorRT, and NVDEC/NVENC hardware passthrough on Jetson. |
| `--ipc=host` | Critical for PyTorch DataLoader multiprocessing and ROS 2 shared memory nodes. |
| `--device /dev/video0` | Passes USB / V4L2 webcams into the container. |
| `-v /tmp/argus_socket:/tmp/argus_socket` | Required for MIPI CSI cameras on Jetson (libargus pipeline). |
| `--restart unless-stopped` | Ensures autonomous edge nodes recover automatically after power interruptions. |
| `--memory=6g --memory-swap=8g` | Prevents runaway workloads from causing kernel OOM panic on 8GB boards. |

---

## 4. Mitigating SD Card Wear on Edge Devices

Running continuous logging or writing video frames directly to MicroSD cards can wear out flash storage within months.

### Best Practices:
1. **Mount volatile logs to `tmpfs` (RAM)**:
   ```bash
   docker run -d --tmpfs /tmp --tmpfs /var/log my-edge-app:latest
   ```
2. **Attach high-endurance NVMe SSDs**:
   - Jetson Orin Nano features an M.2 PCIe Gen4 x4 NVMe slot. Mount database storage directly to `/mnt/nvme`.
   - Raspberry Pi 5 supports M.2 PCIe Gen2/Gen3 HATs for SSD root filesystems.
