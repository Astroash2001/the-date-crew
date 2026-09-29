/**
 * The Date Crew - Pre-Send Profile Gate Server
 * Pure Node.js built-in HTTP server (zero runtime npm dependencies)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEEDED_CLIENT, CANDIDATE_PROFILES } from './data/demo-data.mjs';
import { evaluateCandidateProfile } from './src/rules.mjs';
import { extractPreferences } from './src/ai-gateway.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal .env parser without dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          env[key] = val;
        }
      }
    } catch (err) {
      console.warn('Could not read .env file:', err.message);
    }
  }
  return env;
}

const env = loadEnv();
const PORT = parseInt(env.PORT || '3000', 10);

// In-memory demo state for active session (allows testing confirmation of suggestions)
let currentClient = JSON.parse(JSON.stringify(SEEDED_CLIENT));
let auditLog = [];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Malformed JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    // API Routes
    if (pathname === '/api/client' && req.method === 'GET') {
      return sendJson(res, 200, {
        client: currentClient,
        hasLiveKey: Boolean(env.EXPERIENTIAL_API_KEY && env.EXPERIENTIAL_API_KEY !== 'your_experiential_labs_key_here')
      });
    }

    if (pathname === '/api/candidates' && req.method === 'GET') {
      return sendJson(res, 200, { candidates: CANDIDATE_PROFILES });
    }

    if (pathname === '/api/analyze-feedback' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const feedbackItems = body.feedbackItems || currentClient.past_rejections;
      const result = await extractPreferences({
        feedbackItems,
        env
      });
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/pre-send-check' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const candidateId = body.candidateId;
      const candidate = CANDIDATE_PROFILES.find(c => c.id === candidateId) || body.candidate;

      if (!candidate) {
        return sendJson(res, 400, { error: 'Candidate profile not found' });
      }

      const evaluation = evaluateCandidateProfile(currentClient, candidate);
      return sendJson(res, 200, {
        evaluation,
        candidate,
        clientName: currentClient.name,
        rulesCheckedCount: (currentClient.confirmed_preferences || []).length
      });
    }

    if (pathname === '/api/confirm-suggestion' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const suggestion = body.suggestion;
      if (!suggestion || !suggestion.category) {
        return sendJson(res, 400, { error: 'Invalid suggestion to confirm' });
      }

      // Check if rule already exists in confirmed_preferences
      const existingIdx = currentClient.confirmed_preferences.findIndex(p => p.category === suggestion.category);
      const newPref = {
        id: `pref_${suggestion.category}_${Date.now()}`,
        category: suggestion.category,
        label: suggestion.label || suggestion.category,
        rule: suggestion.normalized_preference,
        polarity: suggestion.polarity || 'must_have',
        hard_soft: suggestion.hard_soft || 'hard',
        source: `Confirmed from client feedback (${suggestion.client_quote_source || 'AI Extraction'})`,
        evidence_snippet: suggestion.evidence_snippet
      };

      if (existingIdx >= 0) {
        currentClient.confirmed_preferences[existingIdx] = {
          ...currentClient.confirmed_preferences[existingIdx],
          ...newPref
        };
      } else {
        currentClient.confirmed_preferences.push(newPref);
      }

      auditLog.push({
        action: 'CONFIRM_PREFERENCE',
        category: suggestion.category,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, {
        success: true,
        message: 'Preference confirmed by matchmaker and added to active rules.',
        confirmed_preferences: currentClient.confirmed_preferences
      });
    }

    if (pathname === '/api/override' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { candidateId, candidateName, rationale, matchmakerName } = body;

      if (!rationale || rationale.trim().length < 5) {
        return sendJson(res, 400, { error: 'A meaningful override rationale (at least 5 characters) is required.' });
      }

      const overrideEntry = {
        id: `override_${Date.now()}`,
        candidateId,
        candidateName,
        matchmakerName: matchmakerName || 'Lead Matchmaker',
        rationale: rationale.trim(),
        timestamp: new Date().toISOString(),
        action: 'MANUAL_OVERRIDE_RECORDED'
      };

      auditLog.push(overrideEntry);

      return sendJson(res, 200, {
        success: true,
        message: 'Override recorded in audit log. No automated email sent; matchmaker retains discretion.',
        overrideEntry
      });
    }

    if (pathname === '/api/reset' && req.method === 'POST') {
      currentClient = JSON.parse(JSON.stringify(SEEDED_CLIENT));
      auditLog = [];
      return sendJson(res, 200, { success: true, client: currentClient });
    }

    // Static file serving from public/ directory
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    
    // Security check: keep within public
    const publicDir = path.join(__dirname, 'public');
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end('Access Denied');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, 'public', 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    const fileContent = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);

  } catch (error) {
    console.error('Server error:', error);
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
});

// Allow importing server for tests or starting directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => {
    console.log(`[The Date Crew] Pre-Send Profile Gate server running on http://localhost:${PORT}`);
    console.log(`[AI Mode]: ${env.EXPERIENTIAL_API_KEY ? 'Experiential Labs configured' : 'Deterministic Demo Fallback active'}`);
  });
}

export { server, env };
