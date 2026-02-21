const http = require('http');

async function post(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Signup ---');
    try {
        const signupRes = await post('/signup', { username: 'testuser_script', password: 'password123' });
        console.log('Signup Response:', signupRes);

        if (signupRes.status === 201 || (signupRes.status === 400 && signupRes.body.message === 'User already exists')) {
            console.log('Signup Test: PASSED ✅');
        } else {
            console.log('Signup Test: FAILED ❌');
        }

        console.log('\n--- Testing Login ---');
        const loginRes = await post('/login', { username: 'testuser_script', password: 'password123' });
        console.log('Login Response:', loginRes);

        if (loginRes.status === 200 && loginRes.body.token) {
            console.log('Login Test: PASSED ✅');
        } else {
            console.log('Login Test: FAILED ❌');
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTests();
