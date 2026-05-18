const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hurtjslsvwcrfngcnlcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const NAGAD_CONFIG = {
    apiUrl: process.env.NAGAD_API_URL || 'https://api.mynagad.com',
    merchantId: process.env.NAGAD_MERCHANT_ID || '',
    merchantKey: process.env.NAGAD_MERCHANT_KEY || '',
    publicKey: process.env.NAGAD_PUBLIC_KEY || '',
    sandboxMode: process.env.NAGAD_SANDBOX === 'false' ? false : true
};

async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    return response.json();
}

function base64Encode(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const data = JSON.parse(event.body);
        const { action, pp_id, amount, order_id, payment_ref_id } = data;

        if (action === 'create') {
            if (!amount || !order_id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: { code: 'MISSING_FIELD', message: 'Amount and order ID required.' } 
                    })
                };
            }

            if (NAGAD_CONFIG.sandboxMode || !NAGAD_CONFIG.merchantId) {
                const mockPaymentRef = 'NAGAD' + Date.now();
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        success: true,
                        payment_ref_id: mockPaymentRef,
                        payment_url: `${event.headers.origin || ''}/payment/${pp_id}?sandbox=true`,
                        message: 'Nagad is in sandbox mode.'
                    })
                };
            }

            const datetime = new Date().toISOString();
            const signature = base64Encode({
                merchant_id: NAGAD_CONFIG.merchantId,
                order_id,
                datetime,
                amount: amount.toString()
            });

            const response = await fetch(`${NAGAD_CONFIG.apiUrl}/api/df/sandbox-with-sig/invoke/payment/init`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-KM-Api-Key': NAGAD_CONFIG.merchantKey,
                    'X-KM-Client-Type': 'SANDBOX'
                },
                body: JSON.stringify({
                    account: NAGAD_CONFIG.merchantId,
                    amount: amount.toString(),
                    charge_amount: '0',
                    currency: 'BDT',
                    order_id,
                    product_id: NAGAD_CONFIG.merchantId,
                    product_name: 'MIT Payment',
                    signature,
                    datetime
                })
            });

            const result = await response.json();

            if (result.payment_ref_id) {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    { payment_method: 'nagad', transaction_id: result.payment_ref_id }
                );
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };

        } else if (action === 'verify') {
            if (!payment_ref_id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: { code: 'MISSING_FIELD', message: 'Payment reference ID required.' } 
                    })
                };
            }

            if (NAGAD_CONFIG.sandboxMode || !NAGAD_CONFIG.merchantId) {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    { status: 'completed', payment_method: 'nagad', transaction_id: payment_ref_id }
                );

                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'SUCCESS',
                        message: 'Sandbox payment verified.'
                    })
                };
            }

            const response = await fetch(`${NAGAD_CONFIG.apiUrl}/api/df/sandbox-with-sig/invoke/payment/status`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-KM-Api-Key': NAGAD_CONFIG.merchantKey,
                    'X-KM-Client-Type': 'SANDBOX'
                },
                body: JSON.stringify({ payment_ref_id })
            });

            const result = await response.json();

            if (result.status === 'SUCCESS') {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    { status: 'completed', payment_method: 'nagad', transaction_id: payment_ref_id }
                );
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ 
                error: { code: 'INVALID_ACTION', message: 'Use: create, or verify.' } 
            })
        };

    } catch (error) {
        console.error('Nagad payment error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: { code: 'INTERNAL_ERROR', message: 'Nagad payment failed.' } 
            })
        };
    }
};