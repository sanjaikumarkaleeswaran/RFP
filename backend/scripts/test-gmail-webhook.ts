/**
 * Gmail Webhook Test Script
 * 
 * This script helps test and debug Gmail webhook functionality
 * 
 * Usage:
 * 1. Set your auth token: export AUTH_TOKEN="your-jwt-token"
 * 2. Run: npx ts-node test-gmail-webhook.ts
 */

import https from 'https';
import http from 'http';

// Simple fetch helper using built-in http/https (no axios needed)
function makeRequest(method: string, url: string, data?: any, headers?: Record<string, string>): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === 'https:';
        const lib = isHttps ? https : http;
        const body = data ? JSON.stringify(data) : undefined;
        const req = lib.request({
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
                ...headers
            }
        }, (res) => {
            let raw = '';
            res.on('data', (chunk) => raw += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode || 0, data: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode || 0, data: raw }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

// Axios-compatible shim
const axios = {
    get: (url: string, config?: { headers?: Record<string, string>; timeout?: number }) =>
        makeRequest('GET', url, undefined, config?.headers),
    post: (url: string, data?: any, config?: { headers?: Record<string, string>; timeout?: number }) =>
        makeRequest('POST', url, data, config?.headers),
};


const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

interface TestResult {
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    data?: any;
}

const results: TestResult[] = [];

async function runTests() {
    console.log('🧪 Gmail Webhook Test Suite\n');
    console.log('='.repeat(60));

    // Test 1: Check if server is running
    await testServerHealth();

    // Test 2: Check webhook endpoint accessibility
    await testWebhookEndpoint();

    // Test 3: Start webhook watch
    await testStartWebhook();

    // Test 4: Check webhook status
    await testWebhookStatus();

    // Test 5: Test webhook notification handling
    await testWebhookNotification();

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:\n');

    results.forEach((result, index) => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
        console.log(`${icon} Test ${index + 1}: ${result.test}`);
        console.log(`   ${result.message}`);
        if (result.data) {
            console.log(`   Data:`, JSON.stringify(result.data, null, 2));
        }
        console.log('');
    });

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(60));
}

async function testServerHealth() {
    try {
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        results.push({
            test: 'Server Health Check',
            status: 'PASS',
            message: 'Server is running',
            data: response.data
        });
    } catch (error: any) {
        results.push({
            test: 'Server Health Check',
            status: 'FAIL',
            message: `Server not accessible: ${error.message}`
        });
    }
}

async function testWebhookEndpoint() {
    try {
        // Test with a mock Pub/Sub notification
        const mockNotification = {
            message: {
                data: Buffer.from(JSON.stringify({
                    emailAddress: 'test@gmail.com',
                    historyId: '123456'
                })).toString('base64'),
                messageId: 'test-message-id',
                publishTime: new Date().toISOString()
            }
        };

        const response = await axios.post(
            `${BASE_URL}/api/email/gmail/webhook/notifications`,
            mockNotification,
            { timeout: 5000 }
        );

        if (response.status === 200) {
            results.push({
                test: 'Webhook Endpoint Accessibility',
                status: 'PASS',
                message: 'Webhook endpoint is accessible and responding',
                data: { status: response.status, response: response.data }
            });
        } else {
            results.push({
                test: 'Webhook Endpoint Accessibility',
                status: 'FAIL',
                message: `Unexpected status code: ${response.status}`
            });
        }
    } catch (error: any) {
        results.push({
            test: 'Webhook Endpoint Accessibility',
            status: 'FAIL',
            message: `Webhook endpoint error: ${error.message}`
        });
    }
}

async function testStartWebhook() {
    if (!AUTH_TOKEN) {
        results.push({
            test: 'Start Webhook Watch',
            status: 'SKIP',
            message: 'AUTH_TOKEN not provided. Set it with: export AUTH_TOKEN="your-token"'
        });
        return;
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/api/email/gmail/webhook/start`,
            {},
            {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
                timeout: 10000
            }
        );

        if (response.data.success) {
            results.push({
                test: 'Start Webhook Watch',
                status: 'PASS',
                message: 'Webhook watch started successfully',
                data: response.data
            });
        } else {
            results.push({
                test: 'Start Webhook Watch',
                status: 'FAIL',
                message: 'Failed to start webhook watch',
                data: response.data
            });
        }
    } catch (error: any) {
        results.push({
            test: 'Start Webhook Watch',
            status: 'FAIL',
            message: `Error: ${error.response?.data?.message || error.message}`,
            data: error.response?.data
        });
    }
}

async function testWebhookStatus() {
    if (!AUTH_TOKEN) {
        results.push({
            test: 'Check Webhook Status',
            status: 'SKIP',
            message: 'AUTH_TOKEN not provided'
        });
        return;
    }

    try {
        const response = await axios.get(
            `${BASE_URL}/api/email/gmail/status`,
            {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
                timeout: 5000
            }
        );

        results.push({
            test: 'Check Webhook Status',
            status: 'PASS',
            message: 'Gmail connection status retrieved',
            data: response.data
        });
    } catch (error: any) {
        results.push({
            test: 'Check Webhook Status',
            status: 'FAIL',
            message: `Error: ${error.response?.data?.message || error.message}`
        });
    }
}

async function testWebhookNotification() {
    try {
        // Simulate a real Pub/Sub notification
        const notification = {
            message: {
                data: Buffer.from(JSON.stringify({
                    emailAddress: 'test@gmail.com',
                    historyId: Date.now().toString()
                })).toString('base64'),
                messageId: `test-${Date.now()}`,
                publishTime: new Date().toISOString()
            },
            subscription: 'projects/test/subscriptions/test'
        };

        const response = await axios.post(
            `${BASE_URL}/api/email/gmail/webhook/notifications`,
            notification,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        results.push({
            test: 'Webhook Notification Handling',
            status: 'PASS',
            message: 'Webhook processed notification successfully',
            data: { status: response.status }
        });
    } catch (error: any) {
        results.push({
            test: 'Webhook Notification Handling',
            status: 'FAIL',
            message: `Error: ${error.message}`
        });
    }
}

// Run tests
runTests().catch(console.error);
