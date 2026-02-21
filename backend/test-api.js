const http = require('http');

const testData = JSON.stringify({
    username: 'testuser_' + Date.now(),
    password: 'password123'
});

const options = (path) => ({
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
});

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.request(options(path), (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.write(testData);
        req.end();
    });
}

(async () => {
    try {
        console.log('Testing Signup...');
        const signupRes = await makeRequest('/signup');
        console.log('Signup Response:', signupRes);

        if (signupRes.statusCode === 201) {
            console.log('Signup Successful! ✅');
        } else {
            console.log('Signup Failed! ❌');
        }

        console.log('\nTesting Login...');
        const loginRes = await makeRequest('/login');
        console.log('Login Response:', loginRes);

        if (loginRes.statusCode === 200 && loginRes.body.token) {
            console.log('Login Successful! ✅');
        } else {
            console.log('Login Failed! ❌');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
})();
