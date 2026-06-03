/* ===== Subspace OTT v6 ===== */
(function() {

// Each movie/show has a `service` field so the platform filter works correctly.
const MOVIES = [
  // ── Netflix ──────────────────────────────────────────────────────────────
  { id:'b1',  service:'netflix',  title:"O' Romeo",               type:'movie',  genre:'Romance',   category:'Bollywood', language:'Hindi', year:2026, rating:8.1, duration:'2h 15m',  is_new:true,  is_trending:true,  match_score:88, color:'#7c2d92', description:'A sweeping love story set across two generations in Mumbai.',                cast:['Ranveer Singh','Alia Bhatt'] },
  { id:'b3',  service:'netflix',  title:'The Legend of Udham',     type:'movie',  genre:'Drama',     category:'Bollywood', language:'Hindi', year:2026, rating:9.0, duration:'2h 50m',  is_trending:true,                   match_score:95, color:'#3d2b00', description:'The untold story of freedom fighter Udham Singh.',                       cast:['Vicky Kaushal'] },
  { id:'b7',  service:'netflix',  title:'12th Fail',               type:'movie',  genre:'Drama',     category:'Bollywood', language:'Hindi', year:2024, rating:9.2, duration:'2h 27m',  is_trending:true,                   match_score:96, color:'#1b4332', description:'The inspiring true story of a man who overcame poverty to become an IPS officer.', cast:['Vikrant Massey'] },
  { id:'h1',  service:'netflix',  title:'Spider-Man Noir',         type:'series', genre:'Action',    category:'Hollywood',               year:2026, rating:8.8, seasons_count:1, is_new:true, is_trending:true, match_score:93, color:'#0c0c1a', description:'Peter Parker navigates 1930s New York as a pulp-noir Spider-Man.', cast:['Nicolas Cage'], episodes:[{title:'Into the Dark',duration:'52m'},{title:'Web of Lies',duration:'48m'}] },
  { id:'h7',  service:'netflix',  title:'The Last Algorithm',      type:'series', genre:'Thriller',  category:'Hollywood',               year:2023, rating:9.3, seasons_count:1, is_trending:true,            match_score:96, color:'#1e0533', description:'A rogue AI predicts crimes before they happen.',                        cast:['Rajan Nair','Sofia Alves'], episodes:[{title:'Prediction Zero',duration:'58m'},{title:'False Positive',duration:'51m'}] },
  { id:'s1',  service:'netflix',  title:'Stellar Drift',           type:'series', genre:'Sci-Fi',    category:'Hollywood',               year:2024, rating:9.1, seasons_count:3, is_trending:true, is_new:true, match_score:94, color:'#0a0e27', description:'Astronauts discover a mysterious signal at the edge of the solar system.', cast:['Maya Chen','Arjun Sharma'], episodes:[{title:'Pilot',duration:'52m'},{title:'The Signal',duration:'48m'},{title:'First Contact',duration:'55m'}] },
  { id:'t1',  service:'netflix',  title:'Obsess',                  type:'movie',  genre:'Horror',    category:'Hollywood',               year:2025, rating:8.2, duration:'1h 48m',  is_new:true, is_trending:true, match_score:83, color:'#0d0d0d', description:"A true-crime podcaster's obsession may have manifested a serial killer.", cast:['Florence Pugh'] },

  // ── Hotstar ───────────────────────────────────────────────────────────────
  { id:'b2',  service:'hotstar',  title:'Subedaar',                type:'movie',  genre:'Action',    category:'Bollywood', language:'Hindi', year:2026, rating:8.4, duration:'2h 28m',  is_new:true, is_trending:true,  match_score:90, color:'#1e3a5f', description:'A retired army officer forced back into action.',                       cast:['Ajay Devgn','Raashii Khanna'] },
  { id:'b8',  service:'hotstar',  title:'Fighter',                 type:'movie',  genre:'Action',    category:'Bollywood', language:'Hindi', year:2024, rating:8.0, duration:'2h 46m',  is_new:true,                    match_score:83, color:'#1e293b', description:"India's finest air warriors take on a deadly enemy.",                  cast:['Hrithik Roshan','Deepika Padukone'] },
  { id:'b9',  service:'hotstar',  title:'Animal',                  type:'movie',  genre:'Action',    category:'Bollywood', language:'Hindi', year:2023, rating:8.1, duration:'3h 21m',  is_trending:true,                match_score:85, color:'#450a0a', description:'A son returns home to protect his empire by any means necessary.',     cast:['Ranbir Kapoor','Rashmika Mandanna'] },
  { id:'h4',  service:'hotstar',  title:'Apex Rising',             type:'series', genre:'Action',    category:'Hollywood',               year:2024, rating:8.5, seasons_count:4, is_trending:true,            match_score:85, color:'#0a192f', description:'Elite covert operatives in the grey zones of global conflict.',       cast:['Marcus Webb','Zara Hassan'], episodes:[{title:'Extraction',duration:'50m'},{title:'Burn Notice',duration:'48m'}] },
  { id:'s4',  service:'hotstar',  title:'Spice Route',             type:'series', genre:'Drama',     category:'Bollywood', language:'Hindi', year:2024, rating:9.0, seasons_count:1, is_trending:true,            match_score:93, color:'#3d1a00', description:'Rare spices from remote farms to Michelin-starred kitchens worldwide.', cast:['Narrator: Arun Das'], episodes:[{title:'Saffron',duration:'44m'},{title:'Vanilla',duration:'42m'}] },

  // ── Apple TV ──────────────────────────────────────────────────────────────
  { id:'h2',  service:'appletv',  title:'In the Grey',             type:'movie',  genre:'Thriller',  category:'Hollywood',               year:2026, rating:8.5, duration:'2h 10m',  is_trending:true,                   match_score:89, color:'#1c1c2e', description:'A CIA operative races to prevent a world-altering assassination.',     cast:['Ryan Gosling','Ana de Armas'] },
  { id:'s2',  service:'appletv',  title:'Warp Factor',             type:'series', genre:'Sci-Fi',    category:'Hollywood',               year:2024, rating:8.7, seasons_count:2, is_new:true,              match_score:89, color:'#001a33', description:"Earth's first FTL mission encounters an entity that shouldn't exist.",  cast:['Yuki Tanaka','Raj Patel'], episodes:[{title:'Ignition',duration:'50m'},{title:'Anomaly',duration:'48m'}] },
  { id:'s3',  service:'appletv',  title:'Parallel Hearts',         type:'series', genre:'Drama',     category:'Hollywood',               year:2024, rating:8.6, seasons_count:2, is_new:true,              match_score:87, color:'#1a0a2e', description:'Two timelines tracing the ripple of one decision across three generations.', cast:['Deepa Reddy','Suresh Kumar'], episodes:[{title:'1987',duration:'52m'},{title:'2024',duration:'49m'}] },
  { id:'s5',  service:'appletv',  title:'Deep Blue Silence',       type:'movie',  genre:'Drama',     category:'Hollywood',               year:2023, rating:8.8, duration:'2h 5m',                           match_score:79, color:'#001a4d', description:'A marine biologist receives transmissions from an abandoned submarine.', cast:['Camille Martin'] },

  // ── HBO Max ───────────────────────────────────────────────────────────────
  { id:'h3',  service:'hbomax',   title:'Crimson Verdict',         type:'movie',  genre:'Thriller',  category:'Hollywood',               year:2024, rating:8.7, duration:'2h 14m',  is_trending:true,                   match_score:88, color:'#3b0000', description:'A defense attorney chooses between her client and the truth.',          cast:['Priya Mehta','Samuel Ford'] },
  { id:'h5',  service:'hbomax',   title:'Neon Labyrinth',          type:'movie',  genre:'Sci-Fi',    category:'Hollywood',               year:2023, rating:8.3, duration:'1h 52m',                              match_score:80, color:'#2d1b69', description:"In a city where memories can be sold, a thief carries someone else's past.", cast:['Lyla Storm','Chen Wei'] },
  { id:'s6',  service:'hbomax',   title:'Quiet Hours',             type:'series', genre:'Drama',     category:'Hollywood',               year:2023, rating:8.4, seasons_count:2,                            match_score:78, color:'#1a1a1a', description:'A grief counsellor questions her own trauma while helping others heal.', cast:['Nina Cross'], episodes:[{title:'First Session',duration:'44m'},{title:'Reopen',duration:'42m'}] },
  { id:'c3',  service:'hbomax',   title:'Laugh Factory',           type:'series', genre:'Comedy',    category:'Hollywood',               year:2024, rating:8.0, seasons_count:3,                            match_score:76, color:'#1a1400', description:"Behind the scenes of a failing comedy club and its owner's desperate schemes.", cast:['Danny Okafor'], episodes:[{title:'Opening Night',duration:'30m'},{title:'The Heckler',duration:'28m'}] },

  // ── Prime Video ───────────────────────────────────────────────────────────
  { id:'b10', service:'prime',    title:'Jawan',                   type:'movie',  genre:'Action',    category:'Bollywood', language:'Hindi', year:2023, rating:7.8, duration:'2h 49m',  is_trending:true,                match_score:82, color:'#052e16', description:'A man driven by a personal cause masterminds a series of audacious heists.', cast:['Shah Rukh Khan','Nayanthara'] },
  { id:'b6',  service:'prime',    title:'Dunki',                   type:'movie',  genre:'Comedy',    category:'Bollywood', language:'Hindi', year:2024, rating:7.9, duration:'2h 35m',                          match_score:80, color:'#4a1942', description:'A group of friends risk everything to illegally immigrate abroad.',    cast:['Shah Rukh Khan','Taapsee Pannu'] },
  { id:'h6',  service:'prime',    title:'Ghost Protocol: Reborn',  type:'movie',  genre:'Action',    category:'Hollywood',               year:2024, rating:8.4, duration:'2h 22m',  is_new:true,                    match_score:84, color:'#111827', description:'A presumed-dead operative returns with no memory of a classified mission.', cast:['Alex Stone','Mira Kazan'] },
  { id:'h8',  service:'prime',    title:'Iron Meridian',           type:'movie',  genre:'Action',    category:'Hollywood',               year:2024, rating:8.6, duration:'2h 8m',   is_new:true,                    match_score:86, color:'#1c2833', description:'A retired soldier pulled back to protect her village.',                cast:['Sana Mirza','Aryan Kapoor'] },
  { id:'c4',  service:'prime',    title:'The Sweetest Con',        type:'movie',  genre:'Comedy',    category:'Hollywood',               year:2024, rating:7.9, duration:'1h 45m',                              match_score:74, color:'#2d1b00', description:'A small-town baker accidentally fronts an elaborate heist.',              cast:['Bella Ortiz','James Liu'] },

  // ── Sony LIV ──────────────────────────────────────────────────────────────
  { id:'b4',  service:'sonyliv',  title:'Kara',                    type:'movie',  genre:'Thriller',  category:'Bollywood', language:'Hindi', year:2025, rating:8.3, duration:'2h 5m',   is_trending:true,               match_score:84, color:'#1a1a2e', description:'A detective uncovers a conspiracy buried deep within the corridors of power.', cast:['Tabu','Pankaj Tripathi'] },
  { id:'b5',  service:'sonyliv',  title:'Off Campus',              type:'series', genre:'Drama',     category:'Bollywood', language:'Hindi', year:2025, rating:8.6, seasons_count:2, is_new:true,              match_score:87, color:'#0f3460', description:'Four college friends navigate love, ambition, and betrayal.',           cast:['Ishaan Khatter'], episodes:[{title:'First Day',duration:'42m'},{title:'The Bet',duration:'40m'}] },
  { id:'t3',  service:'sonyliv',  title:'The Kashmir Files II',    type:'movie',  genre:'Drama',     category:'Bollywood', language:'Hindi', year:2026, rating:8.9, duration:'2h 42m',  is_new:true, is_trending:true, match_score:92, color:'#1a0a00', description:'A powerful sequel continuing the untold stories of the Kashmir exodus.', cast:['Mithun Chakraborty','Pallavi Joshi'] },
  { id:'t4',  service:'sonyliv',  title:'Sector 36',               type:'movie',  genre:'Thriller',  category:'Bollywood', language:'Hindi', year:2024, rating:8.6, duration:'1h 55m',  is_trending:true,               match_score:89, color:'#0d0d0d', description:'A haunting crime thriller based on a real serial killer case in Delhi.', cast:['Vikrant Massey','Deepak Dobriyal'] },
  { id:'c1',  service:'sonyliv',  title:'Seoul Bloom',             type:'series', genre:'Romance',   category:'Hollywood',               year:2024, rating:8.9, seasons_count:2, is_new:true,              match_score:91, color:'#3d0026', description:'Two rival chefs fall in love while unknowingly competing in the same event.', cast:['Ji-won Park','Hyun-soo Lee'], episodes:[{title:'Kitchen Wars',duration:'46m'},{title:'Secret Ingredient',duration:'44m'}] },
  { id:'c2',  service:'sonyliv',  title:'Monsoon Wedding Crashers',type:'movie',  genre:'Comedy',    category:'Bollywood', language:'Hindi', year:2024, rating:8.2, duration:'1h 58m',  is_new:true,                    match_score:82, color:'#1a3300', description:'Three cousins accidentally RSVP to the wrong wedding.',               cast:['Ananya Rao','Kabir Singh'] },
  { id:'c5',  service:'sonyliv',  title:'Love in Ladakh',          type:'movie',  genre:'Romance',   category:'Bollywood', language:'Hindi', year:2025, rating:8.3, duration:'2h 10m',  is_new:true,                    match_score:86, color:'#001433', description:'Two strangers stranded by a blizzard in Ladakh discover what matters.',  cast:['Siddhant Chaturvedi'] },
  { id:'a1',  service:'sonyliv',  title:'Karna: The Unsung Hero',  type:'movie',  genre:'Animation', category:'Bollywood', language:'Hindi', year:2025, rating:8.8, duration:'1h 55m',  is_new:true,                    match_score:91, color:'#2d1a00', description:"An animated retelling of Karna's journey from the Mahabharata.",      cast:['Voice: Manoj Bajpayee'] },
  { id:'a2',  service:'sonyliv',  title:'Cyber Samurai',           type:'series', genre:'Animation', category:'Hollywood',               year:2024, rating:8.5, seasons_count:2, is_new:true,              match_score:87, color:'#00001a', description:'In Neo-Tokyo 2099, a lone samurai fights an AI empire.',              cast:['Voice Cast'], episodes:[{title:'Boot Sequence',duration:'28m'},{title:'Firewall',duration:'26m'}] },
  { id:'t2',  service:'sonyliv',  title:'Return of the Jungle',    type:'movie',  genre:'Animation', category:'Hollywood',               year:2025, rating:7.8, duration:'1h 32m',  is_new:true,                    match_score:75, color:'#0a2e0a', description:'A family of jungle animals reclaim their home from developers.',       cast:['Voice Cast'] },
];

// Service display metadata
const SERVICE_META = {
  all:      { label:'All Services',   color:'#6c47ff', icon:'▶' },
  netflix:  { label:'Netflix',        color:'#e50914', icon:'N' },
  hotstar:  { label:'Hotstar',        color:'#1a2d6d', icon:'⭐' },
  appletv:  { label:'Apple TV',       color:'#555',    icon:'📺' },
  hbomax:   { label:'HBO Max',        color:'#6200b3', icon:'M' },
  prime:    { label:'Prime Video',    color:'#00a8e0', icon:'P' },
  sonyliv:  { label:'Sony LIV',       color:'#001d82', icon:'S' },
};


// Simulated "currently watching" data — matched by user name.
// Add an entry here for every user you want to show as watching on the map.
const NOW_WATCHING = [
  // Seeded DB users
  { user_id:'u_john',   name:'John Doe',      content_id:'b7',  progress:68 },  // 12th Fail · Netflix
  { user_id:'u_jane',   name:'Jane Smith',    content_id:'h1',  progress:32 },  // Spider-Man Noir · Netflix
  // Extra mock map users (matched by name from EXTRA_MAP_USERS below)
  { user_id:'u_riya',   name:'Riya Patel',    content_id:'b9',  progress:51 },  // Animal · Hotstar
  { user_id:'u_arjun',  name:'Arjun Mehta',   content_id:'t4',  progress:77 },  // Sector 36 · Sony LIV
  { user_id:'u_priya',  name:'Priya Singh',   content_id:'s1',  progress:22 },  // Stellar Drift · Netflix
  { user_id:'u_kabir',  name:'Kabir Khan',    content_id:'h7',  progress:89 },  // The Last Algorithm · Netflix
  { user_id:'u_nikki',  name:'Nikki Sharma',  content_id:'b3',  progress:44 },  // Legend of Udham · Netflix
  { user_id:'u_dev',    name:'Dev Verma',     content_id:'c5',  progress:15 },  // Love in Ladakh · Sony LIV
  { user_id:'u_ananya', name:'Ananya Rao',    content_id:'b4',  progress:60 },  // Kara · Sony LIV
  { user_id:'u_rohan',  name:'Rohan Gupta',   content_id:'h2',  progress:38 },  // In the Grey · Apple TV
];

// Build a lookup: content_id → list of watchers
function buildWatcherMap(movies) {
  const map = {};
  NOW_WATCHING.forEach(w => {
    const movie = movies.find(m => m.id === w.content_id);
    if (!movie) return;
    if (!map[w.content_id]) map[w.content_id] = [];
    map[w.content_id].push({ ...w, movieTitle: movie.title, service: movie.service });
  });
  return map;
}

// Expose NOW_WATCHING globally so nearby.js can read it
window.NOW_WATCHING = NOW_WATCHING;
window.ALL_MOVIES   = MOVIES;
// Expose poster generator so nearby.js can render movie thumbnails in map popups
window._makePosterSVG = makePosterSVG;

// Generate SVG poster thumbnail inline
function makePosterSVG(item) {
  const bg = item.color || '#1a1a2e';
  const title = item.title.length > 14 ? item.title.substring(0,13)+'…' : item.title;
  const genreIcons = { drama:'🎭', action:'💥', comedy:'😂', thriller:'🔪', 'sci-fi':'🚀', romance:'💕', horror:'👻', animation:'🎨', default:'🎬' };
  const icon = genreIcons[(item.genre||'').toLowerCase()] || genreIcons.default;
  const year = item.year || '2024';
  const lang = item.language ? item.language : (item.category || '');

  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg}"/>
      <stop offset="100%" style="stop-color:#000010"/>
    </linearGradient>
    <linearGradient id="ov" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0)"/>
      <stop offset="70%" style="stop-color:rgba(0,0,0,0.7)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.95)"/>
    </linearGradient>
  </defs>
  <rect width="120" height="180" fill="url(#g)"/>
  <text x="60" y="90" font-size="42" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <rect width="120" height="180" fill="url(#ov)"/>
  <text x="8" y="152" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white">${title}</text>
  <text x="8" y="168" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.6)">${year} · ${lang}</text>
</svg>`)}`;
}


document.addEventListener('DOMContentLoaded', function() {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    window.location.href = '/index.html';
    return;
  }

  let allContent   = [...MOVIES];
  let watchlist    = new Set(JSON.parse(localStorage.getItem('ott_watchlist') || '[]'));
  let activeFilter = 'trending';
  let activeService = 'all';        // <-- tracks the selected platform
  let activeGenre   = 'all';        // <-- tracks the selected genre tag
  let currentModalItem = null;
  let watcherMap   = buildWatcherMap(allContent);

  // Load user (non-blocking)
  if (typeof get === 'function') {
    get('/auth/me').then(r=>r.json()).then(d=>{
      if (!d.success) return;
      const u = d.data;
      document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=u.name||'User');
      document.querySelectorAll('[data-user-initial]').forEach(el=>el.textContent=(u.name||'U')[0].toUpperCase());
      document.querySelectorAll('[data-user-premium]').forEach(el=>{
        el.textContent=u.is_premium?'Pro':'Free';
        el.className='badge '+(u.is_premium?'badge-pro':'badge-free');
      });
    }).catch(()=>{});

    // Try API upgrade silently
    get('/ott/content').then(r=>r.json()).then(d=>{
      if(d.success && d.data && d.data.length>5){
        allContent=d.data;
        watcherMap = buildWatcherMap(allContent);
        window.ALL_MOVIES = allContent;
        renderAll();
      }
    }).catch(()=>{});
    get('/ott/watchlist').then(r=>r.json()).then(d=>{
      if(d.success){ watchlist=new Set(d.data.map(i=>i.content_id||i._id||i.id)); renderAll(); }
    }).catch(()=>{});
  }

  function saveWL() { localStorage.setItem('ott_watchlist', JSON.stringify([...watchlist])); }

  async function toggleWL(item, e) {
    if(e){ e.stopPropagation(); e.preventDefault(); }
    const id = item._id||item.id;
    const was = watchlist.has(id);
    if(was){ watchlist.delete(id); try{ await del('/ott/watchlist/'+id); }catch(_){} }
    else   { watchlist.add(id);    try{ await post('/ott/watchlist',{content_id:id}); }catch(_){} }
    saveWL();
    document.querySelectorAll('.mc-wl[data-id="'+id+'"]').forEach(btn=>{
      const now=watchlist.has(id);
      btn.classList.toggle('in-list',now);
      btn.textContent=now?'✓':'+';
    });
    if(currentModalItem&&(currentModalItem._id||currentModalItem.id)===id) refreshModalWL();
  }

  // Returns watchers for a given content id
  function getWatchers(id) { return watcherMap[id] || []; }

  function makeCard(item) {
    const id = item._id||item.id;
    const inList = watchlist.has(id);
    const badge = item.language
      ? `<span class="mc-badge mc-badge-lang">${item.language}</span>`
      : item.is_new ? `<span class="mc-badge mc-badge-new">NEW</span>`
      : item.is_trending ? `<span class="mc-badge mc-badge-hot">HOT</span>` : '';

    // Watching avatars strip
    const watchers = getWatchers(id);
    let watchingStrip = '';
    if (watchers.length) {
      const avatars = watchers.slice(0,3).map(w=>
        `<div title="${w.name} is watching" style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#6c47ff,#a855f7);border:1.5px solid var(--bg-card);display:inline-flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:800;margin-right:-4px">${w.name[0]}</div>`
      ).join('');
      watchingStrip = `<div style="display:flex;align-items:center;gap:3px;margin-top:3px">${avatars}<span style="font-size:9px;color:var(--text-muted);margin-left:6px">${watchers.length} watching</span></div>`;
    }

    const card = document.createElement('div');
    card.className = 'mc';
    card.innerHTML = `
      <div class="mc-poster">
        <img src="${makePosterSVG(item)}" alt="${item.title}" loading="lazy"/>
        ${badge}
        <div class="mc-hover">
          <div class="mc-play">▶</div>
        </div>
        <button class="mc-wl ${inList?'in-list':''}" data-id="${id}">${inList?'✓':'+'}</button>
      </div>
      <div class="mc-title">${item.title}</div>
      <div class="mc-sub">${item.year||'2024'} · ${item.type==='series'?'Series':'Movie'}</div>
      ${watchingStrip}`;

    card.querySelector('.mc-poster').addEventListener('click', ()=>openModal(item));
    card.querySelector('.mc-wl').addEventListener('click', e=>toggleWL(item,e));
    return card;
  }


  function makeRow(title, items, filterKey) {
    if(!items.length) return null;
    const sec = document.createElement('div');
    sec.className='ott-sec';
    const seeAll = filterKey ? `<span class="ott-see-all" data-f="${filterKey}">All ›</span>` : '';
    sec.innerHTML=`<div class="ott-sec-hdr"><span class="ott-sec-ttl">${title}</span>${seeAll}</div><div class="ott-row"></div>`;
    items.forEach(item=>sec.querySelector('.ott-row').appendChild(makeCard(item)));
    sec.querySelector('.ott-see-all')?.addEventListener('click', e=>setFilter(e.target.dataset.f));
    return sec;
  }

  // ── "Currently Watching" section shown at the top ────────────────────────
  function makeWatchingNowSection() {
    const watching = NOW_WATCHING.map(w => {
      const movie = allContent.find(m => m.id === w.content_id);
      return movie ? { ...w, movie } : null;
    }).filter(Boolean);

    if (!watching.length) return null;

    const sec = document.createElement('div');
    sec.className = 'ott-sec';
    sec.innerHTML = `<div class="ott-sec-hdr"><span class="ott-sec-ttl">👥 Friends Watching Now</span></div><div class="ott-row" id="watching-now-row"></div>`;
    const row = sec.querySelector('#watching-now-row');

    watching.forEach(w => {
      const card = document.createElement('div');
      card.className = 'mc';
      card.style.cssText = 'position:relative';
      const svcColor = SERVICE_META[w.movie.service]?.color || '#6c47ff';
      card.innerHTML = `
        <div class="mc-poster" style="cursor:pointer;border:2px solid ${svcColor}33">
          <img src="${makePosterSVG(w.movie)}" alt="${w.movie.title}" loading="lazy"/>
          <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.9));padding:6px 5px 5px">
            <div style="display:flex;align-items:center;gap:4px">
              <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6c47ff,#a855f7);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:800;flex-shrink:0">${w.name[0]}</div>
              <span style="font-size:9px;color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.name.split(' ')[0]}</span>
            </div>
            <div style="height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:4px">
              <div style="height:100%;width:${w.progress}%;background:${svcColor};border-radius:2px"></div>
            </div>
          </div>
          <div class="mc-hover"><div class="mc-play">▶</div></div>
        </div>
        <div class="mc-title">${w.movie.title}</div>
        <div class="mc-sub" style="color:${svcColor}">${SERVICE_META[w.movie.service]?.label || w.movie.service}</div>`;
      card.querySelector('.mc-poster').addEventListener('click', ()=>openModal(w.movie));
      row.appendChild(card);
    });
    return sec;
  }

  function renderAll() {
    const wrap = document.getElementById('ott-sections');
    if(!wrap) return;
    wrap.innerHTML='';

    // Apply service filter first, then genre/category filter
    let items = [...allContent];
    if (activeService !== 'all') {
      items = items.filter(c => c.service === activeService);
    }
    if (activeGenre !== 'all') {
      items = items.filter(c => (c.genre||'').toLowerCase() === activeGenre);
    }

    if(activeFilter==='movie')   items=items.filter(c=>c.type==='movie');
    else if(activeFilter==='series') items=items.filter(c=>c.type==='series');
    else if(!['trending','bollywood','hollywood'].includes(activeFilter))
      items=items.filter(c=>(c.genre||'').toLowerCase()===activeFilter||(c.category||'').toLowerCase()===activeFilter);

    if(!items.length){
      wrap.innerHTML='<div style="padding:60px 20px;text-align:center;color:var(--text-muted)">Nothing found for this filter.</div>';
      return;
    }

    // Show "Friends Watching Now" at the very top when on trending/service view
    if (activeFilter === 'trending') {
      const watchNow = makeWatchingNowSection();
      if (watchNow) wrap.appendChild(watchNow);
    }

    if(activeFilter!=='trending'){
      const svcLabel = activeService !== 'all' ? ` · ${SERVICE_META[activeService]?.label}` : '';
      const sec=makeRow(`All — ${activeFilter.charAt(0).toUpperCase()+activeFilter.slice(1)}${svcLabel}`, items);
      if(sec) wrap.appendChild(sec);
      return;
    }

    const rows=[
      makeRow('🔥 Trending Now', items.filter(c=>c.is_trending), 'trending'),
      makeRow('🆕 New Releases',  items.filter(c=>c.is_new),     'movie'),
      makeRow('🎬 Bollywood',     items.filter(c=>(c.category||'').toLowerCase()==='bollywood'), 'bollywood'),
      makeRow('🌟 Hollywood',     items.filter(c=>(c.category||'').toLowerCase()==='hollywood'), 'hollywood'),
      makeRow('⭐ Top Rated',     [...items].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,10)),
      makeRow('✨ Recommended',   items.filter(c=>c.match_score>=88)),
      makeRow('💥 Action',        items.filter(c=>(c.genre||'').toLowerCase()==='action'), 'action'),
      makeRow('🎭 Drama',         items.filter(c=>(c.genre||'').toLowerCase()==='drama'), 'drama'),
      makeRow('😂 Comedy',        items.filter(c=>(c.genre||'').toLowerCase()==='comedy'), 'comedy'),
      makeRow('🔪 Thriller',      items.filter(c=>(c.genre||'').toLowerCase()==='thriller'), 'thriller'),
      makeRow('🚀 Sci-Fi',        items.filter(c=>(c.genre||'').toLowerCase()==='sci-fi'), 'sci-fi'),
      makeRow('💕 Romance',       items.filter(c=>(c.genre||'').toLowerCase()==='romance'), 'romance'),
      makeRow('🎨 Animation',     items.filter(c=>(c.genre||'').toLowerCase()==='animation'), 'animation'),
    ];
    rows.forEach(r=>r&&wrap.appendChild(r));
  }

  function setFilter(cat) {
    activeFilter=cat;
    document.querySelectorAll('.cat-chip').forEach(c=>c.classList.toggle('active', c.dataset.cat===cat));
    document.getElementById('search-results-wrap').style.display='none';
    document.getElementById('ott-sections').style.display='block';
    renderAll();
    document.querySelector('.main-content').scrollTo({top:0,behavior:'smooth'});
  }

  document.getElementById('cat-chips').addEventListener('click', e=>{
    const chip=e.target.closest('.cat-chip');
    if(chip) setFilter(chip.dataset.cat);
  });


  // Search
  function doSearch(){
    const q=document.getElementById('search-input').value.trim().toLowerCase();
    if(!q){
      document.getElementById('search-results-wrap').style.display='none';
      document.getElementById('ott-sections').style.display='block';
      return;
    }
    // Search respects active service filter
    let pool = activeService === 'all' ? allContent : allContent.filter(c=>c.service===activeService);
    const res=pool.filter(c=>
      c.title.toLowerCase().includes(q)||
      (c.genre||'').toLowerCase().includes(q)||
      (c.category||'').toLowerCase().includes(q)||
      (c.description||'').toLowerCase().includes(q)||
      (c.cast||[]).some(a=>a.toLowerCase().includes(q))
    );
    document.getElementById('ott-sections').style.display='none';
    document.getElementById('search-results-wrap').style.display='block';
    document.getElementById('search-results-title').textContent=`🔍 "${q}" — ${res.length} results`;
    const row=document.getElementById('search-results-row');
    row.innerHTML='';
    if(!res.length) row.innerHTML='<p style="color:var(--text-muted);padding:20px;font-size:13px">No results.</p>';
    else res.forEach(item=>row.appendChild(makeCard(item)));
  }

  const dbo = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
  document.getElementById('search-input').addEventListener('input', dbo(doSearch,250));
  document.getElementById('search-submit-btn').addEventListener('click', doSearch);

  // ── Modal ────────────────────────────────────────────────────────────────
  const modal=document.getElementById('content-modal');
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

  function refreshModalWL(){
    if(!currentModalItem) return;
    const inList=watchlist.has(currentModalItem._id||currentModalItem.id);
    const btn=document.getElementById('modal-wl-btn');
    btn.className='btn-modal-wl'+(inList?' in-list':'');
    btn.textContent=inList?'✓ In My List':'🔖 My List';
  }

  function openModal(item){
    currentModalItem=item;
    document.getElementById('modal-banner-emoji').textContent='';
    const img=document.getElementById('modal-banner-img');
    img.src=makePosterSVG({...item, color: item.color});
    document.getElementById('modal-title').textContent=item.title;
    document.getElementById('modal-match').textContent=item.match_score?item.match_score+'% Match':'';
    document.getElementById('modal-rating').textContent='★ '+(item.rating||'8.0');
    document.getElementById('modal-year').textContent=item.year||'';
    document.getElementById('modal-type').textContent=item.type==='series'
      ? (item.seasons_count||1)+' Season'+((item.seasons_count||1)>1?'s':'')
      : (item.duration||'');
    document.getElementById('modal-genre-tag').textContent=item.genre||item.category||'';
    document.getElementById('modal-desc').textContent=item.description||'';
    document.getElementById('modal-cast').textContent=(item.cast||[]).join(' · ')||'N/A';

    // "Who's watching" section in modal
    const existingWhoWatching = document.getElementById('modal-who-watching');
    if (existingWhoWatching) existingWhoWatching.remove();
    const watchers = getWatchers(item._id||item.id);
    if (watchers.length) {
      const svcColor = SERVICE_META[item.service]?.color || '#6c47ff';
      const wDiv = document.createElement('div');
      wDiv.id = 'modal-who-watching';
      wDiv.style.cssText = 'margin-bottom:14px;padding:10px 12px;background:var(--bg-elevated);border-radius:10px;border:1px solid var(--border)';
      wDiv.innerHTML = `
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase">👥 Friends watching now</div>
        ${watchers.map(w=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6c47ff,#a855f7);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:800;flex-shrink:0">${w.name[0]}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600">${w.name}</div>
              <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:3px">
                <div style="height:100%;width:${w.progress}%;background:${svcColor};border-radius:2px;transition:width 0.4s"></div>
              </div>
            </div>
            <span style="font-size:10px;color:var(--text-muted)">${w.progress}%</span>
          </div>`).join('')}`;
      const castSection = document.getElementById('modal-cast').parentElement;
      castSection.parentElement.insertBefore(wDiv, castSection);
    }

    const epsWrap=document.getElementById('modal-episodes');
    const epsList=document.getElementById('modal-episodes-list');
    if(item.type==='series'&&item.episodes&&item.episodes.length){
      epsWrap.style.display='block'; epsList.innerHTML='';
      item.episodes.forEach((ep,i)=>{
        const d=document.createElement('div');
        d.className='ep-item';
        d.innerHTML=`<div class="ep-thumb"><img src="${makePosterSVG({...item,title:ep.title})}" style="width:100%;height:100%;object-fit:cover;border-radius:5px"/></div><div class="ep-info"><div class="ep-title">${i+1}. ${ep.title}</div><div class="ep-desc">${ep.description||''}</div><div class="ep-dur">${ep.duration||'45m'}</div></div>`;
        d.addEventListener('click',()=>{ closeModal(); window.location.href='/ott-player.html?id='+(item._id||item.id)+'&ep='+i; });
        epsList.appendChild(d);
      });
    } else epsWrap.style.display='none';

    refreshModalWL();
    document.getElementById('modal-play-btn').onclick=()=>{ closeModal(); window.location.href='/ott-player.html?id='+(item._id||item.id); };
    document.getElementById('modal-wl-btn').onclick=e=>toggleWL(item,e);
    modal.classList.add('open');
    document.body.style.overflow='hidden';
  }

  function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; currentModalItem=null; }

  // ── Right-panel: Genre filter ─────────────────────────────────────────────
  document.getElementById('fp-genres')?.addEventListener('click', function(e) {
    const tag = e.target.closest('.fp-genre-tag');
    if (!tag) return;
    activeGenre = tag.dataset.genre;
    document.querySelectorAll('.fp-genre-tag').forEach(t => {
      t.classList.remove('active');
      t.querySelector('.fp-check') && t.querySelector('.fp-check').remove();
    });
    tag.classList.add('active');
    const check = document.createElement('span');
    check.className = 'fp-check';
    check.textContent = ' ✓';
    tag.appendChild(check);

    // Also sync the top cat-chip if there's a mapping
    const chipMap = { all:'trending', action:'action', comedy:'comedy', drama:'drama', thriller:'thriller', horror:'thriller', 'sci-fi':'sci-fi', romance:'romance', adventure:'action', historical:'drama', crime:'thriller' };
    const catChip = document.querySelector(`.cat-chip[data-cat="${chipMap[activeGenre]||'trending'}"]`);
    if (catChip) {
      document.querySelectorAll('.cat-chip').forEach(c=>c.classList.remove('active'));
      catChip.classList.add('active');
      activeFilter = catChip.dataset.cat;
    }
    renderAll();
    document.querySelector('.main-content').scrollTo({top:0,behavior:'smooth'});
  });

  // ── Right-panel: Service filter ────────────────────────────────────────────
  document.getElementById('fp-services')?.addEventListener('click', function(e) {
    const svc = e.target.closest('.fp-service');
    if (!svc || svc.dataset.service === 'add') return;
    activeService = svc.dataset.service;
    document.querySelectorAll('.fp-service').forEach(s => s.classList.remove('active'));
    svc.classList.add('active');

    // Reset to trending view and re-render with the service filter
    activeFilter = 'trending';
    document.querySelectorAll('.cat-chip').forEach(c=>c.classList.toggle('active', c.dataset.cat==='trending'));
    document.getElementById('search-results-wrap').style.display='none';
    document.getElementById('ott-sections').style.display='block';
    renderAll();
    document.querySelector('.main-content').scrollTo({top:0,behavior:'smooth'});
  });

  // Expose renderAll so the legacy wiring below (if still present) works
  window._ottRenderAll = renderAll;

  // Initial render
  renderAll();
});

})();

// ── IMDb links ──
const IMDB_LINKS = {
  'b1':'https://www.imdb.com/find/?q=O+Romeo+2026',
  'b2':'https://www.imdb.com/title/tt14969810/',
  'b3':'https://www.imdb.com/title/tt10280296/',
  'b4':'https://www.imdb.com/find/?q=Kara+2025',
  'b5':'https://www.imdb.com/find/?q=Off+Campus+2025',
  'b6':'https://www.imdb.com/title/tt14257582/',
  'b7':'https://www.imdb.com/title/tt23849204/',
  'b8':'https://www.imdb.com/title/tt12854838/',
  'b9':'https://www.imdb.com/title/tt13751694/',
  'b10':'https://www.imdb.com/title/tt15383078/',
  'h1':'https://www.imdb.com/title/tt21320868/',
  'h2':'https://www.imdb.com/find/?q=In+the+Grey+2026',
  'h3':'https://www.imdb.com/find/?q=Crimson+Verdict',
  'h4':'https://www.imdb.com/find/?q=Apex+Rising',
  'h5':'https://www.imdb.com/find/?q=Neon+Labyrinth',
  'h6':'https://www.imdb.com/title/tt12263384/',
  'h7':'https://www.imdb.com/find/?q=The+Last+Algorithm',
  'h8':'https://www.imdb.com/find/?q=Iron+Meridian',
  's1':'https://www.imdb.com/find/?q=Stellar+Drift',
  's2':'https://www.imdb.com/title/tt4574334/',
  's3':'https://www.imdb.com/find/?q=Parallel+Hearts',
  's4':'https://www.imdb.com/find/?q=Spice+Route',
  's5':'https://www.imdb.com/title/tt4786824/',
  's6':'https://www.imdb.com/find/?q=Quiet+Hours',
  'c1':'https://www.imdb.com/find/?q=Seoul+Bloom',
  'c2':'https://www.imdb.com/find/?q=Monsoon+Wedding',
  'c3':'https://www.imdb.com/title/tt10986410/',
  'c4':'https://www.imdb.com/find/?q=The+Sweetest+Con',
  'c5':'https://www.imdb.com/find/?q=Love+in+Ladakh',
  'a1':'https://www.imdb.com/find/?q=Karna+animation',
  'a2':'https://www.imdb.com/title/tt9362722/',
  't1':'https://www.imdb.com/find/?q=Obsess+horror',
  't2':'https://www.imdb.com/title/tt29623480/',
  't3':'https://www.imdb.com/find/?q=Kashmir+Files+2',
  't4':'https://www.imdb.com/title/tt27004217/',
};
// Attach imdb to each movie
if (typeof MOVIES !== 'undefined') {
  MOVIES.forEach(m => { if(IMDB_LINKS[m.id]) m.imdb = IMDB_LINKS[m.id]; });
}
