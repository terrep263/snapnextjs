import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a random discount code
function generateDiscountCode(): string {
  const prefixes = ['SNAP', 'WORXX', 'EVENT', 'MEMORY'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const numbers = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  return `${prefix}${numbers}`;
}

// Email template for discount code
function getDiscountEmailTemplate(discountCode: string, percentOff: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SnapWorxx Discount Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 Your Discount Code is Here!</h1>
      <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Start planning your SnapWorxx event with savings</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Ready to Create Unforgettable Memories?</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
        Thanks for your interest in SnapWorxx! We're excited to help you capture and share the moments that matter most. 
        Your exclusive discount code is ready to use.
      </p>

      <!-- Discount Code Box -->
      <div style="background: linear-gradient(135deg, #f3e8ff 0%, #fdf2f8 100%); border: 2px dashed #9333ea; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <p style="color: #6b21a8; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">YOUR DISCOUNT CODE</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <span style="font-size: 32px; font-weight: bold; color: #9333ea; letter-spacing: 3px;">${discountCode}</span>
        </div>
        <p style="color: #9333ea; margin: 0; font-size: 18px; font-weight: bold;">Save ${percentOff}% on your first event!</p>
      </div>

      <!-- How to Use -->
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">How to Use Your Code:</h3>
        <ol style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Visit <a href="https://snapworxx.com/create" style="color: #9333ea; text-decoration: none;">snapworxx.com/create</a></li>
          <li>Fill out your event details</li>
          <li>Enter your discount code at checkout</li>
          <li>Enjoy the savings and start collecting memories!</li>
        </ol>
      </div>

      <!-- Features -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-bottom: 20px; font-size: 18px;">What Makes SnapWorxx Special?</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1; min-width: 250px; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 10px;">📱</div>
            <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 16px;">Mobile Optimized</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Perfect for smartphone videos and photos</p>
          </div>
          <div style="flex: 1; min-width: 250px; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
            <div style="font-size: 24px; margin-bottom: 10px;">⚡</div>
            <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 16px;">Lightning Fast</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Quick uploads with smart compression</p>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="https://snapworxx.com/create" 
           style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Create Your Event Now →
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; text-align: center;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          Questions? Reply to this email or visit our website for support.
        </p>
        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
          This discount code expires in 30 days. Terms and conditions apply.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f2937; color: white; padding: 25px 20px; text-align: center;">
      <div style="margin-bottom: 15px;">
        <strong style="font-size: 18px;">SnapWorxx</strong>
      </div>
      <p style="color: #9ca3af; margin: 0; font-size: 14px;">
        Never miss the moments that matter
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // For now, use a simplified approach until database tables are set up
    // In production, this would check against the discount_requests table
    console.log(`Discount request from: ${email}`);
    
    // Use hardcoded discount offer for now
    const discountOffer = {
      percent_off: 30,
      description: 'Welcome Discount - 30% off your first event'
    };

    // Generate a unique discount code for this user
    let discountCode = generateDiscountCode();
    let codeExists = false;
    let attempts = 0;

    // For now, just generate a unique code without database checking
    // In production, this would check against the discount_requests table
    while (attempts < 5) {
      // For email-generated codes, use WELCOME prefix
      discountCode = 'WELCOME' + Math.floor(Math.random() * 9000 + 1000);
      attempts++;
      break; // For now, assume it's unique
    }

    // Log the request (for now just console log, later save to database)
    console.log(`Generated discount code ${discountCode} for ${email}`);

    // Send email with discount code
    try {
      const emailContent = getDiscountEmailTemplate(discountCode, discountOffer.percent_off);

      await resend.emails.send({
        from: 'SnapWorxx <noreply@snapworxx.com>',
        to: [email],
        subject: `🎉 Your ${discountOffer.percent_off}% SnapWorxx Discount Code: ${discountCode}`,
        html: emailContent,
      });

      return NextResponse.json({
        success: true,
        message: 'Discount code sent successfully! Check your email.',
        discountCode: discountCode, // Include for immediate display if needed
        percentOff: discountOffer.percent_off
      });

    } catch (emailError) {
      console.error('Error sending discount email:', emailError);
      
      // Even if email fails, we've logged the request, so let user know
      return NextResponse.json(
        { error: 'Your discount code was generated but there was an issue sending the email. Please contact support with this code: ' + discountCode },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in discount-offer route:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}