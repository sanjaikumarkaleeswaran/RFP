const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    try {
        console.log('🧪 Testing Authentication Flow...\n');

        // Test 1: Register a new user
        console.log('1️⃣ Testing Registration...');
        const registerData = {
            email: 'test@example.com',
            password: 'test123456',
            name: 'Test User'
        };

        const registerResponse = await axios.post(`${BASE_URL}/register`, registerData);
        console.log('✅ Registration successful!');
        console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

        const token = registerResponse.data.token;
        console.log('\n');

        // Test 2: Login with the same user
        console.log('2️⃣ Testing Login...');
        const loginData = {
            email: 'test@example.com',
            password: 'test123456'
        };

        const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        console.log('\n');

        // Test 3: Get current user
        console.log('3️⃣ Testing Get Me...');
        const meResponse = await axios.get(`${BASE_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('✅ Get Me successful!');
        console.log('Response:', JSON.stringify(meResponse.data, null, 2));
        console.log('\n');

        console.log('🎉 All tests passed!');

    } catch (error) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAuth();
