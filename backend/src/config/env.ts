import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  TZ: z.string().default('America/Sao_Paulo'),
  JWT_SECRET: z.string().min(16).default('selpe-secret-key-dev-super-secure-change-in-prod'),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().default('selpe-peruibe-dev.appspot.com'),
  FIREBASE_PROJECT_ID: z.string().default('selpe-peruibe-dev'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
