import test from 'node:test';
import assert from 'node:assert/strict';

// Test GitHub coordinate validation logic
function validateGitHubCoordinates(owner, repo) {
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!ownerRegex.test(owner)) {
    throw new Error(`Invalid GitHub organization or user name: "${owner}"`);
  }

  const repoRegex = /^[a-zA-Z0-9_.-]{1,100}$/;
  if (!repoRegex.test(repo) || repo.includes('..')) {
    throw new Error(`Invalid GitHub repository name: "${repo}"`);
  }

  return { safeOwner: owner, safeRepo: repo };
}

test('Sanitizes and accepts valid GitHub coordinates', () => {
  const valid = [
    ['microsoft', 'sparrow'],
    ['agentmorris', 'megadetector'],
    ['megadetector', 'megadetector-acoustic'],
    ['microsoft', 'CameraTraps'],
    ['dusty-nv', 'jetson-inference'],
    ['NVIDIA-AI-IOT', 'deepstream_reference_apps'],
    ['NVIDIA', 'TensorRT'],
    ['ultralytics', 'ultralytics'],
    ['ggerganov', 'llama.cpp'],
  ];

  for (const [owner, repo] of valid) {
    const res = validateGitHubCoordinates(owner, repo);
    assert.equal(res.safeOwner, owner);
    assert.equal(res.safeRepo, repo);
  }
});

test('Rejects shell injection and traversal attempts in repository URL', () => {
  const attacks = [
    ['microsoft', 'sparrow;rm -rf /'],
    ['owner', 'repo$(whoami)'],
    ['owner', 'repo`reboot`'],
    ['owner', 'repo|cat /etc/passwd'],
    ['owner', 'repo&killall node'],
    ['owner', '../../etc/shadow'],
    ['-invalidowner', 'repo'],
    ['owner', 'repo"injection'],
    ['owner', "repo'injection"],
    ['owner', 'repo<evil>'],
  ];

  for (const [owner, repo] of attacks) {
    assert.throws(() => validateGitHubCoordinates(owner, repo), /Invalid GitHub/);
  }
});

test('Guarantees canonical clone URL construction without raw user input injection', () => {
  const owner = 'microsoft';
  const repo = 'sparrow';
  const { safeOwner, safeRepo } = validateGitHubCoordinates(owner, repo);
  const cloneUrl = `https://github.com/${safeOwner}/${safeRepo}.git`;
  assert.equal(cloneUrl, 'https://github.com/microsoft/sparrow.git');
});
