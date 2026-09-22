import { DockerConfig } from '../types';
import { GITHUB_PRESETS } from '../data/presets';

export interface GitHubRepoInfo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  hasDockerfile: boolean;
  detectedType: DockerConfig['workload']['type'];
}

/**
 * Strict validator for GitHub usernames / organizations and repository names.
 * Prevents shell injection, directory traversal, and malformed inputs.
 */
function validateGitHubCoordinates(owner: string, repo: string): { safeOwner: string; safeRepo: string } {
  // GitHub username rule: Alphanumeric and single hyphens, 1-39 chars, cannot begin or end with hyphen
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!ownerRegex.test(owner)) {
    throw new Error(`Invalid GitHub organization or user name: "${owner}". Only alphanumeric characters and single hyphens are permitted.`);
  }

  // GitHub repository rule: Alphanumeric, underscores, hyphens, and periods, 1-100 chars
  // Explicitly disallow '..' or path traversal fragments
  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;
  if (!repoRegex.test(repo) || repo.includes('..')) {
    throw new Error(`Invalid GitHub repository name: "${repo}". Only letters, numbers, hyphens, periods, and underscores are permitted.`);
  }

  return { safeOwner: owner, safeRepo: repo };
}

export async function fetchGitHubRepoDetails(url: string): Promise<{
  repoInfo: GitHubRepoInfo;
  dockerfile: string;
  dockerCompose: string;
  suggestedConfig: Partial<DockerConfig>;
}> {
  // Normalize GitHub URL
  const trimmed = url.trim().replace(/\/+$/, '');
  const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git|\/)?$/i);

  if (!match) {
    throw new Error('Please enter a valid GitHub repository URL (e.g. https://github.com/ultralytics/ultralytics)');
  }

  const rawOwner = match[1];
  const rawRepo = match[2].replace(/\.git$/, '');

  // Perform strict sanitization and validation to prevent shell injection risks
  const { safeOwner, safeRepo } = validateGitHubCoordinates(rawOwner, rawRepo);
  const canonicalUrl = `https://github.com/${safeOwner}/${safeRepo}`;
  const canonicalCloneUrl = `https://github.com/${safeOwner}/${safeRepo}.git`;
  const repoKey = `${safeOwner}/${safeRepo}`.toLowerCase();
  const safeServiceName = safeRepo.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '') || 'edge-service';

  // Check if we have an instant curated preset for this repo
  const matchedPreset = GITHUB_PRESETS.find(p => p.repoUrl.toLowerCase().includes(repoKey));
  if (matchedPreset) {
    return {
      repoInfo: {
        name: safeRepo,
        fullName: `${safeOwner}/${safeRepo}`,
        description: matchedPreset.description,
        stars: parseInt(matchedPreset.stars.replace(/[^0-9]/g, ''), 10) * (matchedPreset.stars.includes('k') ? 1000 : 1) || 5000,
        forks: 1200,
        defaultBranch: matchedPreset.branch,
        hasDockerfile: true,
        detectedType: matchedPreset.workloadType,
      },
      dockerfile: matchedPreset.dockerfile,
      dockerCompose: matchedPreset.dockerCompose,
      suggestedConfig: {
        repoUrl: canonicalUrl,
        branch: matchedPreset.branch,
        workload: {
          type: matchedPreset.workloadType,
          modelName: matchedPreset.modelName,
          precision: matchedPreset.recommendedPrecision,
          batchSize: 1,
          streamInput: 'camera',
        },
        envVars: matchedPreset.envVars,
      },
    };
  }

  // Attempt live GitHub API metadata lookup for real stars, description & default branch
  let apiDescription = `Edge-ready containerization for ${safeOwner}/${safeRepo} repository.`;
  let apiStars = 150;
  let apiForks = 45;
  let defaultBranch = 'main';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const apiRes = await fetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const meta = await apiRes.json();
      if (meta.description) apiDescription = meta.description;
      if (typeof meta.stargazers_count === 'number') apiStars = meta.stargazers_count;
      if (typeof meta.forks_count === 'number') apiForks = meta.forks_count;
      if (meta.default_branch) defaultBranch = meta.default_branch;
    }
  } catch {
    // Graceful fallback on network/rate-limit error
  }

  // Search across common branches and subdirectories for an existing Dockerfile
  let remoteDockerfile = '';
  const branchesToTry = [defaultBranch, 'main', 'master', 'dev', 'develop'].filter((b, idx, arr) => arr.indexOf(b) === idx);
  const pathsToTry = [
    'Dockerfile',
    'docker/Dockerfile',
    '.docker/Dockerfile',
    'Dockerfile.arm64',
    'docker/Dockerfile.arm64',
    'deploy/Dockerfile',
  ];

  fileSearchLoop:
  for (const branch of branchesToTry) {
    for (const filePath of pathsToTry) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const dockerfileRes = await fetch(
          `https://raw.githubusercontent.com/${safeOwner}/${safeRepo}/${branch}/${filePath}`,
          {
            headers: { 'Accept': 'text/plain' },
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (dockerfileRes.ok) {
          remoteDockerfile = await dockerfileRes.text();
          break fileSearchLoop;
        }
      } catch {
        // Continue searching
      }
    }
  }

  // Determine workload heuristic
  let detectedType: DockerConfig['workload']['type'] = 'vision';
  let modelName = `${safeRepo}-edge-model`;
  const lowerRepo = safeRepo.toLowerCase();

  if (lowerRepo.includes('llama') || lowerRepo.includes('llm') || lowerRepo.includes('gpt') || lowerRepo.includes('vllm') || lowerRepo.includes('transformer')) {
    detectedType = 'llm';
    modelName = '4-bit Quantized LLM (ARM64)';
  } else if (lowerRepo.includes('wildlife') || lowerRepo.includes('sparrow') || lowerRepo.includes('megadetector') || lowerRepo.includes('cameratrap')) {
    detectedType = 'wildlife';
    modelName = 'Edge Wildlife Detector & Taxa Classifier';
  } else if (lowerRepo.includes('acoustic') || lowerRepo.includes('bioacoustic') || lowerRepo.includes('soundscape') || lowerRepo.includes('audiomoth')) {
    detectedType = 'bioacoustic';
    modelName = 'Bioacoustic Event Detection (AED)';
  } else if (lowerRepo.includes('whisper') || lowerRepo.includes('audio') || lowerRepo.includes('speech') || lowerRepo.includes('tts')) {
    detectedType = 'audio';
    modelName = 'Whisper Speech Encoder';
  } else if (lowerRepo.includes('ros') || lowerRepo.includes('robot') || lowerRepo.includes('nav') || lowerRepo.includes('slam')) {
    detectedType = 'robotics';
    modelName = 'ROS2 Navigation & Perception';
  } else if (lowerRepo.includes('bench') || lowerRepo.includes('gemm') || lowerRepo.includes('stress')) {
    detectedType = 'compute-benchmark';
    modelName = 'Dense Matrix & Tensor Stress';
  }

  // If no remote Dockerfile was found, synthesize a secure, multi-arch edge Dockerfile
  // Using strictly sanitized URLs and avoiding shell injection
  const generatedDockerfile = remoteDockerfile || `# Optimized Multi-Arch Edge Dockerfile
# Repository: ${safeOwner}/${safeRepo}
FROM nvcr.io/nvidia/l4t-pytorch:r36.2.0-pth2.1-py3

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    git curl build-essential libgl1-mesa-glx libglib2.0-0 \\
    && rm -rf /var/lib/apt/lists/*

# Clone repository via validated canonical URL
RUN git clone --depth 1 ${canonicalCloneUrl} .

# Install dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh || true

EXPOSE 8080
ENTRYPOINT ["python3", "main.py"]`;

  const generatedCompose = `version: '3.8'
services:
  ${safeServiceName}:
    build: .
    image: ${safeServiceName}:latest
    runtime: nvidia
    restart: unless-stopped
    devices:
      - /dev/video0:/dev/video0
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - PORT=8080
    ports:
      - "8080:8080"`;

  return {
    repoInfo: {
      name: safeRepo,
      fullName: `${safeOwner}/${safeRepo}`,
      description: apiDescription,
      stars: apiStars,
      forks: apiForks,
      defaultBranch,
      hasDockerfile: Boolean(remoteDockerfile),
      detectedType,
    },
    dockerfile: generatedDockerfile,
    dockerCompose: generatedCompose,
    suggestedConfig: {
      repoUrl: canonicalUrl,
      branch: defaultBranch,
      workload: {
        type: detectedType,
        modelName,
        precision: 'FP16',
        batchSize: 1,
        streamInput: 'camera',
      },
      envVars: {
        EDGE_DEVICE: 'auto-detect',
        CUDA_VISIBLE_DEVICES: '0',
      },
    },
  };
}
