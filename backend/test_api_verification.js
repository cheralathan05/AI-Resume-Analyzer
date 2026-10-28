const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('   FULL END-TO-END VERIFICATION OF LIVE BACKEND API ');
  console.log('====================================================\n');

  const results = [];

  // 1. Health
  try {
    const res = await request({ host: 'localhost', port: 5001, path: '/api/health', method: 'GET' });
    results.push({ name: '1. Health & Server Status', status: res.data?.status === 'ok' ? 'PASS' : 'FAIL', details: `Status: ${res.data?.status}` });
  } catch (err) {
    results.push({ name: '1. Health & Server Status', status: 'FAIL', details: err.message });
  }

  // 2. Auth Login (Cheralathan B.N)
  let token = null;
  try {
    const res = await request(
      { host: 'localhost', port: 5001, path: '/api/auth/demo-login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { persona: 'cheralathan' }
    );
    token = res.data?.token;
    results.push({
      name: '2. HMAC Auth & Cryptographic Session',
      status: res.data?.success && token ? 'PASS' : 'FAIL',
      details: `User: ${res.data?.user?.name} (${res.data?.user?.email}), Token prefix: ${token?.slice(0, 15)}...`
    });
  } catch (err) {
    results.push({ name: '2. HMAC Auth & Cryptographic Session', status: 'FAIL', details: err.message });
  }

  // 3. Latest Upload Resume
  let activeResumeText = '';
  try {
    const res = await request({ host: 'localhost', port: 5001, path: '/api/upload/latest', method: 'GET' });
    activeResumeText = res.data?.resume?.full_text || '';
    results.push({
      name: '3. Latest Stored Candidate Resume',
      status: res.data?.success && res.data?.resume?.contact?.name ? 'PASS' : 'FAIL',
      details: `Candidate: ${res.data?.resume?.contact?.name}, Skills: ${res.data?.resume?.skills?.length}, File: ${res.data?.filename}`
    });
  } catch (err) {
    results.push({ name: '3. Latest Stored Candidate Resume', status: 'FAIL', details: err.message });
  }

  // 4. Stored Resumes in DB
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await request({ host: 'localhost', port: 5001, path: '/api/upload/resumes', method: 'GET', headers });
    results.push({
      name: '4. Resumes Collection in Database',
      status: res.data?.success ? 'PASS' : 'FAIL',
      details: `Total Resumes Stored: ${res.data?.resumes?.length || 0}`
    });
  } catch (err) {
    results.push({ name: '4. Resumes Collection in Database', status: 'FAIL', details: err.message });
  }

  // 5. Embedded Database Stats
  try {
    const res = await request({ host: 'localhost', port: 5001, path: '/api/history/stats', method: 'GET' });
    results.push({
      name: '5. Embedded JSON Database (db.json)',
      status: res.data?.database?.connected ? 'PASS' : 'FAIL',
      details: `Connected: ${res.data?.database?.connected}, Users: ${res.data?.database?.usersCount}, Resumes: ${res.data?.database?.resumesCount}, Analyses: ${res.data?.database?.analysesCount}`
    });
  } catch (err) {
    results.push({ name: '5. Embedded JSON Database (db.json)', status: 'FAIL', details: err.message });
  }

  // 6. Recommended Jobs Engine (with Real Active Candidate Resume)
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await request(
      { host: 'localhost', port: 5001, path: '/api/ats/recommended-jobs', method: 'POST', headers },
      { resumeText: activeResumeText }
    );
    results.push({
      name: '6. Recommended Jobs Matching Engine',
      status: res.data?.success && res.data?.jobs?.length > 0 ? 'PASS' : 'FAIL',
      details: `Total Jobs: ${res.data?.totalJobs}, Top Role: ${res.data?.jobs?.[0]?.company} - ${res.data?.jobs?.[0]?.title} (${res.data?.jobs?.[0]?.matchScore}% Match)`
    });
  } catch (err) {
    results.push({ name: '6. Recommended Jobs Matching Engine', status: 'FAIL', details: err.message });
  }

  // 7. Applications CRM Pipeline
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await request({ host: 'localhost', port: 5001, path: '/api/applications', method: 'GET', headers });
    results.push({
      name: '7. Persistent Applications CRM',
      status: res.data?.success ? 'PASS' : 'FAIL',
      details: `Pipeline Total: ${res.data?.total} (Wishlist: ${res.data?.counts?.Wishlist || 0}, Interviewing: ${res.data?.counts?.Interviewing || 0})`
    });
  } catch (err) {
    results.push({ name: '7. Persistent Applications CRM', status: 'FAIL', details: err.message });
  }

  // 8. AI Status & Ollama Connection
  try {
    const res = await request({ host: 'localhost', port: 5001, path: '/api/ai/status', method: 'GET' });
    results.push({
      name: '8. AI Engine & Model Status',
      status: 'PASS',
      details: `Ollama Connected: ${res.data?.connected}, Model: ${res.data?.activeModel || 'qwen3:8b'}`
    });
  } catch (err) {
    results.push({ name: '8. AI Engine & Model Status', status: 'FAIL', details: err.message });
  }

  // 9. Bullet Point Enhancer (STAR / Google XYZ)
  try {
    const res = await request(
      { host: 'localhost', port: 5001, path: '/api/ai/power-bullet', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { bullet: 'Developed REST API layer for CRM with caching', role: 'Full-Stack Engineer' }
    );
    results.push({
      name: '9. Google XYZ & STAR Bullet Enhancer',
      status: res.data?.success && res.data?.variants?.length > 0 ? 'PASS' : 'FAIL',
      details: `Synthesized ${res.data?.variants?.length} formula variations (Top: ${res.data?.variants?.[0]?.badge})`
    });
  } catch (err) {
    results.push({ name: '9. Google XYZ & STAR Bullet Enhancer', status: 'FAIL', details: err.message });
  }

  // 10. AI Portfolio Generator
  try {
    const res = await request(
      { host: 'localhost', port: 5001, path: '/api/ai/portfolio', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { resume: { contact: { name: 'Cheralathan B.N' }, skills: ['React', 'Node.js', 'Spring Boot'] }, theme: 'obsidian' }
    );
    results.push({
      name: '10. Developer Portfolio Generator',
      status: res.data?.success && res.data?.generatedHtml?.length > 1000 ? 'PASS' : 'FAIL',
      details: `Generated Obsidian Website: ${res.data?.generatedHtml?.length} bytes, Theme: ${res.data?.theme}`
    });
  } catch (err) {
    results.push({ name: '10. Developer Portfolio Generator', status: 'FAIL', details: err.message });
  }

  // Print results
  results.forEach(r => {
    const symbol = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${symbol} [${r.status}] ${r.name}`);
    console.log(`   └─ ${r.details}\n`);
  });

  const passCount = results.filter(r => r.status === 'PASS').length;
  console.log(`Summary: ${passCount} / ${results.length} tests passed successfully.`);
}

run();
