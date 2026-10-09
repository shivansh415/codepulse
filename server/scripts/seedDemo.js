// Seeds demo users (with real public coding handles) and a community post through the running API.
// Usage: node server/scripts/seedDemo.js [--if-empty]
//   --if-empty  only seed when the demo account doesn't exist yet
const API = process.env.API_URL || 'http://localhost:5050/api';
const PASSWORD = 'Demo@1234';

const USERS = [
  { name: 'Demo Student', email: 'demo@codepulse.test', college: 'Demo College', handles: { codeforces: 'tourist', leetcode: 'neal_wu', codechef: 'gennady.korotkevich' } },
  { name: 'Rahul Sharma', email: 'rahul@codepulse.test', college: 'Demo College', handles: { codeforces: 'jiangly', leetcode: 'lee215' } },
  { name: 'Priya Verma', email: 'priya@codepulse.test', college: 'Demo College', handles: { codeforces: 'Benq', leetcode: 'votrubac' } },
  { name: 'Aman Gupta', email: 'aman@codepulse.test', college: 'IIT Delhi', handles: { codeforces: 'Um_nik', leetcode: 'uwi' } },
  { name: 'Sneha Jain', email: 'sneha@codepulse.test', college: 'IIT Delhi', handles: { codeforces: 'ecnerwala', leetcode: 'awice' } },
];

const post = async (path, body, token) => {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const main = async () => {
  const login = await post('/auth/login', { email: USERS[0].email, password: PASSWORD });
  if (login.status === 200 && process.argv.includes('--if-empty')) return;

  console.log('Adding demo data (fetching live stats, takes ~30s)...');
  let demoToken;
  for (const u of USERS) {
    let res = await post('/auth/register', { name: u.name, email: u.email, password: PASSWORD, college: u.college });
    if (res.status === 409) res = await post('/auth/login', { email: u.email, password: PASSWORD });
    const token = res.data.token;
    if (!token) {
      console.log(`  ✗ ${u.name}: ${res.data.message || res.status}`);
      continue;
    }
    if (!demoToken) demoToken = token;
    const sync = await post('/platforms/connect', u.handles, token);
    const summary = (sync.data.results || []).map((r) => `${r.platform}:${r.status}`).join(' ');
    console.log(`  ✓ ${u.name} ${summary}`);
  }

  if (demoToken && login.status !== 200) {
    await post(
      '/community',
      {
        title: 'My Google SDE Intern interview experience',
        company: 'Google',
        content:
          'Round 1 was an online test with 2 DSA questions (arrays + graphs). Round 2 and 3 were technical interviews on trees, DP and problem solving. Tip: practice LeetCode mediums daily and explain your approach out loud.',
        tags: ['internship', 'dsa', 'google'],
      },
      demoToken
    );
  }
};

main().catch((err) => console.error('Seeding failed:', err.message));
