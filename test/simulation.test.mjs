import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceSimulator } from '../src/services/simulationEngine.ts';
import { DEVICE_SPECS } from '../src/data/deviceSpecs.ts';

const testConfig = {
  repoUrl: 'https://github.com/ultralytics/ultralytics',
  branch: 'main',
  dockerfileContent: 'FROM ubuntu:22.04',
  dockerComposeContent: 'version: "3.8"',
  entrypointScript: '#!/bin/bash\nexit 0',
  targetImage: 'edge-test:latest',
  runtimeFlags: {
    nvidiaRuntime: true,
    privileged: false,
    shmSize: '2gb',
    deviceCamera: true,
    networkHost: false,
    customArgs: '',
  },
  envVars: {},
  workload: {
    type: 'vision',
    modelName: 'YOLOv8s',
    precision: 'INT8',
    batchSize: 1,
    streamInput: 'camera',
  },
};

test('DeviceSimulator normal mode remains healthy without throttling', () => {
  const devices = ['orin-nano', 'pi-5', 'thor-nano'];

  for (const id of devices) {
    const sim = new DeviceSimulator(id, testConfig);
    const spec = DEVICE_SPECS[id];

    for (let i = 0; i < 50; i++) {
      const { telemetry } = sim.tickTelemetry();
      assert.equal(telemetry.isThrottling, false, `${id} should not throttle in normal mode`);
      assert.ok(telemetry.temperatureC < spec.thermals.throttleTempC, `${id} temp should remain below throttle threshold`);
      assert.ok(telemetry.fps > 0, `${id} FPS should be positive`);
    }
  }
});

test('DeviceSimulator triggers thermal throttling in stress mode within 200 ticks', () => {
  const devices = ['orin-nano', 'pi-5', 'thor-nano'];

  for (const id of devices) {
    const sim = new DeviceSimulator(id, testConfig);
    const spec = DEVICE_SPECS[id];

    // Engage synthetic hardware stress
    sim.setStressMode(true);
    let throttledAtTick = -1;
    let maxTempSeen = 0;
    let alertEmitted = false;

    for (let tick = 1; tick <= 200; tick++) {
      const { telemetry, log } = sim.tickTelemetry();
      if (telemetry.temperatureC > maxTempSeen) {
        maxTempSeen = telemetry.temperatureC;
      }

      if (log && log.message && log.message.includes('THROTTLE ALERT')) {
        alertEmitted = true;
      }

      if (telemetry.isThrottling && throttledAtTick === -1) {
        throttledAtTick = tick;
      }
    }

    assert.ok(
      throttledAtTick > 0 && throttledAtTick <= 200,
      `${id} must trigger throttling within 200 ticks under stress (throttled at tick ${throttledAtTick}, max temp: ${maxTempSeen}°C, threshold: ${spec.thermals.throttleTempC}°C)`
    );

    assert.ok(
      maxTempSeen >= spec.thermals.throttleTempC,
      `${id} max temperature (${maxTempSeen}°C) should reach or exceed throttle limit (${spec.thermals.throttleTempC}°C)`
    );

    assert.ok(alertEmitted, `${id} should emit THROTTLE ALERT log line`);
  }
});

test('DeviceSimulator recovers from throttling when stress mode is disabled', () => {
  const sim = new DeviceSimulator('orin-nano', testConfig);
  const spec = DEVICE_SPECS['orin-nano'];

  // Stress until throttled
  sim.setStressMode(true);
  let isThrottled = false;
  for (let i = 0; i < 60; i++) {
    const { telemetry } = sim.tickTelemetry();
    if (telemetry.isThrottling) {
      isThrottled = true;
      break;
    }
  }
  assert.ok(isThrottled, 'Should have entered throttling state');

  // Turn off stress and cool down
  sim.setStressMode(false);
  let recovered = false;
  for (let i = 0; i < 150; i++) {
    const { telemetry } = sim.tickTelemetry();
    if (!telemetry.isThrottling && telemetry.temperatureC < spec.thermals.throttleTempC - 2) {
      recovered = true;
      break;
    }
  }

  assert.ok(recovered, 'Should recover and clear throttling when stress is removed');
});
