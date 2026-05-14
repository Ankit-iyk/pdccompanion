// Centralized env validation — fail fast on missing required vars
import 'dotenv/config';

const required = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[Config] Warning: env var ${key} is not set`);
  }
}

export const config = {
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  simulator: {
    enabled: process.env.ENABLE_SIMULATOR !== 'false',
    intervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS) || 2000,
  },
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || null,
    username: process.env.MQTT_USERNAME || null,
    password: process.env.MQTT_PASSWORD || null,
    topic: process.env.MQTT_TOPIC || 'pdcompanion/telemetry',
  },
};
