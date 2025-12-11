/**
 * Database connection pool wrapper for Next.js
 * Uses the pg Pool from config/database.js
 * 
 * Note: This file is currently not used in the codebase.
 * If you need direct PostgreSQL access, install 'pg' and '@types/pg' packages.
 */

// import { Pool } from 'pg';
import ErrorLogger from './errorLogger';

// Create pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  max: 20, // Maximum pool size
  min: 5, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500, // Close connections after this many queries
};

// Create pool instance
// export const pool = new Pool(poolConfig);

// Connection error handling
// pool.on('error', async (err, client) => {
//   console.error('Unexpected error on idle client', err);
//   // Log to error_logs table
//   await ErrorLogger.logDatabaseError(err);
// });

/**
 * Health check function
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  timestamp: Date;
  error?: string;
}> {
  // const client = await pool.connect();
  // try {
  //   await client.query('SELECT NOW()');
  //   return { healthy: true, timestamp: new Date() };
  // } catch (err: any) {
  //   return {
  //     healthy: false,
  //     error: err.message,
  //     timestamp: new Date(),
  //   };
  // } finally {
  //   client.release();
  // }
  return { healthy: false, timestamp: new Date(), error: 'Database pool not configured' };
}

/**
 * Log database error
 */
export async function logDatabaseError(err: Error): Promise<void> {
  await ErrorLogger.logDatabaseError(err);
}



