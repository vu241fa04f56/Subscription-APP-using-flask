const API_BASE = 'http://127.0.0.1:5000/api';

function getToken() {
  return localStorage.getItem('access_token');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } else {
      logout();
      return res;
    }
  }
  return res;
}

async function tryRefreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      return true;
    }
  } catch {}
  return false;
}

function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

async function get(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

async function post(endpoint, body) {
  return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

async function put(endpoint, body) {
  return apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

async function del(endpoint, body) {
  const options = { method: 'DELETE' };
  if (body) options.body = JSON.stringify(body);
  return apiFetch(endpoint, options);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function isLoggedIn() {
  return !!localStorage.getItem('access_token');
}

function requireAuth() {
  if (!isLoggedIn()) window.location.href = '/index.html';
}

// ─────────────────────────────────────────────────────────────────────────────
// Global user UI hydration
// Reads user_profile from localStorage and fills every page with the real
// name / avatar / email immediately — no API round-trip needed.
// Works whether this script runs before or after DOMContentLoaded.
// ─────────────────────────────────────────────────────────────────────────────

function _sanitizeName(u) {
  if (!u) return 'User';
  // Never show a raw 24-char MongoDB ObjectId as the name
  if (!u.name || /^[a-f0-9]{24}$/i.test(u.name)) {
    return u.email ? u.email.split('@')[0] : 'User';
  }
  return u.name;
}

// Writes all user data into the DOM.  Safe to call multiple times.
function applyUserToDOM(u) {
  if (!u) return;
  const name = _sanitizeName(u);
  const initial = name[0].toUpperCase();
  const city = [u.city, u.country].filter(Boolean).join(', ') || '—';

  // Text fields
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
  document.querySelectorAll('[data-user-initial]').forEach(el => el.textContent = initial);
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = u.email || '');
  document.querySelectorAll('[data-user-premium]').forEach(el => {
    el.textContent = u.is_premium ? 'Pro' : 'Free';
    el.className   = 'badge ' + (u.is_premium ? 'badge-pro' : 'badge-free');
  });

  // Dashboard-specific IDs
  const emailEl = document.getElementById('uic-email');
  const cityEl  = document.getElementById('uic-city');
  const planEl  = document.getElementById('uic-plan');
  if (emailEl) emailEl.textContent = u.email || '—';
  if (cityEl)  cityEl.textContent  = city;
  if (planEl)  planEl.textContent  = u.is_premium ? 'Pro' : 'Free';

  // Avatar HTML helper
  const avatarHTML = (size, extraStyle) => u.avatar
    ? `<img src="${u.avatar}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${extraStyle||''}">`
    : `<span style="font-size:${size}px;font-weight:800;color:#fff">${initial}</span>`;

  // Sidebar avatars (all pages)
  document.querySelectorAll('.sidebar-avatar').forEach(el => {
    el.innerHTML = avatarHTML(16);
  });

  // Dashboard user-info card avatar
  const uicAvatar = document.getElementById('uic-avatar');
  if (uicAvatar) uicAvatar.innerHTML = avatarHTML(20);

  // Profile page big avatar preview
  const bigPreview = document.querySelector('[data-user-avatar-preview]');
  if (bigPreview) {
    bigPreview.innerHTML = u.avatar
      ? `<img src="${u.avatar}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span id="avatar-initial">${initial}</span>`;
  }
}

// Called once when DOM is ready — reads cache and hydrates immediately
function _hydrateCachedUser() {
  try {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return;
    applyUserToDOM(JSON.parse(raw));
  } catch (_) {}
}

// Handle both "script loads before DOMContentLoaded" and "script loads after"
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _hydrateCachedUser);
} else {
  // DOM already ready (script is at bottom of body)
  _hydrateCachedUser();
}

// Also expose for other scripts to call after they update the cache
window.applyUserToDOM = applyUserToDOM;
