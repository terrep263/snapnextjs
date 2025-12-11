const { Pool } = require('pg');

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    maxUses: 7500, // Close connections after this many queries
};

const pool = new Pool(poolConfig);

// Error logging function
async function logDatabaseError(err) {
    try {
        // Only log if error_logs table exists and we have a connection
        const client = await pool.connect();
        try {
            await client.query(
                `INSERT INTO error_logs (error_message, stack_trace, error_type, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [
                    err.message || 'Unknown error',
                    err.stack || null,
                    'database_pool_error'
                ]
            );
        } catch (logError) {
            // If error_logs table doesn't exist or logging fails, just console.error
            console.error('Failed to log database error to error_logs table:', logError.message);
            console.error('Original database error:', err);
        } finally {
            client.release();
        }
    } catch (connectError) {
        // If we can't even connect, just console.error
        console.error('Failed to connect for error logging:', connectError.message);
        console.error('Original database error:', err);
    }
}

// Connection error handling
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Log to error_logs table
    logDatabaseError(err);
});

// Health check function
async function checkDatabaseHealth() {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        return { healthy: true, timestamp: new Date() };
    } catch (err) {
        return { healthy: false, error: err.message, timestamp: new Date() };
    } finally {
        client.release();
    }
}

module.exports = { pool, checkDatabaseHealth, logDatabaseError };

