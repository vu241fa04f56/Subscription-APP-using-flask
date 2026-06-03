/* ===== Subspace Dashboard v2 ===== */

// ── Mock watch data (replace with real API calls in production) ─────────────
const SERVICE_COLORS = {
  netflix:'#e50914', hotstar:'#1a2d6d', appletv:'#555555',
  hbomax:'#6200b3',  prime:'#00a8e0',   sonyliv:'#001d82',
};
const SERVICE_LABELS = {
  netflix:'Netflix', hotstar:'Hotstar', appletv:'Apple TV',
  hbomax:'HBO Max',  prime:'Prime Video', sonyliv:'Sony LIV',
};

// Currently in-progress shows for the logged-in user
const CURRENTLY_WATCHING = [
  { content_id:'b7',  progress:68, last_watched:'2026-06-03T21:30:00Z' },
  { content_id:'h1',  progress:32, last_watched:'2026-06-02T19:00:00Z' },
  { content_id:'s1',  progress:55, last_watched:'2026-06-01T22:15:00Z' },
];

// Watch history — completed or abandoned
const WATCH_HISTORY = [
  { content_id:'t4',  completed:true,  watched_at:'2026-05-31', rating:5 },
  { content_id:'b9',  completed:true,  watched_at:'2026-05-29', rating:4 },
  { content_id:'h7',  completed:false, watched_at:'2026-05-27', rating:null },
  { content_id:'b3',  completed:true,  watched_at:'2026-05-25', rating:5 },
  { content_id:'c1',  completed:true,  watched_at:'2026-05-22', rating:4 },
  { content_id:'h2',  completed:false, watched_at:'2026-05-20', rating:null },
  { content_id:'b4',  completed:true,  watched_at:'2026-05-18', rating:4 },
];

// Daily watch time in hours (last 7 days, oldest first)
const WATCH_TIME_DATA = {
  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  hours:  [1.5,  2.0,  0.5,  3.0,  2.5,  4.0,  2.0],
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getMovie(id) {
  return (window.ALL_MOVIES || []).find(m => m.id === id);
}

function makePoster(movie, w, h) {
  if (!window._makePosterSVG || !movie) {
    return `<div style="width:${w}px;height:${h}px;background:var(--bg-elevated);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:18px">🎬</div>`;
  }
  return `<img src="${window._makePosterSVG(movie)}" style="width:${w}px;height:${h}px;border-radius:4px;object-fit:cover">`;
}

function svcBadge(service) {
  const c = SERVICE_COLORS[service] || '#6c47ff';
  const l = SERVICE_LABELS[service] || service;
  return `<span class="cw-svc" style="background:${c}">${l}</span>`;
}

function timeAgoShort(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Render currently watching ────────────────────────────────────────────────
function renderCurrentlyWatching() {
  const wrap = document.getElementById('currently-watching-list');
  if (!wrap) return;

  if (!window.ALL_MOVIES) { wrap.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Loading…</div>'; return; }

  const rows = CURRENTLY_WATCHING.map(item => {
    const movie = getMovie(item.content_id);
    if (!movie) return '';
    const svcColor = SERVICE_COLORS[movie.service] || '#6c47ff';
    return `
      <div class="cw-item">
        <div class="cw-poster">${makePoster(movie, 38, 56)}</div>
        <div class="cw-info">
          <div class="cw-title">${movie.title}</div>
          <div class="cw-meta">${movie.genre} · ${movie.year} · ${svcBadge(movie.service)}</div>
          <div class="cw-prog">
            <div class="cw-prog-fill" style="width:${item.progress}%;background:${svcColor}"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:3px">
            <span style="font-size:9px;color:var(--text-muted)">${item.progress}% watched</span>
            <span style="font-size:9px;color:var(--text-muted)">${timeAgoShort(item.last_watched)}</span>
          </div>
        </div>
        <a href="/ott.html" style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:${svcColor}22;border:1px solid ${svcColor}55;display:flex;align-items:center;justify-content:center;font-size:13px;text-decoration:none">▶</a>
      </div>`;
  }).filter(Boolean).join('');

  wrap.innerHTML = rows || '<div style="color:var(--text-muted);font-size:13px;padding:10px 0">Nothing in progress yet.</div>';
}

// ── Render watch history ─────────────────────────────────────────────────────
function renderWatchHistory() {
  const wrap = document.getElementById('watch-history-list');
  const cntEl = document.getElementById('wh-count');
  if (!wrap) return;

  if (!window.ALL_MOVIES) { wrap.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Loading…</div>'; return; }

  const completed = WATCH_HISTORY.filter(i => i.completed).length;
  if (cntEl) cntEl.textContent = `${WATCH_HISTORY.length} titles`;

  const rows = WATCH_HISTORY.map(item => {
    const movie = getMovie(item.content_id);
    if (!movie) return '';
    const svcColor = SERVICE_COLORS[movie.service] || '#6c47ff';
    const stars = item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : '';
    const badge = item.completed
      ? `<span class="wh-badge" style="background:#10b98122;color:#10b981;border:1px solid #10b98144">✓ Done</span>`
      : `<span class="wh-badge" style="background:var(--bg-elevated);color:var(--text-muted);border:1px solid var(--border)">Partial</span>`;
    return `
      <div class="wh-item">
        <div class="wh-poster">${makePoster(movie, 32, 48)}</div>
        <div class="wh-info">
          <div class="wh-title">${movie.title}</div>
          <div class="wh-meta">
            <span style="color:${svcColor};font-weight:700">${SERVICE_LABELS[movie.service]||''}</span>
            ${stars ? `<span style="color:#f59e0b;font-size:9px;margin-left:5px">${stars}</span>` : ''}
            <span style="margin-left:5px">${item.watched_at}</span>
          </div>
        </div>
        ${badge}
      </div>`;
  }).filter(Boolean).join('');

  wrap.innerHTML = rows || '<div style="color:var(--text-muted);font-size:13px;padding:10px 0">No history yet.</div>';
}

// ── Render info tiles ────────────────────────────────────────────────────────
function renderInfoTiles() {
  const totalHours = WATCH_TIME_DATA.hours.reduce((a, b) => a + b, 0).toFixed(1);
  const completed  = WATCH_HISTORY.filter(i => i.completed).length;
  // Calculate streak: count consecutive days from today backwards that have watch time > 0
  const streak = [...WATCH_TIME_DATA.hours].reverse().findIndex(h => h === 0);
  const streakDays = streak === -1 ? WATCH_TIME_DATA.hours.length : streak;

  const twEl = document.getElementById('tile-watch-time');
  const shEl = document.getElementById('tile-shows');
  const stEl = document.getElementById('tile-streak');

  if (twEl) twEl.textContent = totalHours + 'h';
  if (shEl) shEl.textContent = completed;
  if (stEl) stEl.textContent = streakDays + ' 🔥';
}

// ── Render watch-time chart ──────────────────────────────────────────────────
function renderWatchChart() {
  const canvas = document.getElementById('watch-time-chart');
  if (!canvas || !window.Chart) return;

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: WATCH_TIME_DATA.labels,
      datasets: [{
        label: 'Hours watched',
        data: WATCH_TIME_DATA.hours,
        backgroundColor: WATCH_TIME_DATA.hours.map((h, i) =>
          i === WATCH_TIME_DATA.hours.length - 1 ? '#6c47ff' : 'rgba(108,71,255,0.35)'
        ),
        borderColor: '#6c47ff',
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y}h watched`,
          },
          backgroundColor: '#1a1a2e',
          titleColor: '#fff',
          bodyColor: '#a855f7',
          borderColor: '#6c47ff',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 }, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}


// ── JWT decode helper (no library needed — just base64 the payload) ──────────
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (_) { return null; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();

  let currentUser = null;
  let matches = [];
  let currentCardIndex = 0;

  // api.js already hydrated the DOM from cache before DOMContentLoaded.
  // Now fetch fresh data from the server and update.

  // ── Step 2: Fetch real profile from API and update ─────────────────────────
  try {
    const res  = await get('/auth/me');
    const data = await res.json();
    if (data.success) {
      currentUser = data.data;
      // Sanitize: ensure name is never an ObjectId hex string
      if (!currentUser.name || /^[a-f0-9]{24}$/.test(currentUser.name)) {
        currentUser.name = currentUser.email?.split('@')[0] || 'User';
      }
      // Cache it so next load is instant even if backend is slow
      localStorage.setItem('user_profile', JSON.stringify(currentUser));
      applyUserToDOM(currentUser);
    }
  } catch (e) {
    // Backend unreachable — cache was already applied by api.js
    const cached = localStorage.getItem('user_profile');
    if (cached) {
      try { currentUser = JSON.parse(cached); } catch (_) {}
    }
    console.warn('Profile API unavailable, showing cached data.');
  }

  // ── Online users count ─────────────────────────────────────────────────────
  try {
    const r = await get('/users/stats');
    const d = await r.json();
    if (d.success) document.getElementById('stat-online-users').textContent = d.data.online_users ?? '0';
  } catch (_) {}

  // ── Messages count ─────────────────────────────────────────────────────────
  try {
    const r = await get('/chat/conversations');
    const d = await r.json();
    if (d.success) document.getElementById('stat-messages').textContent = d.data.length || '0';
  } catch (_) {}

  // ── Notifications ──────────────────────────────────────────────────────────
  try {
    const r = await get('/notifications/');
    const d = await r.json();
    const badge = document.getElementById('notif-badge');
    if (badge && d.success) {
      const unread = (d.data || []).filter(n => !n.read).length;
      badge.textContent   = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  } catch (_) {}

  // ── Load swipe matches ─────────────────────────────────────────────────────
  async function loadMatches() {
    const radiusInput      = document.getElementById('match-radius-input');
    const globalCheckbox   = document.getElementById('match-global-checkbox');
    const radius = (globalCheckbox && globalCheckbox.checked) ? 'infinite' : (radiusInput ? radiusInput.value : 5000);
    try {
      const r = await get(`/discover/matches?limit=15&radius=${radius}`);
      const d = await r.json();
      if (d.success && d.data.length > 0) {
        matches = d.data;
        document.getElementById('stat-matches').textContent = matches.length + '+';
        renderSwipeCards();
      } else {
        matches = [];
        document.getElementById('stat-matches').textContent = '0';
        showEmptyState();
      }
    } catch (e) { console.error('Matches load error:', e); showEmptyState(); }
  }

  await loadMatches();

  // ── Nearby count ───────────────────────────────────────────────────────────
  try {
    const r = await get('/discover/nearby?lat=28.6139&lng=77.2090&radius=infinite');
    const d = await r.json();
    if (d.success) document.getElementById('stat-nearby').textContent = d.data.length || '0';
  } catch (_) {}

  // ── OTT sections — render immediately, retry if ALL_MOVIES not ready yet ──
  function tryRenderOTT() {
    if (window.ALL_MOVIES && window.ALL_MOVIES.length) {
      renderInfoTiles();
      renderCurrentlyWatching();
      renderWatchHistory();
      renderWatchChart();
    } else {
      // ALL_MOVIES comes from ott.js which is loaded synchronously before this
      // script. If it's not ready in 300ms something is wrong with the load order.
      setTimeout(tryRenderOTT, 50);
    }
  }
  // Call immediately — ott.js sets window.ALL_MOVIES at parse time
  tryRenderOTT();

  // ── Logout ─────────────────────────────────────────────────────────────────
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) post('/auth/logout', { refresh_token: refresh }).catch(() => {});
    logout();
  });

  // ── Swipe card renderer ────────────────────────────────────────────────────
  function renderSwipeCards() {
    const container  = document.getElementById('swiper-container');
    const emptyEl    = document.getElementById('empty-swiper');
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(emptyEl);
    emptyEl.style.display = 'none';

    for (let i = matches.length - 1; i >= 0; i--) {
      const u    = matches[i];
      const card = document.createElement('div');
      card.className    = 'swipe-card';
      card.dataset.index = i;
      card.style.zIndex  = matches.length - i;

      const photos = (u.photos && u.photos.length > 0) ? u.photos : [u.avatar || ''];
      card.dataset.photos      = JSON.stringify(photos);
      card.dataset.photoIndex  = 0;

      const bg = photos[0]
        ? `url('${photos[0]}')`
        : `linear-gradient(135deg, #6c47ff, #a855f7)`;

      card.innerHTML = `
        <div class="card-bg" style="background-image:${bg}"></div>
        <div class="card-progress">
          ${photos.map((_, pi) => `<div class="progress-bar ${pi===0?'active':''}"></div>`).join('')}
        </div>
        <div class="card-gradient"></div>
        <div class="card-info-wrap">
          <div style="display:flex;align-items:baseline;gap:8px">
            <h3 class="card-title">${u.name}</h3>
            ${u.age ? `<span class="card-age">${u.age}</span>` : ''}
          </div>
          <p class="card-location">📍 ${u.city||'Unknown'}${u.country?', '+u.country:''}${u.distance_km!=null?' ('+Math.round(u.distance_km)+' km)':''}</p>
          <p class="card-bio">${u.bio || 'No bio yet.'}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
            <div class="card-score">🔥 ${u.score||80}% Match</div>
            <div style="display:flex;gap:5px">
              ${(u.common_interests||[]).slice(0,2).map(t=>`<span class="card-tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="swipe-indicator like">LIKE</div>
        <div class="swipe-indicator pass">NOPE</div>`;

      container.appendChild(card);
      initCardDrag(card);
      initCardTap(card);
    }

    currentCardIndex = 0;
    toggleSwipeBtns(true);
  }

  function showEmptyState() {
    const el = document.getElementById('empty-swiper');
    if (el) el.style.display = 'flex';
    toggleSwipeBtns(false);
  }

  function toggleSwipeBtns(show) {
    const b = document.getElementById('swipe-buttons');
    if (b) b.style.display = show ? 'flex' : 'none';
  }

  // ── Drag physics ───────────────────────────────────────────────────────────
  function initCardDrag(card) {
    let sx=0, sy=0, cx=0, cy=0, dragging=false;

    const onStart = e => {
      dragging = true;
      sx = e.clientX ?? e.touches[0].clientX;
      sy = e.clientY ?? e.touches[0].clientY;
      card.style.transition = 'none';
    };
    const onMove = e => {
      if (!dragging) return;
      cx = e.clientX ?? e.touches?.[0]?.clientX ?? cx;
      cy = e.clientY ?? e.touches?.[0]?.clientY ?? cy;
      const dx = cx - sx, dy = cy - sy;
      card.style.transform = `translate3d(${dx}px,${dy}px,0) rotate(${dx*0.05}deg)`;
      const like = card.querySelector('.swipe-indicator.like');
      const pass = card.querySelector('.swipe-indicator.pass');
      if (dx > 20)       { like.style.opacity = Math.min(dx/100,.9);  pass.style.opacity = 0; }
      else if (dx < -20) { pass.style.opacity = Math.min(-dx/100,.9); like.style.opacity = 0; }
      else               { like.style.opacity = 0; pass.style.opacity = 0; }
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      const dx = cx - sx;
      if (dx >  130) swipeCard(card, 'like');
      else if (dx < -130) swipeCard(card, 'pass');
      else {
        card.style.transition = 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)';
        card.style.transform  = 'translate3d(0,0,0) rotate(0)';
        card.querySelector('.swipe-indicator.like').style.opacity = 0;
        card.querySelector('.swipe-indicator.pass').style.opacity = 0;
      }
    };

    card.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    card.addEventListener('touchstart', onStart, { passive:true });
    document.addEventListener('touchmove', onMove, { passive:true });
    document.addEventListener('touchend', onEnd);
  }

  // ── Tap to cycle photos ────────────────────────────────────────────────────
  function initCardTap(card) {
    let sx=0, sy=0;
    card.addEventListener('mousedown', e => { sx=e.clientX; sy=e.clientY; });
    card.addEventListener('mouseup',   e => {
      if (Math.abs(e.clientX-sx) > 5 || Math.abs(e.clientY-sy) > 5) return;
      const photos = JSON.parse(card.dataset.photos);
      let pi = parseInt(card.dataset.photoIndex);
      const half = card.offsetWidth / 2;
      const clickX = e.clientX - card.getBoundingClientRect().left;
      pi = clickX > half ? Math.min(pi+1, photos.length-1) : Math.max(pi-1, 0);
      card.dataset.photoIndex = pi;
      card.querySelector('.card-bg').style.backgroundImage = `url('${photos[pi]}')`;
      card.querySelectorAll('.progress-bar').forEach((b,i) => b.classList.toggle('active', i===pi));
    });
  }

  // ── Swipe API call ─────────────────────────────────────────────────────────
  async function swipeCard(card, action) {
    const u = matches[parseInt(card.dataset.index)];
    card.style.transition = 'transform 0.5s ease-in, opacity 0.5s';
    card.style.transform  = `translate3d(${action==='like'?800:-800}px,0,0) rotate(${action==='like'?45:-45}deg)`;
    card.style.opacity    = 0;
    setTimeout(() => card.remove(), 500);

    try {
      const r = await post('/users/swipe', { target_id: u.user_id, action });
      const d = await r.json();
      if (d.success && d.data.is_match) showMatchModal(u, d.data.chat_id);
    } catch (e) { console.error('Swipe error:', e); }

    currentCardIndex++;
    if (currentCardIndex >= matches.length) showEmptyState();
  }

  // ── Match modal ────────────────────────────────────────────────────────────
  function showMatchModal(targetUser, chatId) {
    const modal = document.getElementById('match-modal');
    if (!modal) return;
    document.getElementById('match-modal-subtitle').textContent = `You and ${targetUser.name} matched on Subspace!`;

    const mkAvatar = (u) => {
      if (u && u.avatar) return `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover">`;
      const name = u?.name || '?';
      return `<span style="font-size:28px;font-weight:800;color:#fff">${name[0].toUpperCase()}</span>`;
    };
    document.getElementById('match-modal-avatar-user').innerHTML   = mkAvatar(currentUser);
    document.getElementById('match-modal-avatar-target').innerHTML = mkAvatar(targetUser);

    modal.classList.remove('hidden');
    document.getElementById('match-modal-chat-btn').onclick  = () => { window.location.href = `/chat.html?chat=${chatId}`; };
    document.getElementById('match-modal-close-btn').onclick = () => modal.classList.add('hidden');
  }

  // ── Swipe button listeners ─────────────────────────────────────────────────
  document.getElementById('swipe-btn-pass')?.addEventListener('click', () => {
    const cards = document.querySelectorAll('.swipe-card');
    if (cards.length) swipeCard(cards[cards.length-1], 'pass');
  });
  document.getElementById('swipe-btn-like')?.addEventListener('click', () => {
    const cards = document.querySelectorAll('.swipe-card');
    if (cards.length) swipeCard(cards[cards.length-1], 'like');
  });

  // ── Match range filter ─────────────────────────────────────────────────────
  const rInput   = document.getElementById('match-radius-input');
  const rVal     = document.getElementById('match-radius-value');
  const rWrap    = document.getElementById('match-radius-wrap');
  const rGlobal  = document.getElementById('match-global-checkbox');

  const applyGlobalState = () => {
    const on = rGlobal?.checked;
    if (rWrap)  { rWrap.style.opacity = on ? '0.4' : '1'; rWrap.style.pointerEvents = on ? 'none' : 'auto'; }
    if (rVal)     rVal.textContent = on ? '5000+ km' : `${rInput?.value||5000} km`;
  };

  rInput?.addEventListener('input',  () => { if (rVal) rVal.textContent = `${rInput.value} km`; });
  rInput?.addEventListener('change', loadMatches);
  rGlobal?.addEventListener('change', () => { applyGlobalState(); loadMatches(); });
  applyGlobalState();
});
