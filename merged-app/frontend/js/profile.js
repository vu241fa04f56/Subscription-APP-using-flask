/* ===== Profile page ===== */

// ── Helpers ──────────────────────────────────────────────────────────────────
function safeName(u) {
  if (!u) return 'User';
  if (!u.name || /^[a-f0-9]{24}$/.test(u.name)) return u.email?.split('@')[0] || 'User';
  return u.name;
}

// Write user data into every element on the page + persist to cache
function applyProfile(u) {
  const name = safeName(u);

  document.getElementById('profile-name').textContent  = name;
  document.getElementById('profile-email').textContent = u.email || u.phone || '';

  const initial = document.getElementById('avatar-initial');
  if (initial) initial.textContent = name[0].toUpperCase();

  const badge = document.getElementById('profile-plan-badge');
  if (badge) {
    badge.textContent = u.is_premium ? 'Pro' : 'Free';
    badge.className   = 'badge ' + (u.is_premium ? 'badge-pro' : 'badge-free');
  }

  // Form fields
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('field-name',      name);
  set('field-age',       u.age);
  set('field-bio',       u.bio);
  set('field-city',      u.city);
  set('field-country',   u.country);
  set('field-interests', (u.interests || []).join(', '));
  set('field-skills',    (u.skills    || []).join(', '));

  const lsEl = document.getElementById('field-show-last-seen');
  if (lsEl) lsEl.checked = u.show_last_seen !== false;

  // Avatar preview
  applyAvatar(u.avatar, name);

  // Photos
  renderPhotos(u.photos || []);

  // Sidebar elements (present via CSS class)
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
  document.querySelectorAll('[data-user-initial]').forEach(el => el.textContent = name[0].toUpperCase());
  document.querySelectorAll('[data-user-premium]').forEach(el => {
    el.textContent = u.is_premium ? 'Pro' : 'Free';
    el.className   = 'badge ' + (u.is_premium ? 'badge-pro' : 'badge-free');
  });
  document.querySelectorAll('.sidebar-avatar').forEach(el => {
    el.innerHTML = u.avatar
      ? `<img src="${u.avatar}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span>${name[0].toUpperCase()}</span>`;
  });
}

// Update just the avatar preview + sidebar
function applyAvatar(avatarUrl, name) {
  const preview = document.getElementById('avatar-preview');
  if (!preview) return;
  if (avatarUrl) {
    preview.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  } else {
    preview.innerHTML = `<span id="avatar-initial">${(name || 'U')[0].toUpperCase()}</span>`;
  }
  // Update sidebar avatars too
  document.querySelectorAll('.sidebar-avatar').forEach(el => {
    el.innerHTML = avatarUrl
      ? `<img src="${avatarUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
      : `<span>${(name || 'U')[0].toUpperCase()}</span>`;
  });
}

// Persist updated user field into the localStorage cache
function patchCache(patch) {
  try {
    const cached = JSON.parse(localStorage.getItem('user_profile') || '{}');
    localStorage.setItem('user_profile', JSON.stringify({ ...cached, ...patch }));
  } catch (_) {}
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  // Step 1: show cached data instantly (no spinner)
  const cached = localStorage.getItem('user_profile');
  if (cached) {
    try { applyProfile(JSON.parse(cached)); } catch (_) {}
  }

  // Step 2: fetch fresh data from API
  try {
    const res  = await get('/auth/me');
    const data = await res.json();
    if (data.success) {
      const u = data.data;
      // Sanitize name
      if (!u.name || /^[a-f0-9]{24}$/.test(u.name)) {
        u.name = u.email?.split('@')[0] || 'User';
      }
      localStorage.setItem('user_profile', JSON.stringify(u));
      applyProfile(u);
    }
  } catch (e) { console.warn('Profile API unavailable:', e); }

  // ── Save profile ────────────────────────────────────────────────────────────
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name:           document.getElementById('field-name').value.trim(),
      age:            document.getElementById('field-age').value ? parseInt(document.getElementById('field-age').value) : null,
      bio:            document.getElementById('field-bio').value.trim(),
      city:           document.getElementById('field-city').value.trim(),
      country:        document.getElementById('field-country').value.trim(),
      interests:      document.getElementById('field-interests').value.split(',').map(s=>s.trim()).filter(Boolean),
      skills:         document.getElementById('field-skills').value.split(',').map(s=>s.trim()).filter(Boolean),
      show_last_seen: document.getElementById('field-show-last-seen').checked,
    };
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const res  = await put('/users/profile', payload);
      const data = await res.json();
      if (data.success) {
        // Merge into cache so name/city/etc persist across pages and refreshes
        patchCache(payload);
        // Re-hydrate all DOM elements with the updated data
        const merged = { ...(JSON.parse(localStorage.getItem('user_profile') || '{}')), ...payload };
        if (typeof applyUserToDOM === 'function') applyUserToDOM(merged);
        // Also update the inline profile-name heading directly
        document.getElementById('profile-name').textContent = safeName(merged);
      }
      showToast(data.message, data.success ? 'success' : 'error');
    } catch { showToast('Network error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Save Changes'; }
  });

  // ── Avatar upload ───────────────────────────────────────────────────────────
  document.getElementById('avatar-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show instant local preview while uploading
    const reader = new FileReader();
    reader.onload = ev => {
      applyAvatar(ev.target.result, safeName(JSON.parse(localStorage.getItem('user_profile') || '{}')));
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const token = localStorage.getItem('access_token');
      const res   = await fetch(`${API_BASE}/users/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.avatar_url) {
        const url = data.data.avatar_url;
        // Persist to cache first so it survives refresh
        patchCache({ avatar: url });
        const cached = JSON.parse(localStorage.getItem('user_profile') || '{}');
        // Update every avatar element on the page
        applyAvatar(url, safeName(cached));
        if (typeof applyUserToDOM === 'function') applyUserToDOM(cached);
        showToast('Avatar updated!', 'success');
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch { showToast('Upload failed', 'error'); }
  });

  // ── Delete account ──────────────────────────────────────────────────────────
  document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete your account? This cannot be undone.')) return;
    try {
      const res  = await del('/users/account');
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('user_profile');
        showToast('Account deleted', 'success');
        setTimeout(logout, 1000);
      } else { showToast(data.message || 'Delete failed', 'error'); }
    } catch { showToast('Network error', 'error'); }
  });

  // ── Photo upload ────────────────────────────────────────────────────────────
  document.getElementById('photo-upload-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const token = localStorage.getItem('access_token');
      const res   = await fetch(`${API_BASE}/users/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.photos) {
        patchCache({ photos: data.data.photos });
        showToast('Photo uploaded!', 'success');
        renderPhotos(data.data.photos);
      } else { showToast(data.message || 'Upload failed', 'error'); }
    } catch { showToast('Network error', 'error'); }
  });
});

// ── Render photo grid ─────────────────────────────────────────────────────────
function renderPhotos(photos) {
  const container = document.getElementById('photos-container');
  if (!container) return;
  if (!photos.length) {
    container.innerHTML = '<p style="grid-column:span 5;color:var(--text-muted);font-size:13px;text-align:center;padding:12px 0">No photos yet</p>';
    return;
  }
  container.innerHTML = photos.map((url, i) => `
    <div style="position:relative;width:100%;padding-top:100%;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
      <img src="${url}" alt="photo ${i+1}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover">
      <button type="button" class="btn-delete-photo" data-url="${url}"
        style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.85);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold">&times;</button>
    </div>`).join('');

  container.querySelectorAll('.btn-delete-photo').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this photo?')) return;
      try {
        const res  = await del('/users/photos', { url: btn.dataset.url });
        const data = await res.json();
        if (data.success) {
          patchCache({ photos: data.data.photos });
          showToast('Photo deleted', 'success');
          renderPhotos(data.data.photos);
        } else { showToast(data.message || 'Failed', 'error'); }
      } catch { showToast('Network error', 'error'); }
    });
  });
}
