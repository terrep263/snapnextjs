import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

/**
 * Health check endpoint
 * Returns status of database and Stripe connections
 */
export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();

    // Check Stripe configuration
    const stripeHealth = checkStripeConnection();

    const overall = dbHealth.healthy && stripeHealth.healthy;

    return NextResponse.json(
      {
        status: overall ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
          stripe: stripeHealth,
        },
      },
      { status: overall ? 200 : 503 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: { healthy: false, error: 'Health check failed' },
          stripe: { healthy: false, error: 'Health check failed' },
        },
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connection health
 */
async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  timestamp: string;
  error?: string;
}> {
  try {
    const supabase = getServiceRoleClient();

    // Simple query to test connection
    const { error } = await supabase.from('events').select('id').limit(1);

    if (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }

    return {
      healthy: true,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: err.message || 'Database connection failed',
    };
  }
}

/**
 * Check Stripe configuration
 */
function checkStripeConnection(): {
  healthy: boolean;
  configured: boolean;
  error?: string;
} {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  const configured = hasSecretKey && hasWebhookSecret;

  if (!configured) {
    return {
      healthy: false,
      configured: false,
      error: hasSecretKey
        ? 'STRIPE_WEBHOOK_SECRET not configured'
        : 'STRIPE_SECRET_KEY not configured',
    };
  }

  // Check if keys are not placeholder values
  const isPlaceholder =
    process.env.STRIPE_SECRET_KEY?.includes('your-stripe-secret-key') ||
    process.env.STRIPE_WEBHOOK_SECRET?.includes('your-webhook-secret');

  if (isPlaceholder) {
    return {
      healthy: false,
      configured: false,
      error: 'Stripe keys appear to be placeholder values',
    };
  }

  return {
    healthy: true,
    configured: true,
  };
}



