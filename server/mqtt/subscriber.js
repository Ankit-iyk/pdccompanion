// MQTT subscriber — pluggable when ESP32 hardware is available
// Disabled when MQTT_BROKER_URL is not set in .env
import mqtt from 'mqtt';
import { config } from '../config/env.js';
import { processTelemetry } from '../services/mockSimulator.js';

export function initMQTT(io) {
  if (!config.mqtt.brokerUrl) {
    console.log('[MQTT] No broker URL set — MQTT disabled. Simulator is active.');
    return;
  }

  const client = mqtt.connect(config.mqtt.brokerUrl, {
    username: config.mqtt.username,
    password: config.mqtt.password,
    reconnectPeriod: 5000,
    connectTimeout: 10_000,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Connected to broker: ${config.mqtt.brokerUrl}`);
    client.subscribe(config.mqtt.topic, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err);
      else console.log(`[MQTT] Subscribed to: ${config.mqtt.topic}`);
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      // Guard: malformed payloads must not crash the server
      const raw = payload.toString();
      if (!raw || raw.length > 4096) {
        console.warn('[MQTT] Payload rejected: empty or too large');
        return;
      }
      const data = JSON.parse(raw);

      // Validate required fields before processing
      if (!data.patientId) {
        console.warn('[MQTT] Payload missing patientId — discarded');
        return;
      }

      const telemetry = {
        patient_id:    data.patientId,
        heart_rate:    Number(data.heartRate) || 0,
        tremor_score:  Number(data.tremorScore) || 0,
        temperature:   Number(data.temperature) || 0,
        fall_detected: Boolean(data.fallDetected ?? false),
        latitude:      data.latitude ?? null,
        longitude:     data.longitude ?? null,
        created_at:    new Date().toISOString(),
        source:        'mqtt',
        battery_level: data.batteryLevel ?? null,
      };

      // Use the same unified pipeline as the simulator
      await processTelemetry(telemetry, io);

    } catch (err) {
      // Never let a bad MQTT message crash the server
      console.error('[MQTT] Message parse error (discarded):', err.message);
    }
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting…'));
  client.on('offline', () => console.warn('[MQTT] Client offline'));
}
