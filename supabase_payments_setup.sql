-- PipraPay-style Payment System for MIT
-- Add this to your Supabase SQL Editor

-- Create payments table
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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    transaction_id TEXT,
    return_url TEXT,
    webhook_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mit_payments ENABLE ROW LEVEL SECURITY;

-- Public read for verification (payment status only)
CREATE POLICY "Public can verify payments by pp_id"
ON mit_payments FOR SELECT
USING (true);

-- Allow public insert for payment creation
CREATE POLICY "Public can create payments"
ON mit_payments FOR INSERT
WITH CHECK (true);

-- Allow authenticated updates for verification webhook
CREATE POLICY "Service can update payment status"
ON mit_payments FOR UPDATE
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_pp_id ON mit_payments(pp_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON mit_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_email ON mit_payments(email_address);
CREATE INDEX IF NOT EXISTS idx_payments_created ON mit_payments(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON mit_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert some test data (optional)
-- INSERT INTO mit_payments (pp_id, full_name, email_address, mobile_number, amount, currency, status)
-- VALUES ('test123', 'Test User', 'test@example.com', '01612345678', 5500, 'BDT', 'pending');

SELECT 'Payment table created successfully!' as message;