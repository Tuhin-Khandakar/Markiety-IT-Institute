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

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const data = JSON.parse(event.body);
        const { pp_id } = data;

        if (!pp_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: { 
                        code: 'INVALID_PP_ID', 
                        message: 'A valid pp_id is required.' 
                    } 
                })
            };
        }

        const payments = await supabaseRequest(`mit_payments?pp_id=eq.${pp_id}`, 'GET');

        if (!payments || payments.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: { 
                        code: 'INVALID_PP_ID', 
                        message: 'Payment not found.' 
                    } 
                })
            };
        }

        const payment = payments[0];

        const response = {
            pp_id: payment.pp_id,
            full_name: payment.full_name,
            email_address: payment.email_address,
            mobile_number: payment.mobile_number,
            amount: payment.amount,
            currency: payment.currency,
            gateway: payment.payment_method,
            transaction_id: payment.transaction_id,
            status: payment.status,
            date: payment.created_at
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Payment verification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: { 
                    code: 'INTERNAL_ERROR', 
                    message: 'Failed to verify payment.' 
                } 
            })
        };
    }
};