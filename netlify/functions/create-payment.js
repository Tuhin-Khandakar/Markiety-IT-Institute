const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hurtjslsvwcrfngcnlcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    return response.json();
}

function generatePaymentId(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const data = JSON.parse(event.body);
        const { 
            full_name, 
            email_address, 
            mobile_number, 
            amount, 
            currency = 'BDT',
            course_name,
            course_id,
            return_url,
            webhook_url,
            metadata = {}
        } = data;

        if (!full_name || !email_address || !mobile_number || !amount) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: { 
                        code: 'MISSING_FIELD', 
                        message: 'Full name, email, mobile, and amount are required.' 
                    } 
                })
            };
        }

        if (isNaN(amount) || amount <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: { 
                        code: 'INVALID_AMOUNT', 
                        message: 'Amount must be a positive number.' 
                    } 
                })
            };
        }

        if (email_address && !email_address.includes('@')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: { 
                        code: 'INVALID_EMAIL', 
                        message: 'A valid email address is required.' 
                    } 
                })
            };
        }

        const pp_id = generatePaymentId(20);
        const created_at = new Date().toISOString();

        const paymentRecord = {
            pp_id,
            full_name,
            email_address,
            mobile_number,
            amount: parseFloat(amount),
            currency,
            course_name: course_name || null,
            course_id: course_id || null,
            status: 'pending',
            payment_method: null,
            transaction_id: null,
            return_url: return_url || null,
            webhook_url: webhook_url || null,
            metadata: { ...metadata, created_at },
            created_at,
            updated_at: created_at
        };

        const result = await supabaseRequest('mit_payments', 'POST', paymentRecord);

        const response = {
            pp_id,
            pp_url: `${event.headers.origin || ''}/payment/${pp_id}`,
            amount: parseFloat(amount),
            currency,
            status: 'pending'
        };

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Payment creation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: { 
                    code: 'INTERNAL_ERROR', 
                    message: 'Failed to create payment.' 
                } 
            })
        };
    }
};