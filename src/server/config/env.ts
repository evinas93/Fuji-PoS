// Environment variable validation and configuration
import { z } from 'zod';

const envSchema = z.object({
  // Node.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe (optional for basic functionality)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32).optional(),

  // Optional services
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Feature flags
  ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_DEBUG_LOGGING: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Restaurant configuration
  RESTAURANT_NAME: z.string().default('Fuji Restaurant'),
  TAX_RATE: z.string().transform(Number).default('0.08'),
  GRATUITY_RATE: z.string().transform(Number).default('0.20'),
  CREDIT_CARD_SERVICE_CHARGE: z.string().transform(Number).default('0.035'),
  SPLIT_PLATE_CHARGE: z.string().transform(Number).default('2.00'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export const validateEnv = (): Env => {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error('❌ Environment validation failed:');
      console.error(missingVars);
      console.error('\nContinuing with defaults for missing variables...');

      // Try to parse with defaults for missing required fields
      try {
        cachedEnv = envSchema.parse({
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key',
        });
        return cachedEnv;
      } catch (fallbackError) {
        console.error('❌ Fallback environment parsing also failed');
        process.exit(1);
      }
    }
    throw error;
  }
};

// Get validated environment (singleton)
export const getEnv = (): Env => {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
};
