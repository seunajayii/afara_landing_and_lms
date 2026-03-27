/**
 * AFÁRÁ Accelerator — Server-Side Test Suite
 * Run: node afara-tester.js
 * Requires: Node.js 18+ (built-in fetch) or Node 16 with node-fetch
 */

const BASE_URL = 'https://afaraaccelerator.org';
const TIMEOUT_MS = 10000;

// ─── TERMINAL COLORS ────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
  bgGreen:  '\x1b[42m',
  bgRed:    '\x1b[41m',
  bgYellow: '\x1b[43m',
};

const ok   = (s) => `${C.green}✓${C.reset} ${s}`;
const fail = (s) => `${C.red}✗${C.reset} ${s}`;
const warn = (s) => `${C.yellow}⚠${C.reset} ${s}`;
const info = (s) => `${C.cyan}→${C.reset} ${s}`;
const dim  = (s) => `${C.gray}${s}${C.reset}`;

// ─── ENDPOINTS TO TEST ──────────────────────────────

const PAGE_ROUTES = [
  { path: '/',                  desc: 'Home page' },
  { path: '/about',             desc: 'About / mission' },
  { path: '/apply',             desc: 'Application form' },
  { path: '/programs',          desc: 'Programs / cohorts' },
  { path: '/contact',           desc: 'Contact page' },
  { path: '/team',              desc: 'Team / leadership' },
  { path: '/alumni',            desc: 'Alumni network' },
  { path: '/blog',              desc: 'News / blog' },
  { path: '/faq',               desc: 'FAQ' },
  { path: '/partners',          desc: 'Partners / sponsors' },
  { path: '/events',            desc: 'Events' },
  { path: '/dashboard',         desc: 'Applicant dashboard (auth-gated)' },
  { path: '/admin',             desc: 'Admin panel (auth-gated)' },
];

const API_ENDPOINTS = [
  { path: '/api/health',                desc: 'Health check',             method: 'GET'  },
  { path: '/api/status',                desc: 'Status endpoint',          method: 'GET'  },
  { path: '/api/applications',          desc: 'List applications',        method: 'GET'  },
  { path: '/api/apply',                 desc: 'Submit application',       method: 'POST' },
  { path: '/api/contact',               desc: 'Submit contact form',      method: 'POST' },
  { path: '/api/programs',              desc: 'Get programs list',        method: 'GET'  },
  { path: '/api/events',                desc: 'Get events list',          method: 'GET'  },
  { path: '/api/newsletter/subscribe',  desc: 'Newsletter subscribe',     method: 'POST' },
  { path: '/api/users',                 desc: 'User management',          method: 'GET'  },
  { path: '/api/cohorts',               desc: 'Cohort data',              method: 'GET'  },
];

const AUTH_ENDPOINTS = [
  { path: '/login',                     desc: 'Login page',               method: 'GET'  },
  { path: '/register',                  desc: 'Register page',            method: 'GET'  },
  { path: '/signup',                    desc: 'Signup page',              method: 'GET'  },
  { path: '/logout',                    desc: 'Logout',                   method: 'GET'  },
  { path: '/forgot-password',           desc: 'Password reset page',      method: 'GET'  },
  { path: '/api/auth/login',            desc: 'Auth: login endpoint',     method: 'POST' },
  { path: '/api/auth/register',         desc: 'Auth: register endpoint',  method: 'POST' },
  { path: '/api/auth/logout',           desc: 'Auth: logout endpoint',    method: 'POST' },
  { path: '/api/auth/me',               desc: 'Auth: current user',       method: 'GET'  },
  { path: '/api/auth/refresh',          desc: 'Auth: token refresh',      method: 'POST' },
  { path: '/api/auth/forgot-password',  desc: 'Auth: password reset',     method: 'POST' },
];

const FORM_SUBMISSIONS = [
  {
    name: 'Contact Form',
    path: '/api/contact',
    method: 'POST',
    body: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is an automated test message. Please ignore.',
    },
  },
  {
    name: 'Newsletter Signup',
    path: '/api/newsletter/subscribe',
    method: 'POST',
    body: { email: 'test@example.com' },
  },
  {
    name: 'Application Submission (empty)',
    path: '/api/apply',
    method: 'POST',
    body: {},
    expectFail: true, // Should return 400/422 for empty body
  },
  {
    name: 'Login (invalid credentials)',
    path: '/api/auth/login',
    method: 'POST',
    body: { email: 'fake@fake.com', password: 'wrongpassword' },
    expectFail: true, // Should return 401
  },
];

// ─── RESULTS TRACKER ─────────────────────────────────
const results = {
  passed: [],
  failed: [],
  warnings: [],
  skipped: [],
};

// ─── FETCH WITH TIMEOUT ──────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── PROBE SINGLE ENDPOINT ───────────────────────────
async function probe(path, method = 'GET', body = null, headers = {}) {
  const url = BASE_URL + path;
  const start = Date.now();

  const opts = {
    method,
    headers: {
      'User-Agent': 'AFARATester/1.0',
      'Accept': 'application/json, text/html, */*',
      ...headers,
    },
    redirect: 'follow',
  };

  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
    opts.headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url, opts);
    const elapsed = Date.now() - start;

    let bodyText = '';
    try {
      bodyText = await res.text();
    } catch {}

    let bodyJson = null;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {}

    return {
      url, method, status: res.status,
      ok: res.ok, elapsed,
      body: bodyJson || bodyText.slice(0, 300),
      headers: Object.fromEntries(res.headers.entries()),
      error: null,
    };
  } catch (e) {
    return {
      url, method, status: null,
      ok: false, elapsed: Date.now() - start,
      body: null, headers: {},
      error: e.name === 'AbortError' ? 'TIMEOUT' : e.message,
    };
  }
}

// ─── DISPLAY RESULT ──────────────────────────────────
function displayResult(label, result, expectFail = false) {
  const statusStr = result.status ? `HTTP ${result.status}` : result.error;
  const timeStr = dim(`${result.elapsed}ms`);

  if (result.error) {
    if (result.error === 'TIMEOUT') {
      console.log(`  ${warn(label)} ${C.yellow}TIMEOUT${C.reset} ${timeStr}`);
      results.warnings.push({ label, result });
    } else {
      console.log(`  ${fail(label)} ${C.red}${result.error}${C.reset} ${timeStr}`);
      results.failed.push({ label, result });
    }
    return;
  }

  if (expectFail && !result.ok) {
    // Expected failure (e.g. 400, 401, 422) — means endpoint EXISTS and validates
    console.log(`  ${ok(label)} ${C.yellow}${statusStr}${C.reset} ${dim('(expected error — endpoint exists)')} ${timeStr}`);
    results.passed.push({ label, result });
    return;
  }

  if (result.ok) {
    console.log(`  ${ok(label)} ${C.green}${statusStr}${C.reset} ${timeStr}`);
    results.passed.push({ label, result });
  } else if ([301, 302, 307, 308].includes(result.status)) {
    console.log(`  ${warn(label)} ${C.yellow}${statusStr}${C.reset} ${dim('(redirect)')} ${timeStr}`);
    results.warnings.push({ label, result });
  } else if (result.status === 401 || result.status === 403) {
    console.log(`  ${warn(label)} ${C.yellow}${statusStr}${C.reset} ${dim('(auth-gated — endpoint exists)')} ${timeStr}`);
    results.warnings.push({ label, result });
  } else if (result.status === 404) {
    console.log(`  ${fail(label)} ${C.red}${statusStr}${C.reset} ${dim('(not found)')} ${timeStr}`);
    results.failed.push({ label, result });
  } else {
    console.log(`  ${fail(label)} ${C.red}${statusStr}${C.reset} ${timeStr}`);
    results.failed.push({ label, result });
  }
}

// ─── SECTION HEADER ──────────────────────────────────
function header(title) {
  const line = '─'.repeat(60);
  console.log(`\n${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}${C.white}  ${title}${C.reset}`);
  console.log(`${C.cyan}${line}${C.reset}`);
}

// ─── MAIN ────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(`\n${C.bold}${C.cyan}  AFÁRÁ ACCELERATOR — SERVER TEST SUITE${C.reset}`);
  console.log(`  ${C.gray}Target: ${BASE_URL}${C.reset}`);
  console.log(`  ${C.gray}Started: ${new Date().toLocaleString()}${C.reset}`);

  // ── 1. PAGE ROUTES ──
  header('01 · PAGE ROUTES');
  for (const route of PAGE_ROUTES) {
    const result = await probe(route.path, 'GET');
    displayResult(`${route.desc} ${dim(route.path)}`, result);
  }

  // ── 2. API ENDPOINTS ──
  header('02 · API ENDPOINTS');
  for (const ep of API_ENDPOINTS) {
    const result = await probe(ep.path, ep.method);
    displayResult(`[${ep.method}] ${ep.desc} ${dim(ep.path)}`, result);
  }

  // ── 3. AUTH ENDPOINTS ──
  header('03 · AUTH FLOWS');
  for (const ep of AUTH_ENDPOINTS) {
    const result = await probe(ep.path, ep.method);
    const isGated = result.status === 401 || result.status === 403;
    displayResult(`[${ep.method}] ${ep.desc} ${dim(ep.path)}`, result);
  }

  // ── 4. FORM SUBMISSIONS ──
  header('04 · FORM SUBMISSIONS');
  for (const form of FORM_SUBMISSIONS) {
    console.log(`  ${info(`Testing: ${form.name}`)}`);
    const result = await probe(form.path, form.method, form.body);
    displayResult(`  ${form.name} ${dim(form.path)}`, result, form.expectFail);

    // Show response preview
    if (result.body && typeof result.body === 'object') {
      console.log(`  ${dim('Response: ' + JSON.stringify(result.body).slice(0, 120))}`);
    }
  }

  // ── 5. SECURITY CHECKS ──
  header('05 · QUICK SECURITY CHECKS');

  // Check for common sensitive paths
  const sensitivePaths = [
    { path: '/.env',         desc: '.env file exposed' },
    { path: '/config.json',  desc: 'config.json exposed' },
    { path: '/api/docs',     desc: 'API docs (Swagger/OpenAPI)' },
    { path: '/api/graphql',  desc: 'GraphQL endpoint' },
    { path: '/graphql',      desc: 'GraphQL (root)' },
    { path: '/wp-admin',     desc: 'WordPress admin (misconfiguration check)' },
    { path: '/robots.txt',   desc: 'robots.txt (reveals paths)' },
    { path: '/sitemap.xml',  desc: 'Sitemap (reveals routes)' },
  ];

  for (const sp of sensitivePaths) {
    const result = await probe(sp.path);
    if (result.ok && ['.env', 'config.json'].some(s => sp.path.includes(s))) {
      console.log(`  ${fail(`⚠ EXPOSED: ${sp.desc} ${dim(sp.path)}`)}`);
      results.failed.push({ label: sp.desc, result });
    } else {
      displayResult(`${sp.desc} ${dim(sp.path)}`, result);
    }
  }

  // ── SUMMARY ──
  const line2 = '═'.repeat(60);
  console.log(`\n${C.bold}${C.white}${line2}${C.reset}`);
  console.log(`${C.bold}  TEST SUMMARY${C.reset}`);
  console.log(`${C.bold}${C.white}${line2}${C.reset}`);

  const total = results.passed.length + results.failed.length + results.warnings.length;
  console.log(`\n  ${C.green}✓ PASSED  ${results.passed.length}${C.reset}`);
  console.log(`  ${C.yellow}⚠ WARNINGS  ${results.warnings.length}${C.reset}  ${dim('(auth-gated, redirect, timeout)')}`);
  console.log(`  ${C.red}✗ FAILED  ${results.failed.length}${C.reset}  ${dim('(404, server error, unreachable)')}`);
  console.log(`  ${dim(`─────────────────`)}`);
  console.log(`  ${C.bold}  TOTAL  ${total}${C.reset}\n`);

  if (results.failed.length > 0) {
    console.log(`${C.red}  Failed endpoints:${C.reset}`);
    results.failed.forEach(r => {
      console.log(`    ${dim('→')} ${r.label}`);
    });
    console.log();
  }

  if (results.warnings.length > 0) {
    console.log(`${C.yellow}  Flagged for review:${C.reset}`);
    results.warnings.forEach(r => {
      console.log(`    ${dim('→')} ${r.label}`);
    });
    console.log();
  }

  console.log(`  ${C.gray}Full report complete. Check output above for details.${C.reset}\n`);
}

main().catch(console.error);
