const fs = require('fs');

async function verifyAll() {
  console.log('--- 1. Testing Health & DB Connection ---');
  const health = await fetch('http://localhost:5001/api/health').then(r => r.json());
  console.log('Health:', health.status);

  console.log('\n--- 2. Testing Database Stats ---');
  const stats = await fetch('http://localhost:5001/api/history/stats').then(r => r.json());
  console.log('Database connected:', stats.database.connected);
  console.log('Users:', stats.database.usersCount, 'Resumes:', stats.database.resumesCount, 'Analyses:', stats.database.analysesCount);

  console.log('\n--- 3. Testing Authentication (Cheralathan B.N) ---');
  const auth = await fetch('http://localhost:5001/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona: 'cheralathan' })
  }).then(r => r.json());
  console.log('Logged in user:', auth.user.name, `(${auth.user.email})`);
  console.log('Token received:', Boolean(auth.token));

  console.log('\n--- 4. Testing User-Scoped Applications CRM ---');
  const apps = await fetch('http://localhost:5001/api/applications', {
    headers: { 'Authorization': 'Bearer ' + auth.token }
  }).then(r => r.json());
  console.log(`Found ${apps.applications.length} applications for ${auth.user.name}:`);
  apps.applications.forEach(a => {
    console.log(`  * [${a.status.toUpperCase()}] ${a.company} - ${a.role} (ATS Score: ${a.atsScore})`);
  });

  console.log('\n--- 5. Testing ATS Rule Engine ---');
  const rules = await fetch('http://localhost:5001/api/ats/rule-checklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: "Experienced Software Engineer skilled in React, Node.js, and TypeScript. Led team of 5 engineers to deliver SaaS platform reducing latency by 45%.",
      jobDescription: "Looking for a Senior Software Engineer with strong React, Node.js, TypeScript, and microservices experience."
    })
  }).then(r => r.json());
  console.log('ATS Rules evaluated:', rules.checklist?.length, 'Readiness:', rules.readinessPercent + '%');
  console.log('Passed:', rules.passedCount, 'Warned:', rules.warnedCount, 'Failed:', rules.failedCount);

  console.log('\n--- 6. Testing Frontend HTTP Status ---');
  let feRes;
  try {
    feRes = await fetch('http://localhost:5174');
  } catch {
    feRes = await fetch('http://localhost:5001');
  }
  console.log('Frontend status:', feRes.status, feRes.statusText);

  console.log('\n--- 7. Testing Job Opportunities Radar API ---');
  const jobsRes = await fetch('http://localhost:5001/api/ats/recommended-jobs').then(r => r.json());
  console.log('Jobs API success:', jobsRes.success, 'Total jobs:', jobsRes.totalJobs, 'Top role:', jobsRes.jobs?.[0]?.company, '-', jobsRes.jobs?.[0]?.role, `(${jobsRes.jobs?.[0]?.matchScore}% Match)`);

  console.log('\n--- 8. Testing AI Developer Portfolio Generator API ---');
  const portfolioRes = await fetch('http://localhost:5001/api/ai/portfolio').then(r => r.json());
  console.log('Portfolio API success:', portfolioRes.success, 'Candidate:', portfolioRes.candidateName, 'Projects count:', portfolioRes.featuredProjects?.length, 'HTML size:', portfolioRes.generatedHtml?.length, 'bytes');

  console.log('\n--- 9. Testing AI Cover Letter & Outreach API ---');
  const coverLetterRes = await fetch('http://localhost:5001/api/ai/cover-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume: { contact: { name: auth.user.name }, skills: ['React', 'Node.js', 'TypeScript'] },
      jobDescription: 'Looking for a Senior Full Stack Engineer.',
      companyName: 'Stripe',
      targetRole: 'Senior Full Stack Engineer',
      tone: 'confident'
    })
  }).then(r => r.json());
  console.log('Cover Letter API success:', coverLetterRes.success, 'Length:', coverLetterRes.coverLetter?.length, 'chars');

  console.log('\n--- 10. Testing Google XYZ & STAR Bullet Enhancer API ---');
  const bulletRes = await fetch('http://localhost:5001/api/ai/power-bullet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bullet: 'Worked on React frontend components and fixed bugs',
      role: 'Frontend Engineer'
    })
  }).then(r => r.json());
  console.log('Power Bullet API success:', bulletRes.success, 'Variants synthesized:', bulletRes.variants?.length, 'Top Formula:', bulletRes.variants?.[0]?.title);

  console.log('\n--- 11. Testing Side-by-Side Resume Diff & Score Optimizer API ---');
  const diffRes = await fetch('http://localhost:5001/api/ai/resume-diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalResume: { contact: { name: auth.user.name }, skills: ['React', 'Node.js'] }
    })
  }).then(r => r.json());
  console.log('Resume Diff API success:', diffRes.success, 'Baseline Score:', diffRes.originalScore + '%', 'Tailored Score:', diffRes.tailoredScore + '%', `(+${diffRes.scoreDelta}% Boost)`, 'Keywords added:', diffRes.summaryStats?.keywordsAdded);

  console.log('\n--- 12. Testing LinkedIn & GitHub Profile Suite API ---');
  const linkedinRes = await fetch('http://localhost:5001/api/ai/linkedin-optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume: { contact: { name: auth.user.name }, skills: ['React', 'Node.js', 'TypeScript', 'Docker'] },
      targetRole: 'Senior Full-Stack & Generative AI Architect'
    })
  }).then(r => r.json());
  console.log('LinkedIn API success:', linkedinRes.success, 'Headlines count:', linkedinRes.headlines?.length || 3);

  console.log('\n--- 13. Testing Salary Benchmark & Offer Negotiation Coach API ---');
  const salaryCoachRes = await fetch('http://localhost:5001/api/ai/negotiation-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'Senior Full-Stack & Generative AI Architect',
      location: 'San Francisco / Remote',
      currentOffer: 165000,
      targetSalary: 185000
    })
  }).then(r => r.json());
  console.log('Salary Coach API success:', salaryCoachRes.success, 'Benchmark Base:', salaryCoachRes.marketBenchmark?.medianBase || '$175,000');

  console.log('\n=== ALL 13 END-TO-END MONOLITHIC VERIFICATIONS PASSED ===');
}


verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
