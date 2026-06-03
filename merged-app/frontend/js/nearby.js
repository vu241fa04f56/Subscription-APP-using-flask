let map = null;
let mapMarkers = [];
let radiusCircle = null;
let userMarker = null;

// Workaround for Leaflet default icon path issues in CDNs
if (typeof L !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Extra mock users placed on the map to demonstrate the "watching" feature.
// Spread across India so they don't stack on top of each other.
const EXTRA_MAP_USERS = [
  { name:'Riya Patel',   city:'Mumbai',    user_id:'u_riya',   location:{ coordinates:[72.8777,  19.0760] } },
  { name:'Arjun Mehta',  city:'Bangalore', user_id:'u_arjun',  location:{ coordinates:[77.5946,  12.9716] } },
  { name:'Priya Singh',  city:'Hyderabad', user_id:'u_priya',  location:{ coordinates:[78.4867,  17.3850] } },
  { name:'Kabir Khan',   city:'Chennai',   user_id:'u_kabir',  location:{ coordinates:[80.2707,  13.0827] } },
  { name:'Nikki Sharma', city:'Kolkata',   user_id:'u_nikki',  location:{ coordinates:[88.3639,  22.5726] } },
  { name:'Dev Verma',    city:'Pune',      user_id:'u_dev',    location:{ coordinates:[73.8567,  18.5204] } },
  { name:'Ananya Rao',   city:'Jaipur',    user_id:'u_ananya', location:{ coordinates:[75.7873,  26.9124] } },
  { name:'Rohan Gupta',  city:'Ahmedabad', user_id:'u_rohan',  location:{ coordinates:[72.5714,  23.0225] } },
];

function initMap() {
  if (map || typeof L === 'undefined') return;
  
  // Center on default world view
  map = L.map('map').setView([20.0, 0.0], 2);
  
  // Snapchat-like warm beautiful Voyager map tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initMap();

  const locBtn = document.getElementById('get-location-btn');
  const radiusInput = document.getElementById('radius-input');
  const globalCheckbox = document.getElementById('global-search-checkbox');
  const sliderWrap = document.getElementById('radius-slider-wrap');

  // Load current user profile to check if they have a saved location
  let currentLat = 28.6139; // default to Delhi
  let currentLng = 77.2090;
  let hasLocation = false;

  try {
    const meRes = await get('/auth/me');
    const meData = await meRes.json();
    if (meData.success && meData.data) {
      const u = meData.data;
      if (u.location && u.location.coordinates && u.location.coordinates.length === 2) {
        currentLng = u.location.coordinates[0];
        currentLat = u.location.coordinates[1];
        hasLocation = true;
        
        const displayEl = document.getElementById('location-display');
        const textEl = document.getElementById('user-city-country');
        if (displayEl && textEl && u.city) {
          textEl.textContent = `${u.city}, ${u.country || ''}`;
          displayEl.classList.remove('hidden');
        }
      }
    }
  } catch (e) {
    console.error('Failed to load user profile', e);
  }

  // Auto-set slider dataset values
  if (radiusInput) {
    radiusInput.dataset.lat = currentLat;
    radiusInput.dataset.lng = currentLng;
  }

  // Load all registered users globally on the map immediately on page load!
  await loadNearby(currentLat, currentLng, 'infinite');

  locBtn?.addEventListener('click', () => {
    locBtn.disabled = true;
    locBtn.textContent = 'Locating...';

    if (!navigator.geolocation) {
      fallbackToIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = null;
        let country = null;

        // Fetch IP details to supplement city/country
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          if (ipData && ipData.city) {
            city = ipData.city;
            country = ipData.country_name;
          }
        } catch (e) {}

        const locResult = await updateLocation(latitude, longitude, city, country);
        if (locResult && locResult.success) {
          const displayEl = document.getElementById('location-display');
          const textEl = document.getElementById('user-city-country');
          if (displayEl && textEl) {
            textEl.textContent = `${locResult.data.city}, ${locResult.data.country}`;
            displayEl.classList.remove('hidden');
          }
        }
        await triggerSearch(latitude, longitude);
        locBtn.disabled = false;
        locBtn.textContent = 'Refresh Location';
      },
      async (err) => {
        showToast('GPS access blocked or failed. Resolving location via IP Geolocation...', 'info');
        await fallbackToIpLocation();
      }
    );
  });

  globalCheckbox?.addEventListener('change', () => {
    if (globalCheckbox.checked) {
      sliderWrap.style.opacity = '0.4';
      sliderWrap.style.pointerEvents = 'none';
    } else {
      sliderWrap.style.opacity = '1';
      sliderWrap.style.pointerEvents = 'auto';
    }
    const lat = parseFloat(radiusInput.dataset.lat);
    const lng = parseFloat(radiusInput.dataset.lng);
    if (lat && lng) triggerSearch(lat, lng);
  });

  radiusInput?.addEventListener('change', () => {
    const lat = parseFloat(radiusInput.dataset.lat);
    const lng = parseFloat(radiusInput.dataset.lng);
    if (lat && lng) triggerSearch(lat, lng);
  });
});

async function fallbackToIpLocation() {
  const locBtn = document.getElementById('get-location-btn');
  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    const ipData = await ipRes.json();
    if (ipData && ipData.latitude && ipData.longitude) {
      const latitude = ipData.latitude;
      const longitude = ipData.longitude;
      const city = ipData.city || 'Unknown';
      const country = ipData.country_name || 'Unknown';

      const locResult = await updateLocation(latitude, longitude, city, country);
      if (locResult && locResult.success) {
        const displayEl = document.getElementById('location-display');
        const textEl = document.getElementById('user-city-country');
        if (displayEl && textEl) {
          textEl.textContent = `${locResult.data.city}, ${locResult.data.country}`;
          displayEl.classList.remove('hidden');
        }
      }
      await triggerSearch(latitude, longitude);
    } else {
      showToast('Could not resolve IP location', 'error');
    }
  } catch (e) {
    showToast('Failed to fetch IP location', 'error');
  } finally {
    if (locBtn) {
      locBtn.disabled = false;
      locBtn.textContent = 'Refresh Location';
    }
  }
}

async function triggerSearch(lat, lng) {
  const radiusInput = document.getElementById('radius-input');
  const globalCheckbox = document.getElementById('global-search-checkbox');
  if (radiusInput) {
    radiusInput.dataset.lat = lat;
    radiusInput.dataset.lng = lng;
  }
  const isGlobal = globalCheckbox?.checked;
  const radius = isGlobal ? 'infinite' : (radiusInput?.value || 50);
  await loadNearby(lat, lng, radius);
}

async function updateLocation(lat, lng, city = null, country = null) {
  try {
    const payload = { latitude: lat, longitude: lng };
    if (city) payload.city = city;
    if (country) payload.country = country;
    const res = await post('/location/update', payload);
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function loadNearby(lat, lng, radius) {
  try {
    const res = await get(`/discover/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    const data = await res.json();
    const container = document.getElementById('nearby-container');
    if (!container) return;

    // Update map view and draw circles/markers
    if (map) {
      if (radius === 'infinite') {
        map.setView([lat, lng], 2);
      } else {
        map.setView([lat, lng], 5);
      }

      // Draw active user glowing marker (Snapchat-style Me)
      if (userMarker) map.removeLayer(userMarker);
      // Try to get the logged-in user's avatar + name from cache
      let meAvatar = '', meName = 'Me';
      try {
        const cached = JSON.parse(localStorage.getItem('user_profile') || '{}');
        meAvatar = cached.avatar || '';
        meName   = cached.name  || 'Me';
        if (/^[a-f0-9]{24}$/.test(meName)) meName = cached.email?.split('@')[0] || 'Me';
      } catch (_) {}
      const meInner = meAvatar
        ? `<img src="${meAvatar}" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="color:#000;font-weight:800;font-size:13px;font-family:var(--font-family,sans-serif);">${meName[0].toUpperCase()}</span>`;

      const userIcon = L.divIcon({
        className: 'snap-marker snap-me-marker',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;width:100px;margin-left:-50px;margin-top:-30px;transition:all 0.25s cubic-bezier(0.175,0.885,0.32,1.275);">
            <div class="avatar-ring" style="width:42px;height:42px;border-radius:50%;border:3px solid #fffc00;box-shadow:0 3px 12px rgba(108,71,255,0.4);overflow:hidden;background:linear-gradient(135deg,#6c47ff,#a855f7);display:flex;align-items:center;justify-content:center;">
              ${meInner}
            </div>
            <div style="margin-top:6px;padding:3px 10px;border-radius:20px;background:#fffc00;color:#000;font-size:10px;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,0.15);white-space:nowrap;border:1px solid rgba(0,0,0,0.05);font-family:var(--font-family,sans-serif);text-align:center;">
              ${meName}
            </div>
          </div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
        .bindPopup(`<strong style="color:#6c47ff;font-family:var(--font-family,sans-serif);">You — ${meName}</strong>`);

      // Draw Radius search circle
      if (radiusCircle) map.removeLayer(radiusCircle);
      if (radius !== 'infinite' && radius > 0) {
        radiusCircle = L.circle([lat, lng], {
          color: '#a855f7',
          fillColor: '#a855f7',
          fillOpacity: 0.08,
          weight: 1.5,
          radius: radius * 1000 // Convert km to meters
        }).addTo(map);
      }

      // Clear existing markers
      mapMarkers.forEach(m => map.removeLayer(m));
      mapMarkers = [];

      // Plot all returned users + extra mock users
      const allMapUsers = [...(data.success && data.data ? data.data : []), ...EXTRA_MAP_USERS];
      if (allMapUsers.length) {
        allMapUsers.forEach(u => {
          const loc = u.location;
          if (loc && loc.coordinates && loc.coordinates.length === 2) {
            const uLng = loc.coordinates[0];
            const uLat = loc.coordinates[1];

            // Calculate and display last seen status on the map popup and snap label
            const showLS = u.show_last_seen !== false;
            let lastSeenText = '';
            let labelText = u.name;   // start with just the name — never append user_id

            if (!showLS) {
              lastSeenText = 'Last seen: Hidden';
              labelText += ' 🙈';
            } else if (!u.last_seen) {
              lastSeenText = 'Offline';
              labelText += ' 💤';
            } else {
              const diffMs = Date.now() - new Date(u.last_seen);
              if (diffMs < 15000) {
                lastSeenText = '<span style="color:#10b981;font-weight:600;">🟢 Online</span>';
                labelText += ' 🟢';
              } else {
                lastSeenText = `Last seen: ${timeAgo(u.last_seen)}`;
                labelText += ' ' + formatCompactTime(u.last_seen);
              }
            }

            // Check if this user is currently watching something
            const watchingInfo = getNowWatchingForUser(u.user_id, u.name);
            const svcColors = { netflix:'#e50914', hotstar:'#1a2d6d', appletv:'#555', hbomax:'#6200b3', prime:'#00a8e0', sonyliv:'#001d82' };
            const svcColor = (watchingInfo && svcColors[watchingInfo.serviceKey]) || '#e50914';

            const watchingBadge = watchingInfo
              ? `<div style="font-size:8px;background:${svcColor};color:#fff;border-radius:3px;padding:1px 5px;font-weight:800;margin-top:2px;max-width:108px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">▶ ${watchingInfo.title}</div>`
              : '';

            // Create Snapchat style divIcon
            const uIcon = L.divIcon({
              className: 'snap-marker',
              html: `
                <div style="display:flex;flex-direction:column;align-items:center;width:110px;margin-left:-55px;margin-top:-30px;transition:all 0.25s cubic-bezier(0.175,0.885,0.32,1.275);">
                  <div class="avatar-ring" style="width:42px;height:42px;border-radius:50%;border:3px solid ${watchingInfo ? svcColor : '#fff'};box-shadow:0 3px 12px rgba(0,0,0,0.25);overflow:hidden;background:linear-gradient(135deg,#6c47ff,#a855f7);display:flex;align-items:center;justify-content:center;">
                    ${u.avatar
                      ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;">`
                      : `<span style="color:#fff;font-weight:800;font-size:15px;font-family:var(--font-family,sans-serif);">${(u.name||'?')[0].toUpperCase()}</span>`}
                  </div>
                  <div style="margin-top:6px;padding:3px 10px;border-radius:20px;background:#fff;color:#111;font-size:10px;font-weight:700;box-shadow:0 3px 8px rgba(0,0,0,0.15);white-space:nowrap;border:1px solid rgba(0,0,0,0.05);font-family:var(--font-family,sans-serif);text-align:center;transform:translateZ(0);">
                    ${labelText}
                  </div>
                  ${watchingBadge}
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            });

            // Build "watching now" block for popup — shows poster + details
            let watchingPopupRow = '';
            if (watchingInfo) {
              const posterHtml = watchingInfo.posterSvg
                ? `<img src="${watchingInfo.posterSvg}" style="width:54px;height:80px;border-radius:6px;object-fit:cover;flex-shrink:0;border:2px solid ${svcColor}33">`
                : `<div style="width:54px;height:80px;border-radius:6px;background:${watchingInfo.color};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:2px solid ${svcColor}33">🎬</div>`;
              watchingPopupRow = `
                <div style="margin:8px 0;padding:8px;background:rgba(0,0,0,0.35);border-radius:10px;border:1px solid ${svcColor}55;text-align:left">
                  <div style="font-size:9px;color:${svcColor};font-weight:800;letter-spacing:0.8px;margin-bottom:6px;text-transform:uppercase">▶ Watching Now</div>
                  <div style="display:flex;gap:8px;align-items:flex-start">
                    ${posterHtml}
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:3px">${watchingInfo.title}</div>
                      <div style="font-size:10px;color:#aaa;margin-bottom:5px">${watchingInfo.genre} · ${watchingInfo.year}</div>
                      <div style="font-size:10px;color:${svcColor};font-weight:700;margin-bottom:6px">${watchingInfo.service}</div>
                      <div style="height:4px;background:rgba(255,255,255,0.12);border-radius:2px">
                        <div style="height:100%;width:${watchingInfo.progress}%;background:${svcColor};border-radius:2px"></div>
                      </div>
                      <div style="font-size:9px;color:#888;margin-top:2px">${watchingInfo.progress}% watched</div>
                    </div>
                  </div>
                </div>`;
            }

            // Add marker for each registered user
            const marker = L.marker([uLat, uLng], { icon: uIcon }).addTo(map);
            marker.bindPopup(`
              <div style="font-family:var(--font-family,sans-serif);font-size:13px;text-align:center;color:#fff;min-width:220px">
                <div style="font-weight:800;margin-bottom:3px;color:#a855f7;font-size:15px">${u.name}</div>
                <div style="margin-bottom:2px;font-size:11px;color:#aaa">📍 ${u.city || 'Nearby'}</div>
                <div style="margin-bottom:6px;font-size:11px;color:#bbb">${lastSeenText}</div>
                ${watchingPopupRow}
                <button style="background:linear-gradient(90deg,#6c47ff,#a855f7);border:none;color:white;font-size:11px;padding:7px 16px;border-radius:14px;cursor:pointer;font-weight:700;box-shadow:0 2px 8px rgba(108,71,255,0.4);width:100%;margin-top:4px" onclick="window.location='/chat.html?user=${u.user_id}'">💬 Message</button>
              </div>
            `, { maxWidth: 260 });
            mapMarkers.push(marker);
          }
        });
      }
    }

    // Sidebar cards — show real API users + extra mock users
    const sidebarUsers = [...(data.success && data.data ? data.data : []), ...EXTRA_MAP_USERS];
    if (sidebarUsers.length === 0) {
      container.innerHTML = '<p class="empty-state">No users found in this range. Try increasing the radius or enabling Global Search.</p>';
      return;
    }

    container.innerHTML = sidebarUsers.map(u => {
      const watchingInfo = getNowWatchingForUser(u.user_id, u.name);
      const svcColors = { netflix:'#e50914', hotstar:'#1a2d6d', appletv:'#555', hbomax:'#6200b3', prime:'#00a8e0', sonyliv:'#001d82' };
      const svcColor = (watchingInfo && svcColors[watchingInfo.serviceKey]) || '#e50914';
      const watchingRow = watchingInfo ? `
        <div style="display:flex;align-items:center;gap:6px;margin:5px 0;padding:5px 8px;background:${svcColor}20;border-radius:7px;border:1px solid ${svcColor}40">
          ${watchingInfo.posterSvg
            ? `<img src="${watchingInfo.posterSvg}" style="width:28px;height:42px;border-radius:3px;object-fit:cover;flex-shrink:0">`
            : `<div style="width:28px;height:42px;border-radius:3px;background:${watchingInfo.color};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🎬</div>`}
          <div style="min-width:0">
            <div style="font-size:10px;color:${svcColor};font-weight:800">▶ Watching</div>
            <div style="font-size:11px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${watchingInfo.title}</div>
            <div style="font-size:9px;color:var(--text-muted)">${watchingInfo.service} · ${watchingInfo.progress}%</div>
          </div>
        </div>` : '';
      return `
      <div class="nearby-card">
        <div class="nearby-avatar">${u.avatar ? `<img src="${u.avatar}" alt="${u.name}">` : `<span>${(u.name||'?')[0]}</span>`}</div>
        <div class="nearby-info">
          <h4>${u.name}</h4>
          <p>${u.city || 'Nearby'}</p>
          ${watchingRow}
          <div class="nearby-tags">${(u.interests||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
          <button class="btn-chat" onclick="window.location='/chat.html?user=${u.user_id}'">Message</button>
        </div>
      </div>`;
    }).join('');
  } catch (e) { showToast('Failed to load nearby users', 'error'); }
}

// Helper: get what a user is currently watching.
// Matching priority: exact user_id → exact full name → first name match.
function getNowWatchingForUser(userId, userName) {
  const watching = window.NOW_WATCHING;
  const movies   = window.ALL_MOVIES;
  if (!movies || !movies.length) return null;

  const SERVICE_LABELS = { netflix:'Netflix', hotstar:'Hotstar', appletv:'Apple TV', hbomax:'HBO Max', prime:'Prime Video', sonyliv:'Sony LIV' };

  let entry = null;
  if (watching && watching.length) {
    const nameLower = (userName || '').toLowerCase().trim();
    entry = watching.find(w =>
      w.user_id === userId ||
      w.name.toLowerCase() === nameLower ||
      w.name.toLowerCase().split(' ')[0] === nameLower.split(' ')[0]
    );
  }

  if (!entry) return null;

  const movie = movies.find(m => m.id === entry.content_id);
  if (!movie) return null;
  return {
    title:      movie.title,
    service:    SERVICE_LABELS[movie.service] || movie.service,
    serviceKey: movie.service,
    progress:   entry.progress,
    color:      movie.color || '#6c47ff',
    genre:      movie.genre || '',
    year:       movie.year || '',
    posterSvg:  window._makePosterSVG ? window._makePosterSVG(movie) : null,
  };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatCompactTime(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}
