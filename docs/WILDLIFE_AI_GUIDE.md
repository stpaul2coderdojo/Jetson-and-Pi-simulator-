# Wildlife AI & Passive Acoustic Monitoring (PAM) Edge Guide

Edge computing plays a transformative role in conservation biology, anti-poaching operations, and biodiversity assessment. In remote habitats (rainforests, savannahs, marine reserves), edge devices must operate within strict solar/battery budgets while analyzing camera traps and bioacoustic feeds locally.

---

## 1. Microsoft SPARROW

**Repository**: [microsoft/sparrow](https://github.com/microsoft/sparrow)  
**Focus**: Smart Platform for Acoustic and Remote Wildlife Operations.

### Edge Features:
- Designed to integrate with AudioMoth and camera trap sensors in off-grid deployments.
- Power budgeting: Automatically regulates inference duty-cycles based on battery voltage and solar irradiance (e.g. throttling from continuous listening to 30-second windows when battery < 3.6V).
- Low-bandwidth satellite telemetry (Swarm / Iridium / LoRaWAN) to transmit metadata summaries (species, confidence, GPS, timestamp) rather than raw uncompressed audio or images.

### Docker Run Configuration:
```bash
docker run --runtime nvidia --gpus all \
  -e SOLAR_POWER_MODE=adaptive \
  -e PAM_AUDIO_INPUT=/dev/snd/pcmC1D0c \
  -e LORAWAN_PORT=/dev/ttyUSB0 \
  --device /dev/snd:/dev/snd \
  ghcr.io/microsoft/sparrow:latest
```

---

## 2. MegaDetector for Camera Traps

**Repository**: [agentmorris/megadetector](https://github.com/agentmorris/megadetector)  
**Model Architecture**: YOLOv5 / YOLOv8 trained specifically on diverse global camera-trap datasets.

### Target Classes:
1. `0: Animal`
2. `1: Person` (crucial for anti-poaching or ranger safety alerts)
3. `2: Vehicle` (detecting unauthorized vehicle incursions in protected parks)

### Edge Advantages:
- Filters out 70%–95% of camera trap frames triggered by wind, moving leaves, or sunlight glare without requiring costly satellite data transmission.
- On the **Jetson Orin Nano**, MegaDetector runs at ~58 FPS in FP16, enabling real-time video stream triage directly on solar towers.

---

## 3. MegaDetector Acoustic & Bioacoustics

**Repository**: [megadetector/megadetector-acoustic](https://github.com/megadetector/megadetector-acoustic)  
**Focus**: Automated bioacoustic event detection (AED) and soundscape indices.

### Metrics Computed:
- **Bioacoustic Index (BI)**: Evaluates avian abundance and biodiversity based on the area under the soundscape curve between 2 kHz and 8 kHz.
- **Acoustic Complexity Index (ACI)**: Measures variations in bird vocalizations while discarding constant anthropogenic background noise (generators, rain).
- **Ultrasonic Echolocation Detection**: Supports 192 kHz sample rates for bat call detection (Chiroptera 20 kHz–100 kHz).

---

## 4. PyTorch Wildlife

**Repository**: [microsoft/CameraTraps](https://github.com/microsoft/CameraTraps)  
**Focus**: Multi-stage edge pipeline:
1. Stage 1: MegaDetector bounding box extraction.
2. Stage 2: Taxa classifier (species level identification).
3. Stage 3: Darwin Core standard JSON packaging for direct submission to GBIF (Global Biodiversity Information Facility).

```bash
docker run --runtime nvidia --gpus all \
  -v /mnt/sdcard/captures:/data \
  ghcr.io/microsoft/cameratraps:latest \
  --input /data --output /data/results.json --format darwin-core
```
