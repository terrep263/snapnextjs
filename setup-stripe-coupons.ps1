# Quick setup script for Stripe promotion codes (Windows)
# Run this to set up example promotion codes

$BaseUrl = "http://localhost:3000/api"

Write-Host "🎉 SnapWorxx Stripe Coupon Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create coupons first
Write-Host "📝 Creating coupons..." -ForegroundColor Yellow

# Coupon 1: Launch 50% off
Write-Host "Creating 'launch-50-off' coupon..." -ForegroundColor Green
$coupon1 = @{
    couponId = "launch-50-off"
    percentOff = 50
    duration = "repeating"
    durationInMonths = 1
    maxRedemptions = 100
    redeemByDays = 30
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-coupons" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $coupon1 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "Creating 'summer-30-off' coupon..." -ForegroundColor Green
$coupon2 = @{
    couponId = "summer-30-off"
    percentOff = 30
    duration = "repeating"
    durationInMonths = 3
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-coupons" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $coupon2 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "Creating 'friend-referral-20-off' coupon..." -ForegroundColor Green
$coupon3 = @{
    couponId = "friend-referral-20-off"
    percentOff = 20
    duration = "forever"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-coupons" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $coupon3 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "---" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Creating promotion codes..." -ForegroundColor Yellow

# Create promotion codes
Write-Host "Creating 'LAUNCH50' promotion code..." -ForegroundColor Green
$promo1 = @{
    code = "LAUNCH50"
    couponId = "launch-50-off"
    maxRedemptions = 100
    expiresInDays = 30
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-promotions" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $promo1 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "Creating 'SUMMER30' promotion code..." -ForegroundColor Green
$promo2 = @{
    code = "SUMMER30"
    couponId = "summer-30-off"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-promotions" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $promo2 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "Creating 'FRIEND20' promotion code..." -ForegroundColor Green
$promo3 = @{
    code = "FRIEND20"
    couponId = "friend-referral-20-off"
} | ConvertTo-Json

Invoke-WebRequest -Uri "$BaseUrl/stripe-promotions" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $promo3 | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Try these codes in checkout:" -ForegroundColor Yellow
Write-Host "  - LAUNCH50 (50% off, expires in 30 days)" -ForegroundColor White
Write-Host "  - SUMMER30 (30% off)" -ForegroundColor White
Write-Host "  - FRIEND20 (20% off)" -ForegroundColor White
Write-Host ""
Write-Host "List all codes: Invoke-WebRequest -Uri '$BaseUrl/stripe-promotions' | Select-Object -ExpandProperty Content" -ForegroundColor Cyan
