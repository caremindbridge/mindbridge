export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      lite: process.env.STRIPE_PRICE_LITE,
      standard: process.env.STRIPE_PRICE_STANDARD,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      therapist_solo: process.env.STRIPE_PRICE_THERAPIST_SOLO,
      therapist_practice: process.env.STRIPE_PRICE_THERAPIST_PRACTICE,
      pack_50: process.env.STRIPE_PRICE_PACK_50,
      pack_150: process.env.STRIPE_PRICE_PACK_150,
      pack_400: process.env.STRIPE_PRICE_PACK_400,
    },
  },
});
