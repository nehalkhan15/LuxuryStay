const http = require('http');

async function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try {
          resolve({ status: response.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: response.statusCode, data: body });
        }
      });
    });

    request.on('error', reject);
    if (data) request.write(JSON.stringify(data));
    request.end();
  });
}

async function runVerification() {
  const admin = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@hotel.com',
    password: 'Password123'
  });

  if (admin.status !== 200 || !admin.data.token || admin.data.user?.role !== 'Admin') {
    throw new Error(`Primary admin login failed: HTTP ${admin.status}`);
  }

  const guest = await makeRequest('/api/auth/login', 'POST', {
    email: 'guest@hotel.com',
    password: 'Password123'
  });

  if (guest.status !== 200 || guest.data.user?.role !== 'Guest') {
    throw new Error(`Guest login failed: HTTP ${guest.status}`);
  }

  const oldAdmin = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin1@hotel.com',
    password: 'Password123'
  });

  if (oldAdmin.status === 200) {
    throw new Error('A secondary admin account is still active.');
  }

  console.log('Primary admin, guest, and secondary-admin removal checks passed.');
}

runVerification().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
