// MQTT subscriber — pluggable when ESP32 hardware is available
// Disabled when MQTT_BROKER_URL is not set in .env
import mqtt from 'mqtt';
import { config } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { checkTelemetryAlerts } from '../services/alertService.js';

export function initMQTT(io) {
  if (!config.mqtt.brokerUrl) {
    console.log('[MQTT] No broker URL set — MQTT disabled. Simulator is active.');
    return;
  }

  const client = mqtt.connect(config.mqtt.brokerUrl, {
    username: config.mqtt.username,
    password: config.mqtt.password,
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
      const data = JSON.parse(payload.toString());
      const telemetry = {
        patient_id:   data.patientId,
        heart_rate:   data.heartRate,
        tremor_score: data.tremorScore,
        temperature:  data.temperature,
        fall_detected:data.fallDetected ?? false,
        latitude:     data.latitude ?? null,
        longitude:    data.longitude ?? null,
        created_at:   new Date().toISOString(),
      };

      // Save to DB
      if (supabase) {
        await supabase.from('pd_telemetry').insert(telemetry);
      }

      // Broadcast via Socket.IO
      io.to(`patient:${telemetry.patient_id}`).emit('telemetry', telemetry);
      io.to('monitoring').emit('telemetry', telemetry);

      // Threshold alerts
      await checkTelemetryAlerts(telemetry, io);
    } catch (err) {
      console.error('[MQTT] Message parse error:', err.message);
    }
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
}
