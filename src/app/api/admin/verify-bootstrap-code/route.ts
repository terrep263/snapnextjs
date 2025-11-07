export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code required' }), { status: 400 });
    }

    // Get bootstrap code from env
    const bootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE;

    if (!bootstrapCode) {
      console.error('ADMIN_BOOTSTRAP_CODE not configured in environment');
      console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('ADMIN') || k.includes('BOOTSTRAP')));
      return new Response(
        JSON.stringify({ 
          error: 'Bootstrap not configured',
          debug: 'ADMIN_BOOTSTRAP_CODE environment variable is not set'
        }), 
        { status: 500 }
      );
    }

    // Verify code (trim whitespace)
    const trimmedCode = code.trim();
    const trimmedBootstrapCode = bootstrapCode.trim();

    if (trimmedCode !== trimmedBootstrapCode) {
      return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 401 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Bootstrap verify error:', err);
    return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
  }
}
