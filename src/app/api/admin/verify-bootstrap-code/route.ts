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
      return new Response(JSON.stringify({ error: 'Bootstrap not configured' }), { status: 500 });
    }

    // Verify code
    if (code !== bootstrapCode) {
      return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 401 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Bootstrap verify error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
