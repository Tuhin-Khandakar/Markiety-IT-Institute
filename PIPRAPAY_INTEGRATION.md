# PipraPay Integration Setup Guide

## Overview
This integrates PipraPay-style payment functionality into your static site using Netlify serverless functions.

## Prerequisites
- Netlify account for deployment
- Supabase account (already configured)
- Optional: bKash/Nagad API credentials for production

## Setup Steps

### 1. Add Payments Table to Supabase
Go to your Supabase SQL Editor and run the contents of `supabase_payments_setup.sql`:

```sql
-- Run this in Supabase > SQL Editor
CREATE TABLE IF NOT EXISTS mit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pp_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email_address TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'BDT',
    course_name TEXT,
    course_id TEXT,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    return_url TEXT,
    webhook_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can verify payments by pp_id" ON mit_payments FOR SELECT USING (true);
CREATE POLICY "Public can create payments" ON mit_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update payment status" ON mit_payments FOR UPDATE USING (true);
```

### 2. Configure Netlify Environment Variables
In Netlify dashboard > Site settings > Environment variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| SUPABASE_URL | `https://hurtjslsvwcrfngcnlcs.supabase.co` | Yes |
| SUPABASE_SERVICE_KEY | Your Supabase service role key | Yes |
| BKASH_SANDBOX | `true` | Optional |
| BKASH_APP_KEY | Your bKash app key | For production |
| BKASH_APP_SECRET | Your bKash app secret | For production |
| BKASH_USERNAME | Your bKash username | For production |
| BKASH_PASSWORD | Your bKash password | For production |
| NAGAD_SANDBOX | `false` | Optional |
| NAGAD_MERCHANT_ID | Your Nagad merchant ID | For production |
| NAGAD_MERCHANT_KEY | Your Nagad merchant key | For production |

### 3. Deploy
Deploy to Netlify. The functions will be auto-detected and deployed.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payment/create` | POST | Create a payment |
| `/api/payment/verify` | POST | Verify payment status |
| `/api/payment/bkash` | POST | bKash payment operations |
| `/api/payment/nagad` | POST | Nagad payment operations |

## Payment Flow

1. User selects payment method (bKash/Nagad/Manual)
2. Frontend calls `/api/payment/create` to create payment record
3. For bKash/Nagad: Call respective gateway API to get payment URL
4. User redirected to payment gateway (or sandbox mode completes)
5. Payment status page shows result

## Testing in Sandbox Mode

The payment system works in sandbox mode without real API keys:
- All payments are marked as completed automatically
- Transaction IDs are generated (TRX + timestamp)
- No real money is transferred

## Production Setup

To enable real payments:
1. Get bKash API credentials from bKash
2. Get Nagad API credentials from Nagad
3. Add credentials to Netlify environment variables
4. Set `BKASH_SANDBOX=false` and `NAGAD_SANDBOX=false`

## Files Structure

```
netlify/
  functions/
    create-payment.js    - Create payment endpoint
    verify-payment.js    - Verify payment endpoint  
    bkash-payment.js    - bKash gateway integration
    nagad-payment.js    - Nagad gateway integration
```

## Troubleshooting

### Function not found
- Ensure functions are in `netlify/functions/` directory
- Check Netlify function logs in dashboard

### Supabase connection error
- Verify SUPABASE_SERVICE_KEY is set
- Ensure table was created in Supabase

### Payment not found
- Check the payment ID matches exactly
- Ensure RLS policies allow public read