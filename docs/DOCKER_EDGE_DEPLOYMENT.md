# Edge Docker & Container Deployment Best Practices

Deploying Docker containers to resource-constrained ARM64 devices requires specific configurations for memory management, GPU passthrough, storage longevity, and automated GitHub CI/CD workflows.

---

## 1. Multi-Architecture ARM64 Image Building & GitHub Container Registry (GHCR)

Modern edge infrastructure uses GitHub Container Registry (`ghcr.io`) for hosting multi-arch containers. Target both `linux/arm64` (for Jetson Orin Nano, Raspberry Pi 5, Thor Nano) and `linux/amd64`:

```bash
# Build multi-architecture image with Docker Buildx
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/bheemaiah/edgedocker-sim:latest \
  --push .
```

### Pull and Run from GitHub Container Registry (GHCR):

On any ARM64 edge node or development host:
```bash
# Authenticate (if pulling private images; public images require no login)
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Pull and run the container
docker pull ghcr.io/bheemaiah/edgedocker-sim:latest
docker run -d \
  --name edgedocker-sim \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/bheemaiah/edgedocker-sim:latest
```

---

## 2. Docker Compose on Edge Hardware

Running with `docker-compose` simplifies hardware passthrough, tmpfs log mounting, and resource boundaries:

```yaml
# docker-compose.yml
services:
  edgedocker-sim:
    image: ghcr.io/bheemaiah/edgedocker-sim:latest
    container_name: edgedocker-sim
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64m
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1024M
```

Launch with:
```bash
docker compose up -d
```

---

## 3. NVIDIA Container Runtime Configuration

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

## 4. Essential Container Flags for Edge Workloads

| Flag | Purpose |
| :--- | :--- |
| `--runtime nvidia` | Enables CUDA, TensorRT, and NVDEC/NVENC hardware passthrough on Jetson. |
| `--ipc=host` | Critical for PyTorch DataLoader multiprocessing and ROS 2 shared memory nodes. |
| `--device /dev/video0` | Passes USB / V4L2 webcams into the container. |
| `-v /tmp/argus_socket:/tmp/argus_socket` | Required for MIPI CSI cameras on Jetson (libargus pipeline). |
| `--restart unless-stopped` | Ensures autonomous edge nodes recover automatically after power interruptions. |
| `--memory=6g --memory-swap=8g` | Prevents runaway workloads from causing kernel OOM panic on 8GB boards. |

---

## 5. Mitigating SD Card Wear on Edge Devices

Running continuous logging or writing video frames directly to MicroSD cards can wear out flash storage within months.

### Best Practices:
1. **Mount volatile logs to `tmpfs` (RAM)**:
   ```bash
   docker run -d --tmpfs /tmp --tmpfs /var/log my-edge-app:latest
   ```
2. **Attach high-endurance NVMe SSDs**:
   - Jetson Orin Nano features an M.2 PCIe Gen4 x4 NVMe slot. Mount database storage directly to `/mnt/nvme`.
   - Raspberry Pi 5 supports M.2 PCIe Gen2/Gen3 HATs for SSD root filesystems.

