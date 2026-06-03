/* ===== Subspace OTT — My List v5 ===== */
(function() {

// Same catalog as ott.js — must stay in sync
const ALL_MOVIES = [
  { id:'b1', title:"O' Romeo", type:'movie', genre:'Romance', category:'Bollywood', language:'Hindi', year:2026, rating:8.1, duration:'2h 15m', is_new:true, is_trending:true, color:'#7c2d92', description:'A sweeping love story set across two generations in Mumbai.', cast:['Ranveer Singh','Alia Bhatt'] },
  { id:'b2', title:'Subedaar', type:'movie', genre:'Action', category:'Bollywood', language:'Hindi', year:2026, rating:8.4, duration:'2h 28m', is_new:true, is_trending:true, color:'#1e3a5f', description:'A retired army officer forced back into action.', cast:['Ajay Devgn','Raashii Khanna'] },
  { id:'b3', title:'The Legend of Udham', type:'movie', genre:'Drama', category:'Bollywood', language:'Hindi', year:2026, rating:9.0, duration:'2h 50m', is_trending:true, color:'#3d2b00', description:'The untold story of freedom fighter Udham Singh.', cast:['Vicky Kaushal'] },
  { id:'b4', title:'Kara', type:'movie', genre:'Thriller', category:'Bollywood', language:'Hindi', year:2025, rating:8.3, duration:'2h 5m', is_trending:true, color:'#1a1a2e', description:'A detective uncovers a conspiracy buried deep within the corridors of power.', cast:['Tabu','Pankaj Tripathi'] },
  { id:'b5', title:'Off Campus', type:'series', genre:'Drama', category:'Bollywood', language:'Hindi', year:2025, rating:8.6, seasons_count:2, is_new:true, color:'#0f3460', description:'Four college friends navigate love, ambition, and betrayal.', cast:['Ishaan Khatter'], episodes:[{title:'First Day',duration:'42m'},{title:'The Bet',duration:'40m'}] },
  { id:'b6', title:'Dunki', type:'movie', genre:'Comedy', category:'Bollywood', language:'Hindi', year:2024, rating:7.9, duration:'2h 35m', color:'#4a1942', description:'A group of friends risk everything to illegally immigrate abroad.', cast:['Shah Rukh Khan','Taapsee Pannu'] },
  { id:'b7', title:'12th Fail', type:'movie', genre:'Drama', category:'Bollywood', language:'Hindi', year:2024, rating:9.2, duration:'2h 27m', is_trending:true, color:'#1b4332', description:'The inspiring true story of a man who overcame poverty to become an IPS officer.', cast:['Vikrant Massey'] },
  { id:'b8', title:'Fighter', type:'movie', genre:'Action', category:'Bollywood', language:'Hindi', year:2024, rating:8.0, duration:'2h 46m', is_new:true, color:'#1e293b', description:"India's finest air warriors take on a deadly enemy.", cast:['Hrithik Roshan','Deepika Padukone'] },
  { id:'b9', title:'Animal', type:'movie', genre:'Action', category:'Bollywood', language:'Hindi', year:2023, rating:8.1, duration:'3h 21m', is_trending:true, color:'#450a0a', description:'A son returns home to protect his empire by any means necessary.', cast:['Ranbir Kapoor','Rashmika Mandanna'] },
  { id:'b10', title:'Jawan', type:'movie', genre:'Action', category:'Bollywood', language:'Hindi', year:2023, rating:7.8, duration:'2h 49m', is_trending:true, color:'#052e16', description:'A man masterminds audacious heists driven by a personal cause.', cast:['Shah Rukh Khan','Nayanthara'] },
  { id:'h1', title:'Spider-Man Noir', type:'series', genre:'Action', category:'Hollywood', year:2026, rating:8.8, seasons_count:1, is_new:true, is_trending:true, color:'#0c0c1a', description:'Peter Parker navigates 1930s New York as a pulp-noir Spider-Man.', cast:['Nicolas Cage'], episodes:[{title:'Into the Dark',duration:'52m'},{title:'Web of Lies',duration:'48m'}] },
  { id:'h2', title:'In the Grey', type:'movie', genre:'Thriller', category:'Hollywood', year:2026, rating:8.5, duration:'2h 10m', is_trending:true, color:'#1c1c2e', description:'A CIA operative races to prevent a world-altering assassination.', cast:['Ryan Gosling','Ana de Armas'] },
  { id:'h3', title:'Crimson Verdict', type:'movie', genre:'Thriller', category:'Hollywood', year:2024, rating:8.7, duration:'2h 14m', is_trending:true, color:'#3b0000', description:'A defense attorney chooses between her client and the truth.', cast:['Priya Mehta','Samuel Ford'] },
  { id:'h4', title:'Apex Rising', type:'series', genre:'Action', category:'Hollywood', year:2024, rating:8.5, seasons_count:4, is_trending:true, color:'#0a192f', description:'Elite covert operatives in grey zones of global conflict.', cast:['Marcus Webb','Zara Hassan'], episodes:[{title:'Extraction',duration:'50m'},{title:'Burn Notice',duration:'48m'}] },
  { id:'h5', title:'Neon Labyrinth', type:'movie', genre:'Sci-Fi', category:'Hollywood', year:2023, rating:8.3, duration:'1h 52m', color:'#2d1b69', description:"In a city where memories can be sold, a thief carries someone else's past.", cast:['Lyla Storm','Chen Wei'] },
  { id:'h6', title:'Ghost Protocol: Reborn', type:'movie', genre:'Action', category:'Hollywood', year:2024, rating:8.4, duration:'2h 22m', is_new:true, color:'#111827', description:'A presumed-dead operative returns with no memory of a classified mission.', cast:['Alex Stone','Mira Kazan'] },
  { id:'h7', title:'The Last Algorithm', type:'series', genre:'Thriller', category:'Hollywood', year:2023, rating:9.3, seasons_count:1, is_trending:true, color:'#1e0533', description:'A rogue AI predicts crimes before they happen.', cast:['Rajan Nair','Sofia Alves'], episodes:[{title:'Prediction Zero',duration:'58m'},{title:'False Positive',duration:'51m'}] },
  { id:'h8', title:'Iron Meridian', type:'movie', genre:'Action', category:'Hollywood', year:2024, rating:8.6, duration:'2h 8m', is_new:true, color:'#1c2833', description:'A retired soldier pulled back to protect her village.', cast:['Sana Mirza','Aryan Kapoor'] },
  { id:'s1', title:'Stellar Drift', type:'series', genre:'Sci-Fi', category:'Hollywood', year:2024, rating:9.1, seasons_count:3, is_trending:true, is_new:true, color:'#0a0e27', description:'Astronauts discover a mysterious signal at the edge of the solar system.', cast:['Maya Chen','Arjun Sharma'], episodes:[{title:'Pilot',duration:'52m'},{title:'The Signal',duration:'48m'},{title:'First Contact',duration:'55m'}] },
  { id:'s2', title:'Warp Factor', type:'series', genre:'Sci-Fi', category:'Hollywood', year:2024, rating:8.7, seasons_count:2, is_new:true, color:'#001a33', description:"Earth's first FTL mission encounters an entity that shouldn't exist.", cast:['Yuki Tanaka','Raj Patel'], episodes:[{title:'Ignition',duration:'50m'},{title:'Anomaly',duration:'48m'}] },
  { id:'s3', title:'Parallel Hearts', type:'series', genre:'Drama', category:'Hollywood', year:2024, rating:8.6, seasons_count:2, is_new:true, color:'#1a0a2e', description:'Two timelines tracing the ripple of one decision across three generations.', cast:['Deepa Reddy','Suresh Kumar'], episodes:[{title:'1987',duration:'52m'},{title:'2024',duration:'49m'}] },
  { id:'s4', title:'Spice Route', type:'series', genre:'Drama', category:'Bollywood', language:'Hindi', year:2024, rating:9.0, seasons_count:1, is_trending:true, color:'#3d1a00', description:'Rare spices from remote farms to Michelin-starred kitchens worldwide.', cast:['Narrator: Arun Das'], episodes:[{title:'Saffron',duration:'44m'},{title:'Vanilla',duration:'42m'}] },
  { id:'s5', title:'Deep Blue Silence', type:'movie', genre:'Drama', category:'Hollywood', year:2023, rating:8.8, duration:'2h 5m', color:'#001a4d', description:'A marine biologist receives transmissions from an abandoned submarine.', cast:['Camille Martin'] },
  { id:'s6', title:'Quiet Hours', type:'series', genre:'Drama', category:'Hollywood', year:2023, rating:8.4, seasons_count:2, color:'#1a1a1a', description:'A grief counsellor questions her own trauma while helping others heal.', cast:['Nina Cross'], episodes:[{title:'First Session',duration:'44m'},{title:'Reopen',duration:'42m'}] },
  { id:'c1', title:'Seoul Bloom', type:'series', genre:'Romance', category:'Hollywood', year:2024, rating:8.9, seasons_count:2, is_new:true, color:'#3d0026', description:'Two rival chefs fall in love while competing in the same event.', cast:['Ji-won Park','Hyun-soo Lee'], episodes:[{title:'Kitchen Wars',duration:'46m'},{title:'Secret Ingredient',duration:'44m'}] },
  { id:'c2', title:'Monsoon Wedding Crashers', type:'movie', genre:'Comedy', category:'Bollywood', language:'Hindi', year:2024, rating:8.2, duration:'1h 58m', is_new:true, color:'#1a3300', description:'Three cousins accidentally RSVP to the wrong wedding.', cast:['Ananya Rao','Kabir Singh'] },
  { id:'c3', title:'Laugh Factory', type:'series', genre:'Comedy', category:'Hollywood', year:2024, rating:8.0, seasons_count:3, color:'#1a1400', description:"Behind the scenes of a failing comedy club and its owner's desperate schemes.", cast:['Danny Okafor'], episodes:[{title:'Opening Night',duration:'30m'},{title:'The Heckler',duration:'28m'}] },
  { id:'c4', title:'The Sweetest Con', type:'movie', genre:'Comedy', category:'Hollywood', year:2024, rating:7.9, duration:'1h 45m', color:'#2d1b00', description:'A small-town baker accidentally fronts an elaborate heist.', cast:['Bella Ortiz','James Liu'] },
  { id:'c5', title:'Love in Ladakh', type:'movie', genre:'Romance', category:'Bollywood', language:'Hindi', year:2025, rating:8.3, duration:'2h 10m', is_new:true, color:'#001433', description:'Two strangers stranded by a blizzard in Ladakh discover what matters.', cast:['Siddhant Chaturvedi'] },
  { id:'a1', title:'Karna: The Unsung Hero', type:'movie', genre:'Animation', category:'Bollywood', language:'Hindi', year:2025, rating:8.8, duration:'1h 55m', is_new:true, color:'#2d1a00', description:"An animated retelling of Karna's journey from the Mahabharata.", cast:['Voice: Manoj Bajpayee'] },
  { id:'a2', title:'Cyber Samurai', type:'series', genre:'Animation', category:'Hollywood', year:2024, rating:8.5, seasons_count:2, is_new:true, color:'#00001a', description:'In Neo-Tokyo 2099, a lone samurai fights an AI empire.', cast:['Voice Cast'], episodes:[{title:'Boot Sequence',duration:'28m'},{title:'Firewall',duration:'26m'}] },
  { id:'t1', title:'Obsess', type:'movie', genre:'Horror', category:'Hollywood', year:2025, rating:8.2, duration:'1h 48m', is_new:true, is_trending:true, color:'#0d0d0d', description:"A true-crime podcaster's obsession may have manifested a serial killer.", cast:['Florence Pugh'] },
  { id:'t2', title:'Return of the Jungle', type:'movie', genre:'Animation', category:'Hollywood', year:2025, rating:7.8, duration:'1h 32m', is_new:true, color:'#0a2e0a', description:'A family of jungle animals reclaim their home from developers.', cast:['Voice Cast'] },
  { id:'t3', title:'The Kashmir Files II', type:'movie', genre:'Drama', category:'Bollywood', language:'Hindi', year:2026, rating:8.9, duration:'2h 42m', is_new:true, is_trending:true, color:'#1a0a00', description:'A powerful sequel continuing the untold stories of the Kashmir exodus.', cast:['Mithun Chakraborty','Pallavi Joshi'] },
  { id:'t4', title:'Sector 36', type:'movie', genre:'Thriller', category:'Bollywood', language:'Hindi', year:2024, rating:8.6, duration:'1h 55m', is_trending:true, color:'#0d0d0d', description:'A haunting crime thriller based on a real serial killer case in Delhi.', cast:['Vikrant Massey','Deepak Dobriyal'] },
];

function makePosterSVG(item) {
  const bg = item.color || '#1a1a2e';
  const title = item.title.length > 14 ? item.title.substring(0,13)+'…' : item.title;
  const icons = { drama:'🎭', action:'💥', comedy:'😂', thriller:'🔪', 'sci-fi':'🚀', romance:'💕', horror:'👻', animation:'🎨', default:'🎬' };
  const icon = icons[(item.genre||'').toLowerCase()] || icons.default;
  const lang = item.language || item.category || '';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg}"/>
      <stop offset="100%" style="stop-color:#000010"/>
    </linearGradient>
    <linearGradient id="ov" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0)"/>
      <stop offset="65%" style="stop-color:rgba(0,0,0,0.6)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.95)"/>
    </linearGradient>
  </defs>
  <rect width="120" height="180" fill="url(#g)"/>
  <text x="60" y="88" font-size="42" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <rect width="120" height="180" fill="url(#ov)"/>
  <text x="8" y="152" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white">${title}</text>
  <text x="8" y="168" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.55)">${item.year||'2024'} · ${lang}</text>
</svg>`)}`;
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    window.location.href = '/index.html'; return;
  }

  // Load user info
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
  }

  let watchlist = new Set(JSON.parse(localStorage.getItem('ott_watchlist') || '[]'));
  let currentModalItem = null;

  // Try loading from API, fall back to localStorage
  if (typeof get === 'function') {
    get('/ott/watchlist').then(r=>r.json()).then(d=>{
      if (d.success && d.data) {
        // Merge API IDs into local set
        d.data.forEach(i => watchlist.add(i.content_id || i._id || i.id));
        saveAndRender();
      }
    }).catch(()=>{});
  }

  function saveAndRender() {
    localStorage.setItem('ott_watchlist', JSON.stringify([...watchlist]));
    render();
  }

  function getWatchlistItems() {
    return ALL_MOVIES.filter(m => watchlist.has(m.id));
  }

  function render() {
    const items = getWatchlistItems();
    const body = document.getElementById('wl-body');
    const countEl = document.getElementById('wl-count');
    countEl.textContent = items.length + ' title' + (items.length !== 1 ? 's' : '');

    if (!items.length) {
      body.innerHTML = `
        <div class="wl-empty">
          <div class="wl-empty-icon">🔖</div>
          <h3>Your list is empty</h3>
          <p>Go to Watch and tap <strong>+</strong> on any title to save it here.</p>
          <a href="/ott.html" class="btn btn-primary" style="margin-top:20px;display:inline-block">Browse Titles</a>
        </div>`;
      return;
    }

    // Group by type
    const movies  = items.filter(i => i.type === 'movie');
    const series  = items.filter(i => i.type === 'series');
    const bollyw  = items.filter(i => (i.category||'').toLowerCase() === 'bollywood');
    const hollywo = items.filter(i => (i.category||'').toLowerCase() === 'hollywood');

    body.innerHTML = '';

    function addSection(title, list) {
      if (!list.length) return;
      const sec = document.createElement('div');
      sec.className = 'ott-sec';
      sec.innerHTML = `<div class="ott-sec-hdr"><span class="ott-sec-ttl">${title}</span></div><div class="ott-row"></div>`;
      list.forEach(item => sec.querySelector('.ott-row').appendChild(makeCard(item)));
      body.appendChild(sec);
    }

    // Show all in one big row first, then sub-sections
    addSection('📋 All Saved — ' + items.length + ' titles', items);
    if (movies.length  && series.length)  addSection('🎬 Movies',  movies);
    if (series.length  && movies.length)  addSection('📺 Series',  series);
    if (bollyw.length)  addSection('🎭 Bollywood', bollyw);
    if (hollywo.length) addSection('🌟 Hollywood', hollywo);
  }

  function makeCard(item) {
    const inList = watchlist.has(item.id);
    const badge = item.language
      ? `<span class="mc-badge mc-badge-lang">${item.language}</span>`
      : item.is_new ? `<span class="mc-badge mc-badge-new">NEW</span>`
      : item.is_trending ? `<span class="mc-badge mc-badge-hot">HOT</span>` : '';

    const card = document.createElement('div');
    card.className = 'mc';
    card.innerHTML = `
      <div class="mc-poster">
        <img src="${makePosterSVG(item)}" alt="${item.title}" loading="lazy"/>
        ${badge}
        <div class="mc-hover"><div class="mc-play">▶</div></div>
        <button class="mc-wl in-list" data-id="${item.id}" title="Remove from My List">✓</button>
      </div>
      <div class="mc-title">${item.title}</div>
      <div class="mc-sub">${item.year||'2024'} · ${item.type==='series'?'Series':'Movie'}</div>`;

    card.querySelector('.mc-poster').addEventListener('click', () => openModal(item));
    card.querySelector('.mc-wl').addEventListener('click', e => {
      e.stopPropagation();
      removeItem(item);
    });
    return card;
  }

  async function removeItem(item) {
    watchlist.delete(item.id);
    try { if(typeof del==='function') await del('/ott/watchlist/'+item.id); } catch(_) {}
    saveAndRender();
  }

  // Modal
  const modal = document.getElementById('content-modal');
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });

  function openModal(item) {
    currentModalItem = item;
    document.getElementById('modal-banner-img').src = makePosterSVG({...item, color: item.color});
    document.getElementById('modal-title').textContent     = item.title;
    document.getElementById('modal-rating').textContent    = '★ ' + (item.rating||'8.0');
    document.getElementById('modal-year').textContent      = item.year||'';
    document.getElementById('modal-type').textContent      = item.type==='series'
      ? (item.seasons_count||1)+' Season'+((item.seasons_count||1)>1?'s':'')
      : (item.duration||'');
    document.getElementById('modal-genre-tag').textContent = item.genre||item.category||'';
    document.getElementById('modal-desc').textContent      = item.description||'';
    document.getElementById('modal-cast').textContent      = (item.cast||[]).join(' · ')||'N/A';

    const epsWrap = document.getElementById('modal-episodes');
    const epsList = document.getElementById('modal-episodes-list');
    if (item.type==='series' && item.episodes && item.episodes.length) {
      epsWrap.style.display='block'; epsList.innerHTML='';
      item.episodes.forEach((ep,i) => {
        const d=document.createElement('div');
        d.className='ep-item';
        d.innerHTML=`<div class="ep-thumb"><img src="${makePosterSVG({...item,title:ep.title})}" style="width:100%;height:100%;object-fit:cover;border-radius:5px"/></div><div class="ep-info"><div class="ep-title">${i+1}. ${ep.title}</div><div class="ep-desc">${ep.description||''}</div><div class="ep-dur">${ep.duration||'45m'}</div></div>`;
        d.addEventListener('click',()=>{ closeModal(); window.location.href='/ott-player.html?id='+item.id+'&ep='+i; });
        epsList.appendChild(d);
      });
    } else epsWrap.style.display='none';

    document.getElementById('modal-play-btn').onclick = () => { closeModal(); window.location.href='/ott-player.html?id='+item.id; };
    document.getElementById('modal-remove-btn').onclick = () => { closeModal(); removeItem(item); };

    modal.classList.add('open');
    document.body.style.overflow='hidden';
  }

  function closeModal() { modal.classList.remove('open'); document.body.style.overflow=''; currentModalItem=null; }

  // Initial render from localStorage immediately
  render();
});

})();
