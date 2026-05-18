const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hurtjslsvwcrfngcnlcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const BKASH_CONFIG = {
    apiUrl: process.env.BKASH_API_URL || 'https://checkout.pay.bka.sh/v1.2.0-beta',
    appKey: process.env.BKASH_APP_KEY || '',
    appSecret: process.env.BKASH_APP_SECRET || '',
    username: process.env.BKASH_USERNAME || '',
    password: process.env.BKASH_PASSWORD || '',
    sandboxMode: process.env.BKASH_SANDBOX === 'true' || true
};

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

async function getBkashToken() {
    if (BKASH_CONFIG.sandboxMode) {
        const response = await fetch(`${BKASH_CONFIG.apiUrl}/token/grant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_key: BKASH_CONFIG.appKey,
                app_secret: BKASH_CONFIG.appSecret,
                username: BKASH_CONFIG.username,
                password: BKASH_CONFIG.password
            })
        });
        const data = await response.json();
        return data.id_token;
    }
    return null;
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const data = JSON.parse(event.body);
        const { action, pp_id, amount, merchant_invoice_number, payment_id } = data;

        if (action === 'create') {
            if (!amount || !merchant_invoice_number) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: { 
                            code: 'MISSING_FIELD', 
                            message: 'Amount and invoice are required.' 
                        } 
                    })
                };
            }

            if (BKASH_CONFIG.sandboxMode || !BKASH_CONFIG.appKey) {
                const mockPaymentId = 'TRX' + Date.now();
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bkash_url: `${event.headers.origin || ''}/payment/${pp_id}?sandbox=true`,
                        payment_id: mockPaymentId,
                        status: 'sandbox',
                        message: 'bKash is in sandbox mode. Using mock payment.'
                    })
                };
            }

            const token = await getBkashToken();
            if (!token) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ 
                        error: { 
                            code: 'BKASH_ERROR', 
                            message: 'Failed to get bKash token.' 
                        } 
                    })
                };
            }

            const createResponse = await fetch(`${BKASH_CONFIG.apiUrl}/checkout/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'X-App-Key': BKASH_CONFIG.appKey
                },
                body: JSON.stringify({
                    amount: amount.toString(),
                    intent: 'sale',
                    merchant_invoice_number: merchant_invoice_number
                })
            });

            const result = await createResponse.json();

            if (result.payment_id) {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    {
                        payment_method: 'bkash',
                        transaction_id: result.payment_id,
                        metadata: { bkash_trxid: result.trx_id }
                    }
                );
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };

        } else if (action === 'verify') {
            if (!payment_id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: { 
                            code: 'MISSING_FIELD', 
                            message: 'Payment ID is required for verification.' 
                        } 
                    })
                };
            }

            if (BKASH_CONFIG.sandboxMode || !BKASH_CONFIG.appKey) {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    {
                        status: 'completed',
                        payment_method: 'bkash',
                        transaction_id: payment_id
                    }
                );

                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'completed',
                        transaction_id: payment_id,
                        message: 'Sandbox payment verified.'
                    })
                };
            }

            const token = await getBkashToken();
            const verifyResponse = await fetch(`${BKASH_CONFIG.apiUrl}/checkout/payment/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'X-App-Key': BKASH_CONFIG.appKey
                },
                body: JSON.stringify({ payment_id })
            });

            const result = await verifyResponse.json();

            if (result.status === 'Completed') {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    {
                        status: 'completed',
                        payment_method: 'bkash',
                        transaction_id: result.trx_id
                    }
                );
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };

        } else if (action === 'refund') {
            if (!payment_id || !amount) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: { 
                            code: 'MISSING_FIELD', 
                            message: 'Payment ID and amount are required for refund.' 
                        } 
                    })
                };
            }

            if (BKASH_CONFIG.sandboxMode || !BKASH_CONFIG.appKey) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'refunded',
                        refund_trxid: 'REF' + Date.now(),
                        message: 'Sandbox refund processed.'
                    })
                };
            }

            const token = await getBkashToken();
            const refundResponse = await fetch(`${BKASH_CONFIG.apiUrl}/checkout/payment/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'X-App-Key': BKASH_CONFIG.appKey
                },
                body: JSON.stringify({
                    payment_id,
                    amount: amount.toString(),
                    reason: 'Customer request'
                })
            });

            const result = await refundResponse.json();

            if (result.refund_trx_id) {
                await supabaseRequest(
                    `mit_payments?pp_id=eq.${pp_id}`,
                    'PATCH',
                    { status: 'refunded' }
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
                error: { 
                    code: 'INVALID_ACTION', 
                    message: 'Invalid action. Use: create, verify, or refund.' 
                } 
            })
        };

    } catch (error) {
        console.error('bKash payment error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: { 
                    code: 'INTERNAL_ERROR', 
                    message: 'bKash payment processing failed.' 
                } 
            })
        };
    }
};