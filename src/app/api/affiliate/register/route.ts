import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate unique affiliate code
function generateAffiliateCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePrefix = cleanName.substring(0, 4);
  const numbers = Math.floor(Math.random() * 9000) + 1000;
  return `${namePrefix}${numbers}`;
}

// Affiliate welcome email template
function getAffiliateWelcomeEmail(affiliate: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #9333ea, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .code-box { background: #f3f4f6; border: 2px solid #9333ea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SnapWorxx Affiliates! 🎉</h1>
            <p>Start earning 20% commission on every referral</p>
          </div>
          <div class="content">
            <h2>Hi ${affiliate.name}!</h2>
            <p>Congratulations! You're now part of the SnapWorxx affiliate program.</p>

            <div class="code-box">
              <h3>Your Affiliate Code</h3>
              <div style="font-size: 24px; font-weight: bold; color: #9333ea;">${affiliate.referral_code}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280;">Share this code to earn 20% commission</p>
            </div>

            <h3>🚀 How It Works</h3>
            <ol>
              <li>Share your referral link: <strong>snapworxx.com/create?ref=${affiliate.referral_code}</strong></li>
              <li>When someone creates an event using your link, they get 10% off</li>
              <li>You earn 20% commission on their purchase</li>
              <li>Get paid monthly via PayPal or direct deposit</li>
            </ol>

            <h3>📊 Track Your Earnings</h3>
            <p>Access your affiliate dashboard anytime:</p>
            <a href="https://snapworxx.com/affiliate/dashboard" class="button">View Dashboard</a>

            <h3>🎯 Marketing Materials</h3>
            <ul>
              <li>Custom referral links</li>
              <li>Branded social media graphics</li>
              <li>Email templates</li>
              <li>Performance analytics</li>
            </ul>

            <p>Questions? Reply to this email or contact our affiliate support team.</p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4>💰 Earning Potential</h4>
              <p>Our top affiliates earn $500-2000+ per month by sharing SnapWorxx with their networks!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if affiliate already exists
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'An affiliate account already exists for this email' },
        { status: 409 }
      );
    }

    // Generate unique referral code
    let referralCode = generateAffiliateCode(name);
    let attempts = 0;

    // Ensure code is unique
    while (attempts < 10) {
      const { data: existingCode } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();

      if (!existingCode) break;
      
      referralCode = generateAffiliateCode(name);
      attempts++;
    }

    // Create affiliate record
    const { data: affiliate, error: createError } = await supabase
      .from('affiliates')
      .insert([{
        user_id: email.toLowerCase(),
        name: name.trim(),
        email: email.toLowerCase(),
        referral_code: referralCode,
        commission_rate: 20.00,
        status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating affiliate:', createError);
      return NextResponse.json(
        { error: 'Failed to create affiliate account' },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: 'SnapWorxx Affiliates <affiliates@snapworxx.com>',
        to: email,
        subject: `🎉 Welcome to SnapWorxx Affiliates - Your code: ${referralCode}`,
        html: getAffiliateWelcomeEmail(affiliate),
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        referral_code: affiliate.referral_code,
        commission_rate: affiliate.commission_rate
      }
    });

  } catch (error) {
    console.error('Affiliate registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}