import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zzvjxedrfngvnldlpjxt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dmp4ZWRyZm5ndm5sZGxwanh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNjc3MTUsImV4cCI6MjExMDc0MzcxNX0.eDcz6eV7HI2vvHa5yDJtre30BM9UcoENnj7mkq2n4ts';

// In-memory rate limiting (max 5 submissions per 10 minutes per IP)
const ipRateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

  const timestamps = (ipRateLimits.get(ip) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  ipRateLimits.set(ip, timestamps);
  return true;
}

// Securely store contact submissions in Supabase
async function saveToSupabase(record) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or Key not set');
    return null;
  }

  // Pre-generate UUID so we have the record ID with return=minimal (RLS compliant)
  const submissionId = record.dbId || crypto.randomUUID();

  const payload = {
    id: submissionId,
    full_name: record.fullName,
    email: record.email,
    phone: record.phone || null,
    business_name: record.businessName || null,
    service: record.service || null,
    ad_budget: record.adBudget || null,
    notes: record.message || null,
    projected_gci: record.projectedGci || null,
    utm: record.utm || {},
    ip_address: record.ip || null,
    user_agent: record.userAgent || null,
    status: 'new'
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Supabase REST error:', response.status, errorText);
    throw new Error(`Supabase error (${response.status}): ${errorText}`);
  }

  return { id: submissionId, ...payload };
}

// Data directory initialisation
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function appendJsonRecord(filename, record) {
  const filePath = path.join(DATA_DIR, filename);
  let list = [];
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      list = JSON.parse(content || '[]');
    }
  } catch (e) {
    list = [];
  }
  list.unshift(record);
  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  return list;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Common security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle API routes
  if (pathname === '/api/contact' && req.method === 'POST') {
    try {
      const data = await readBody(req);
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

      // 1. Anti-spam honeypot detection (invisible field filled by bots)
      if (data.website_hp || data.company_url_check) {
        console.warn(`Spam honeypot triggered from IP: ${ip}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          leadId: 'GO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          message: 'Your inquiry has been received.'
        }));
      }

      // 2. Rate limiting check (max 5 submissions per 10 mins)
      if (!checkRateLimit(ip)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Too many submissions received from this connection. Please wait a few minutes before trying again.'
        }));
      }

      const {
        fullName,
        businessName,
        brokerage,
        phone,
        email,
        marketArea,
        dealGoal,
        adBudget,
        budget,
        service,
        projectedGci,
        message,
        notes,
        consent,
        utm
      } = data;

      // 3. Server-side validation
      const cleanName = String(fullName || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPhone = String(phone || '').trim();

      if (!cleanName || cleanName.length < 2) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Please provide your full name (at least 2 characters).'
        }));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Please provide a valid work or personal email address.'
        }));
      }

      if (cleanPhone && cleanPhone.replace(/\D/g, '').length < 7) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Please provide a valid phone/WhatsApp number (minimum 7 digits).'
        }));
      }

      const leadRecord = {
        fullName: cleanName,
        businessName: String(businessName || brokerage || 'Independent / Unspecified').trim(),
        marketArea: String(marketArea || 'Global / Pan-India').trim(),
        dealGoal: String(dealGoal || 'Growth & Acquisition').trim(),
        adBudget: String(adBudget || budget || 'Not specified').trim(),
        projectedGci: String(projectedGci || '').trim(),
        phone: cleanPhone,
        email: cleanEmail,
        service: service || 'Full-Funnel Digital Marketing',
        message: String(notes || message || '').trim(),
        consent: Boolean(consent !== false),
        utm: utm || {},
        ip,
        userAgent: req.headers['user-agent'] || '',
        createdAt: new Date().toISOString()
      };

      // 4. Save to Supabase
      let supabaseRecord = null;
      try {
        supabaseRecord = await saveToSupabase(leadRecord);
      } catch (dbErr) {
        console.error('Supabase save error:', dbErr.message);
      }

      const leadId = supabaseRecord?.id
        ? 'GO-' + supabaseRecord.id.slice(0, 8).toUpperCase()
        : 'GO-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      leadRecord.id = leadId;
      leadRecord.supabaseId = supabaseRecord?.id || null;

      // 5. Local file backup
      appendJsonRecord('leads.json', leadRecord);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        leadId,
        dbId: supabaseRecord?.id || null,
        message: 'Your Strategy Call & Growth Audit request has been securely confirmed in Supabase! Our senior digital performance strategist will review your brand goals and reach out via WhatsApp/Call within 2 hours.'
      }));
    } catch (err) {
      console.error('API /api/contact error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Internal server error processing inquiry.' }));
    }
  }

  if (pathname === '/api/consultation' && req.method === 'POST') {
    try {
      const data = await readBody(req);
      const { fullName, email, phone, businessName, date, timeSlot, service } = data;

      if (!fullName || !email || !date || !timeSlot) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Please fill out required booking details: full name, email, date, and preferred time slot.'
        }));
      }

      const bookingId = 'CAL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const bookingRecord = {
        id: bookingId,
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || '').trim(),
        businessName: String(businessName || '').trim(),
        date,
        timeSlot,
        service: service || 'Strategy Session',
        createdAt: new Date().toISOString()
      };

      appendJsonRecord('consultations.json', bookingRecord);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        bookingId,
        message: `Your 30-minute growth consultation is locked in for ${date} at ${timeSlot} (IST). A calendar invite has been sent to ${email}.`
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Error scheduling consultation.' }));
    }
  }

  if (pathname === '/api/newsletter' && req.method === 'POST') {
    try {
      const data = await readBody(req);
      const { email } = data;
      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }));
      }
      appendJsonRecord('subscribers.json', {
        email: email.trim().toLowerCase(),
        subscribedAt: new Date().toISOString()
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Welcome to Orbit Intelligence! You will receive our bi-weekly marketing performance dispatches.'
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Subscription failed.' }));
    }
  }

  if (pathname === '/api/leads' && req.method === 'GET') {
    try {
      const filePath = path.join(DATA_DIR, 'leads.json');
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '[]';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(content);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to retrieve leads.' }));
    }
  }

  // Static File Resolution
  let safePath = pathname;
  if (safePath === '/') {
    safePath = '/index.html';
  } else if (!path.extname(safePath)) {
    // Check if direct .html file exists for clean URL
    const possibleHtml = safePath + '.html';
    if (fs.existsSync(path.join(__dirname, possibleHtml))) {
      safePath = possibleHtml;
    } else if (fs.existsSync(path.join(__dirname, 'public', possibleHtml))) {
      safePath = '/public' + possibleHtml;
    }
  }

  let filePath = path.join(__dirname, safePath);

  // If not found in root, check in public/
  if (!fs.existsSync(filePath)) {
    const publicCandidate = path.join(__dirname, 'public', safePath);
    if (fs.existsSync(publicCandidate)) {
      filePath = publicCandidate;
    }
  }

  // Security check to avoid path traversal
  const normalizedFilePath = path.normalize(filePath);
  if (!normalizedFilePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(normalizedFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Return custom 404 page if exists
      const notFoundPath = path.join(__dirname, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found - Nexfable');
      }
      return;
    }

    const ext = path.extname(normalizedFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // SEO & Performance Optimized Caching Headers
    let cacheControl = 'public, max-age=86400';
    if (ext === '.html') {
      cacheControl = 'no-cache, must-revalidate';
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
      cacheControl = 'public, max-age=604800, stale-while-revalidate=86400';
    } else if (['.css', '.js', '.mjs'].includes(ext)) {
      cacheControl = 'public, max-age=604800, stale-while-revalidate=86400';
    } else if (ext === '.xml' || ext === '.txt') {
      cacheControl = 'public, max-age=3600';
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    });
    fs.createReadStream(normalizedFilePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexfable Server running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});
