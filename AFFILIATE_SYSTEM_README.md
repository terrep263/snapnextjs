# SnapWorxx Affiliate System

A complete affiliate marketing system built for SnapWorxx event photo sharing platform.

## 🚀 Features

### For Affiliates
- **Easy Registration**: Simple signup process with auto-generated referral codes
- **Real-time Tracking**: Monitor earnings, referrals, and performance metrics
- **Automatic Commissions**: 60% commission on every successful referral
- **90-Day Program**: Limited-time affiliate programs with expiration tracking
- **Customer Benefits**: Referrals get 10% off their first event
- **Professional Dashboard**: View earnings, referral history, expiration date, and analytics
- **Marketing Tools**: Ready-to-use referral links and tracking

### For Business
- **Automated Tracking**: All referrals and commissions tracked automatically
- **Database Integration**: Full Supabase integration with RLS policies
- **Stripe Integration**: Automatic commission calculation on successful payments
- **Email Notifications**: Welcome emails and affiliate onboarding
- **Performance Analytics**: Track affiliate performance and conversion rates

## 📋 Setup Instructions

### 1. Database Setup
Run the SQL commands in `affiliate_system_schema.sql` in your Supabase SQL Editor:
```bash
# This creates:
# - affiliates table (affiliate user data)
# - affiliate_referrals table (referral tracking)
# - affiliate_payouts table (payout history)
# - RLS policies for security
# - Triggers for automatic earnings calculation
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```bash
RESEND_API_KEY=your_resend_api_key  # For affiliate welcome emails
STRIPE_SECRET_KEY=your_stripe_key   # For payment processing
STRIPE_WEBHOOK_SECRET=your_webhook_secret  # For webhook verification
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For referral links
```

### 3. Email Configuration
The system uses Resend for affiliate welcome emails. Make sure your Resend account is configured with your domain.

## 🔄 How It Works

### Affiliate Registration Flow
1. User visits `/affiliate/register`
2. Fills out name and email
3. System generates unique referral code (e.g., `JOHN1234`)
4. Affiliate account created in database
5. Welcome email sent with referral link and instructions

### Referral Flow
1. Affiliate shares referral link: `snapworxx.com/create?ref=JOHN1234`
2. Customer clicks link and lands on create page
3. Discount automatically applied (10% off)
4. Customer completes purchase
5. Stripe webhook creates commission record
6. Affiliate earns 60% commission automatically (valid for 90 days from registration)

### Dashboard Features
- **Earnings Summary**: Total, pending, and paid earnings
- **Program Status**: 90-day expiration tracking with countdown timer
- **Referral History**: All referrals with status and amounts  
- **Performance Metrics**: Conversion rates and analytics
- **Marketing Tools**: Copy referral links, test links
- **Real-time Updates**: Live tracking of new referrals

## 🎯 URL Structure

```
/affiliate/register          # Affiliate signup page
/affiliate/dashboard         # Affiliate earnings dashboard
/create?ref=CODE            # Referral link (auto-applies discount)
/api/affiliate/register     # Affiliate registration API
/api/affiliate/validate     # Referral code validation API
/api/affiliate/dashboard    # Dashboard data API
```

## 📊 Database Schema

### Affiliates Table
- `id`: UUID primary key
- `name`: Affiliate name
- `email`: Affiliate email (unique)
- `referral_code`: Unique referral code
- `commission_rate`: Commission percentage (default 60%)
- `program_expires_at`: Timestamp when 90-day program expires
- `total_earnings`: Total lifetime earnings
- `pending_earnings`: Unpaid earnings
- `paid_earnings`: Already paid earnings
- `status`: active/inactive/suspended/expired

### Affiliate Referrals Table  
- `id`: UUID primary key
- `affiliate_id`: References affiliates.id
- `event_id`: Event/session ID
- `customer_email`: Customer who purchased
- `sale_amount`: Total sale amount
- `commission_amount`: Commission earned
- `commission_rate`: Rate used for calculation
- `status`: pending/confirmed/paid/cancelled
- `stripe_session_id`: Stripe session ID

## 🔧 Configuration

### Commission Rates & Program Duration
- **Commission Rate**: 60% for all affiliates
- **Program Duration**: 90 days from registration
- **Customer Discount**: 10% off first purchase
- **Program Expiration**: Affiliates cannot generate new referrals after 90 days, but can still track and receive payment for earned commissions

### Code Generation
- Format: `{NAME_PREFIX}{4_DIGIT_NUMBER}`
- Example: `JOHN1234`, `MARY5678`
- Automatic uniqueness validation

### Payment Processing  
- Commissions calculated automatically on successful Stripe payments (60% of sale amount)
- Status tracking: pending → confirmed → paid
- Earnings updated via database triggers
- Program expiration validation: only active affiliates within 90-day window can earn new commissions

## 🎨 UI Components

### Registration Page
- Professional signup form
- Benefits showcase
- Social proof elements
- Mobile responsive design

### Dashboard
- Real-time earnings display
- Referral link management
- Performance analytics
- Referral history table
- Copy-to-clipboard functionality

## 🔒 Security

### Row Level Security (RLS)
- Affiliates can only see their own data
- Public read access for referral code validation
- Secure API endpoints with proper validation

### Data Validation
- Email uniqueness enforcement
- Referral code uniqueness
- Input sanitization and validation
- CORS protection

## 📈 Analytics & Reporting

### Affiliate Metrics
- Total referrals and conversions
- Earnings breakdown (total/pending/paid)
- Conversion rate calculation
- Performance over time

### Business Metrics
- Top performing affiliates
- Total commissions paid
- Customer acquisition costs
- ROI on affiliate program

## 🚨 Testing

### Test Scenarios
1. **Affiliate Registration**: Test signup flow and email delivery
2. **Referral Links**: Test `?ref=CODE` parameter handling
3. **Discount Application**: Verify 10% customer discount
4. **Commission Tracking**: Test Stripe webhook commission creation
5. **Dashboard Access**: Test affiliate login and data display

### Test Referral Codes
- Use `TEST1234` for testing (you can create this manually)
- Test referral link: `/create?ref=TEST1234`
- Monitor commission creation in dashboard

## 🛠 Troubleshooting

### Common Issues
1. **Emails not sending**: Check Resend API key and domain configuration
2. **Commissions not tracking**: Verify Stripe webhook is configured correctly
3. **Referral codes not working**: Check database RLS policies
4. **Dashboard not loading**: Verify affiliate exists and email is correct

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check Supabase logs for database errors
4. Test Stripe webhook with Stripe CLI

## 💡 Future Enhancements

- **Multi-tier commissions**: Different rates for different performance levels
- **Affiliate payouts**: Automated PayPal/Stripe payouts
- **Marketing materials**: Downloadable banners and templates  
- **Advanced analytics**: Detailed performance reporting
- **Referral contests**: Gamification and competitions
- **API webhooks**: Real-time notifications for new referrals

## 📞 Support

For technical support or questions about the affiliate system:
1. Check the troubleshooting guide above
2. Review database logs in Supabase
3. Test API endpoints individually
4. Contact development team with specific error messages

---

**Note**: This affiliate system is production-ready but should be thoroughly tested in your staging environment before deployment.