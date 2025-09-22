/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Stripe
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;

    // Application
    NEXT_PUBLIC_APP_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;

    // Database
    DATABASE_URL?: string;

    // Session
    SESSION_SECRET: string;

    // Email (optional)
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;

    // SMS (optional)
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;

    // Monitoring (optional)
    NEXT_PUBLIC_SENTRY_DSN?: string;
    SENTRY_AUTH_TOKEN?: string;

    // Feature Flags
    ENABLE_ANALYTICS?: string;
    ENABLE_DEBUG_LOGGING?: string;

    // Restaurant Configuration
    RESTAURANT_NAME?: string;
    TAX_RATE?: string;
    GRATUITY_RATE?: string;
    CREDIT_CARD_SERVICE_CHARGE?: string;
    SPLIT_PLATE_CHARGE?: string;
  }
}

