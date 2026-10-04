import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Dockerfile structure and security compliance', () => {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist at repository root');

  const content = fs.readFileSync(dockerfilePath, 'utf-8');

  // Verify multi-stage build pattern
  assert.match(content, /AS builder/i, 'Dockerfile should have builder stage');
  assert.match(content, /AS runner/i, 'Dockerfile should have runner stage');

  // Verify security: unprivileged user
  assert.match(content, /USER node/i, 'Dockerfile must run as unprivileged node user');

  // Verify port 3000 exposure
  assert.match(content, /EXPOSE 3000/i, 'Dockerfile must expose port 3000');

  // Verify health check
  assert.match(content, /HEALTHCHECK/i, 'Dockerfile must declare a HEALTHCHECK');
  assert.match(content, /\/api\/health/i, 'Healthcheck must verify /api/health');
});

test('docker-compose.yml configuration', () => {
  const composePath = path.join(process.cwd(), 'docker-compose.yml');
  assert.ok(fs.existsSync(composePath), 'docker-compose.yml must exist at repository root');

  const content = fs.readFileSync(composePath, 'utf-8');

  // Verify service and port binding
  assert.match(content, /3000:3000/, 'docker-compose must forward port 3000');
  assert.match(content, /ghcr\.io/, 'docker-compose should reference GitHub Container Registry image');
  assert.match(content, /healthcheck:/, 'docker-compose should declare healthcheck');
});

test('.dockerignore includes essential build exclusions', () => {
  const dockerignorePath = path.join(process.cwd(), '.dockerignore');
  assert.ok(fs.existsSync(dockerignorePath), '.dockerignore must exist at repository root');

  const content = fs.readFileSync(dockerignorePath, 'utf-8');
  assert.match(content, /node_modules/, '.dockerignore must exclude node_modules');
  assert.match(content, /dist/, '.dockerignore must exclude dist');
  assert.match(content, /\.git/, '.dockerignore must exclude .git');
});

test('GitHub Actions Docker CI workflow configuration', () => {
  const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'docker.yml');
  assert.ok(fs.existsSync(workflowPath), '.github/workflows/docker.yml must exist');

  const content = fs.readFileSync(workflowPath, 'utf-8');

  // Verify GHCR target
  assert.match(content, /ghcr\.io/, 'Workflow must publish to GitHub Container Registry');

  // Verify Multi-Architecture support
  assert.match(content, /linux\/amd64,linux\/arm64/, 'Workflow must build both AMD64 and ARM64');

  // Verify Buildx and QEMU setup
  assert.match(content, /setup-qemu-action/, 'Workflow must use setup-qemu-action for cross-compilation');
  assert.match(content, /setup-buildx-action/, 'Workflow must use setup-buildx-action');
});
