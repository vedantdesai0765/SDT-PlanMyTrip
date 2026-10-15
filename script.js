'use strict';
/* =====================================================================
   PlanMyTrip – front-end only prototype (HTML + CSS + JavaScript)
   Data is stored in the browser (localStorage). No backend needed.
   ===================================================================== */

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'travelManager.v1';
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const TODAY = (() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); })();
const TODAY_ISO = iso(TODAY);
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const daysUntil = s => Math.round((parseD(s) - TODAY) / 864e5);
const fmtDate = s => parseD(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDay = s => parseD(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const when = d => d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;

const ICON_PATHS = {
  adventure:'<path d="m3 20 7-14 4 8 2-4 5 10H3Z"/><path d="M3 20h18"/>', culture:'<path d="M3 21h18M4 18h16M5 10h14M3 7l9-4 9 4M6 10v8m4-8v8m4-8v8m4-8v8"/>',
  food:'<path d="M3 11h18a8 8 0 0 1-16 0Zm4-4V4m5 3V3m5 4V4"/>', relaxation:'<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/>',
  nature:'<path d="M20 4c-8 0-14 4-14 10a6 6 0 0 0 6 6c6 0 10-6 8-16Z"/><path d="M4 21c3-5 6-8 12-11"/>', travel:'<path d="m3 11 18-8-8 18-2-7-8-3Z"/><path d="m11 14 5-5"/>', custom:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
  flight:'<path d="m3 11 18-8-8 18-2-7-8-3Z"/><path d="m11 14 5-5"/>', hotel:'<path d="M3 20V5m0 11h18v4M6 16V9h6a4 4 0 0 1 4 4v3m0-5h2a3 3 0 0 1 3 3v2"/>', activity:'<path d="M4 6h16v14H4zM8 3v6m8-6v6M4 11h16"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>', alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>', home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-6h6v6"/>', bag:'<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>', ticket:'<path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16v-4a2 2 0 0 1 0-4V5H4v2Z"/><path d="M13 5v2m0 4v2m0 4v2"/>'
};
const svgIcon = name => `<svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ICON_PATHS.alert}</svg>`;

/* ---------- mock data ---------- */
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'];
const AIRLINES = [['IndiGo', '6E'], ['Air India', 'AI'], ['Vistara', 'UK'], ['Akasa Air', 'QP'], ['SpiceJet', 'SG']];
const CATS = { adventure: 'Adventure', culture: 'Culture', food: 'Food', relaxation: 'Relaxation', nature: 'Nature' };
const CAT_ICON = { adventure: svgIcon('adventure'), culture: svgIcon('culture'), food: svgIcon('food'), relaxation: svgIcon('relaxation'), nature: svgIcon('nature'), travel: svgIcon('travel'), custom: svgIcon('custom') };
const TYPE_ICON = { flight: svgIcon('flight'), hotel: svgIcon('hotel'), activity: svgIcon('activity') };

// hotels: [name, stars, price per night, area]   acts: [name, category, hours, price per person, description]
const DEST = {
  Goa: {
    emoji: '🏖️', country: 'India', tag: 'Beaches, nightlife & Portuguese heritage', base: 4200, mins: 105,
    img: 'photos/goa.jpg', imgCredit: 'Lian Chang · Wikimedia Commons · CC BY 2.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Boats_on_the_Calangute_beach,_Goa.jpg',
    hotels: [['Beachside Resort Calangute', 4, 5200, 'Calangute'], ['Palm Grove Hostel', 2, 1100, 'Anjuna'], ['Fontainhas Heritage Villa', 4, 6400, 'Panjim']],
    acts: [
      ['Baga water sports combo', 'adventure', 3, 1800, 'Parasailing, jet ski and banana boat ride'],
      ['Old Goa churches & heritage walk', 'culture', 3, 600, 'Basilica of Bom Jesus and Se Cathedral'],
      ['Fisherman\'s wharf seafood trail', 'food', 2, 1500, 'Goan fish curry, prawns and local feni tasting'],
      ['Mandovi sunset cruise', 'relaxation', 2, 900, 'Live music and folk dance on the river'],
      ['Dudhsagar waterfalls trek', 'nature', 5, 2200, 'Jeep safari and short forest trek'],
      ['Spice plantation visit', 'nature', 3, 700, 'Guided tour with traditional Goan lunch']
    ]
  },
  Jaipur: {
    emoji: '🏰', country: 'India', tag: 'Forts, palaces & royal Rajasthani cuisine', base: 3600, mins: 125,
    img: 'photos/jaipur.jpg', imgCredit: 'Mahesh Karnapu · Wikimedia Commons · CC BY-SA 4.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Front_Elevation_of_City_Palace,_Jaipur.jpg',
    hotels: [['Pink City Haveli', 4, 4800, 'Old City'], ['Amer Road Budget Stay', 2, 1300, 'Amer Road'], ['Royal Palace Suites', 5, 12500, 'Civil Lines']],
    acts: [
      ['Amber Fort guided tour', 'culture', 3, 900, 'Sheesh Mahal, ramparts and light & sound show'],
      ['Sunrise hot-air balloon', 'adventure', 2, 9500, 'Float over forts and the Aravalli hills'],
      ['City Palace & Jantar Mantar', 'culture', 3, 700, 'Royal museum and the UNESCO observatory'],
      ['Rajasthani thali & street food walk', 'food', 3, 1200, 'Dal baati churma, kachori and lassi'],
      ['Nahargarh sunset picnic', 'relaxation', 2, 800, 'Fort-top views over the Pink City'],
      ['Chokhi Dhani village evening', 'culture', 4, 1500, 'Folk music, puppet shows and camel rides']
    ]
  },
  Manali: {
    emoji: '🏔️', country: 'India', tag: 'Snow peaks, rivers & mountain cafés', base: 5800, mins: 150,
    img: 'photos/manali.jpg', imgCredit: 'Shameer Thajudeen · Wikimedia Commons · CC BY-SA 4.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Mountains,_Manali,_Himachal_Pradesh.jpg',
    hotels: [['Snowline Lodge', 3, 3200, 'Old Manali'], ['Riverside Cottages', 4, 5600, 'Vashisht'], ['Backpackers Hostel', 2, 900, 'Mall Road']],
    acts: [
      ['Solang Valley paragliding', 'adventure', 3, 3500, 'Tandem flight with certified pilots'],
      ['Rohtang Pass day trip', 'nature', 8, 2800, 'Snow point and Himalayan viewpoints'],
      ['Hadimba Temple & Old Manali walk', 'culture', 2, 300, 'Cedar-forest temple and village lanes'],
      ['Beas river rafting', 'adventure', 3, 1600, 'Grade II–III rapids with safety gear'],
      ['Old Manali café hopping', 'food', 3, 1100, 'Trout, siddu and Himachali thali'],
      ['Vashisht hot springs soak', 'relaxation', 2, 400, 'Natural sulphur springs and temple']
    ]
  },
  Kerala: {
    emoji: '🌴', country: 'India', tag: 'Backwaters, tea hills & Ayurveda', base: 5200, mins: 165,
    img: 'photos/kerala.jpg', imgCredit: 'Vyacheslav Argenberg · Wikimedia Commons · CC BY 4.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Kerala_backwaters,_River,_India.jpg',
    hotels: [['Backwater Houseboat Stay', 4, 8500, 'Alleppey'], ['Munnar Tea Estate Resort', 4, 6200, 'Munnar'], ['Fort Kochi Homestay', 3, 2800, 'Fort Kochi']],
    acts: [
      ['Alleppey houseboat cruise', 'relaxation', 6, 4500, 'Lunch on board while cruising the backwaters'],
      ['Munnar tea plantation walk', 'nature', 3, 700, 'Tea museum and factory tour'],
      ['Kathakali & Kalaripayattu show', 'culture', 2, 600, 'Classical dance and martial-art display'],
      ['Kerala sadya & seafood tasting', 'food', 2, 900, 'Banana-leaf feast and karimeen fry'],
      ['Periyar jungle trek', 'adventure', 4, 1800, 'Guided trek and bamboo rafting'],
      ['Ayurvedic massage session', 'relaxation', 2, 2200, 'Traditional full-body therapy']
    ]
  },
  Dubai: {
    emoji: '🏙️', country: 'UAE', tag: 'Skyscrapers, desert & shopping', base: 18500, mins: 200,
    img: 'photos/dubai.jpg', imgCredit: 'Stefano Vigorelli · Wikimedia Commons · CC BY-SA 4.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Dubai_skyline,_Dubai_UAE.jpg',
    hotels: [['Marina Skyline Hotel', 4, 11500, 'Dubai Marina'], ['Deira Budget Inn', 3, 5200, 'Deira'], ['Burj View Suites', 5, 24000, 'Downtown']],
    acts: [
      ['Burj Khalifa observation deck', 'culture', 2, 3200, 'Sky-high views from level 124'],
      ['Desert safari with BBQ dinner', 'adventure', 6, 4200, 'Dune bashing, camel ride and live show'],
      ['Old Dubai souks & abra ride', 'culture', 3, 600, 'Gold, spice souk and creek crossing'],
      ['Al Karama street food tour', 'food', 2, 1100, 'Shawarma, karak chai and Emirati sweets'],
      ['Jumeirah beach day', 'relaxation', 4, 500, 'Sun, sand and Burj Al Arab views'],
      ['Dhow dinner cruise', 'relaxation', 2, 3500, 'Buffet dinner along Dubai Creek']
    ]
  },
  Singapore: {
    emoji: '🦁', country: 'Singapore', tag: 'Gardens, hawker food & theme parks', base: 21500, mins: 330,
    img: 'photos/singapore.jpg', imgCredit: 'Daniel Case · Wikimedia Commons · CC BY-SA 4.0', imgSource: 'https://commons.wikimedia.org/wiki/File:Singapore_Financial_District_skyline_from_across_Marina_Bay.jpg',
    hotels: [['Marina Bay View Hotel', 5, 19500, 'Marina Bay'], ['Little India Boutique', 3, 6800, 'Little India'], ['Sentosa Family Resort', 4, 13500, 'Sentosa']],
    acts: [
      ['Gardens by the Bay', 'nature', 3, 2400, 'Supertree Grove, Flower Dome and Cloud Forest'],
      ['Hawker centre food crawl', 'food', 3, 1000, 'Chilli crab, laksa and kaya toast'],
      ['Universal Studios Singapore', 'adventure', 8, 6500, 'Rides and shows on Sentosa island'],
      ['Chinatown & Buddha Tooth Relic Temple', 'culture', 2, 300, 'Heritage shophouses and temple visit'],
      ['Singapore Night Safari', 'nature', 3, 4000, 'Evening tram ride through wildlife trails'],
      ['Sentosa beach & Skyline Luge', 'relaxation', 3, 1800, 'Beach time and a scenic luge ride']
    ]
  },
  Agra: {
    emoji: '🕌', country: 'India', tag: 'The Taj Mahal, Mughal gardens & riverside history', base: 2800, mins: 135,
    img: 'photos/agra.jpg', imgCredit: 'Unsplash · free photo', imgSource: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
    hotels: [['Taj View Residency', 4, 4200, 'Taj Ganj'], ['Heritage Courtyard Stay', 3, 2600, 'Fatehabad Road'], ['Garden Gate Guesthouse', 2, 1200, 'Rakabganj']],
    acts: [
      ['Taj Mahal sunrise visit', 'culture', 3, 1100, 'Early entry to the marble mausoleum and gardens'],
      ['Agra Fort heritage walk', 'culture', 2, 650, 'Mughal halls, courtyards and river views'],
      ['Mehtab Bagh sunset', 'relaxation', 2, 400, 'A quiet garden view across the Yamuna'],
      ['Petha & Mughlai food trail', 'food', 2, 850, 'Local sweets and classic Agra flavours'],
      ['Fatehpur Sikri day trip', 'culture', 5, 1800, 'Explore the former Mughal capital'],
      ['Marble inlay workshop', 'culture', 2, 700, 'See traditional pietra dura craft']
    ]
  },
  Bali: {
    emoji: '🌺', country: 'Indonesia', tag: 'Temple lakes, rice terraces & island sunsets', base: 16500, mins: 510,
    img: 'photos/bali.jpg', imgCredit: 'Unsplash · free photo', imgSource: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
    hotels: [['Ubud Garden Retreat', 4, 7800, 'Ubud'], ['Canggu Surf House', 3, 4600, 'Canggu'], ['Sanur Beach Bungalows', 3, 5200, 'Sanur']],
    acts: [
      ['Ubud rice terrace walk', 'nature', 3, 900, 'Follow the paths through emerald paddies'],
      ['Ulun Danu Beratan visit', 'culture', 4, 1900, 'Lakeside temple and mountain scenery'],
      ['Mount Batur sunrise trek', 'adventure', 7, 3200, 'Guided dawn hike to the volcanic summit'],
      ['Balinese cooking class', 'food', 3, 1500, 'Market visit and hands-on local recipes'],
      ['Uluwatu sunset & kecak dance', 'culture', 3, 1200, 'Clifftop temple and an evening performance'],
      ['Nusa Penida coast tour', 'nature', 8, 3500, 'Island viewpoints and clear-water coves']
    ]
  },
  Kyoto: {
    emoji: '⛩️', country: 'Japan', tag: 'Lantern-lit lanes, temples & seasonal gardens', base: 29500, mins: 470,
    img: 'photos/kyoto.jpg', imgCredit: 'Unsplash · free photo', imgSource: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    hotels: [['Higashiyama Machiya', 4, 14200, 'Higashiyama'], ['Kyoto Station Stay', 3, 8900, 'Shimogyo'], ['Gion Garden Inn', 4, 16800, 'Gion']],
    acts: [
      ['Fushimi Inari early walk', 'nature', 3, 300, 'Walk beneath the vermilion torii gates'],
      ['Arashiyama bamboo grove', 'nature', 3, 450, 'Riverside paths and the famous bamboo forest'],
      ['Gion evening food walk', 'food', 3, 2400, 'Sample Kyoto favourites in lantern-lit lanes'],
      ['Kiyomizu-dera & old streets', 'culture', 3, 500, 'Temple views and preserved Higashiyama lanes'],
      ['Tea ceremony experience', 'culture', 2, 3200, 'A guided introduction to Japanese tea culture'],
      ['Nishiki Market tasting tour', 'food', 2, 1800, 'Explore Kyoto ingredients and street snacks']
    ]
  }
};

/* deterministic pseudo-random so the same search always shows the same flights */
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function hhmm(totalMin) {
  const m = ((totalMin % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

function getFlights(origin, dest, date, ret) {
  const r = rng(hash(origin + dest + date + (ret ? 'R' : '')));
  const D = DEST[dest];
  return ['06:10', '09:45', '13:20', '17:05', '21:30'].map((dep, i) => {
    const [name, code] = AIRLINES[Math.floor(r() * AIRLINES.length)];
    const stops = r() < 0.8 ? 0 : 1;
    const dur = D.mins + stops * 95 + Math.floor(r() * 25);
    const depMin = Number(dep.slice(0, 2)) * 60 + Number(dep.slice(3));
    const price = Math.round(D.base * (0.8 + r() * 0.6) * (stops ? 0.85 : 1) / 10) * 10;
    return {
      id: `f-${origin}-${dest}-${date}-${ret ? 'R' : 'O'}${i}`, type: 'flight', dest, date,
      from: ret ? dest : origin, to: ret ? origin : dest,
      airline: name, code: code + (100 + Math.floor(r() * 900)),
      dep, arr: hhmm(depMin + dur), nextDay: depMin + dur >= 1440, dur, stops, price
    };
  });
}

function getHotels(dest, checkIn, checkOut) {
  const nights = daysBetween(checkIn, checkOut);
  return DEST[dest].hotels.map(([name, stars, price, area]) => ({
    id: `h-${dest}-${name}`, type: 'hotel', dest, name, stars, price, area, checkIn, checkOut, nights
  }));
}

function getActivities(dest) {
  return DEST[dest].acts.map(([name, cat, hours, price, desc]) => ({
    id: `a-${dest}-${name}`, type: 'activity', dest, name, cat, hours, price, desc
  }));
}

/* ---------- state ---------- */
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.trips)) { s.favorites = Array.isArray(s.favorites) ? s.favorites : []; return s; } } catch (e) { /* ignore */ }
  return { trips: [], favorites: [] };
}
let state = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }

const ui = {
  view: 'dashboard', tab: 'flights', openTrip: null, itTrip: null,
  origin: 'Mumbai', dest: 'Goa', dir: 'out',
  date: iso(addDays(TODAY, 14)), hIn: iso(addDays(TODAY, 14)), hOut: iso(addDays(TODAY, 17)),
  nonstop: false, fSort: 'price', maxPrice: 'any', minStars: '0', hSort: 'price', cat: 'all', aSort: 'price', favoritesOnly: false, searchTerm: ''
};
let lastResults = {};
let modalItem = null;
let planDest = null;

const findTrip = id => state.trips.find(t => t.id === id);
const tripSpent = t => t.bookings.reduce((s, b) => s + b.price, 0);
const dayCount = t => daysBetween(t.start, t.end) + 1;
const defaultPrefs = () => ({ interests: [], pace: 'balanced', avoidPricey: false });

function tripStatus(t) {
  const s = daysUntil(t.start), e = daysUntil(t.end);
  if (e < 0) return { k: 'done', label: 'Completed' };
  if (s <= 0) return { k: 'live', label: `In progress · Day ${1 - s} of ${dayCount(t)}` };
  return { k: 'soon', label: s === 1 ? 'Starts tomorrow' : `Starts in ${s} days` };
}

/* ---------- UI utilities ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function show(view) {
  ui.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.mobile-nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  RENDER[view]();
  updateBadge();
  window.scrollTo({ top: 0 });
}

function updateBadge() {
  const n = buildAlerts().filter(a => a.level !== 'info').length;
  const b = $('#badge');
  b.textContent = n; b.hidden = n === 0;
}

const emptyState = (icon, title, text, btn) =>
  `<div class="card empty"><div class="big">${svgIcon('travel')}</div><h3>${title}</h3><p>${text}</p>${btn || ''}</div>`;

const destOptions = sel => Object.keys(DEST).map(d => `<option value="${d}" ${d === sel ? 'selected' : ''}>${DEST[d].emoji} ${d}, ${DEST[d].country}</option>`).join('');

function prefsHTML(p) {
  return `
    <div class="field full"><span>What do you enjoy? (pick any)</span>
      <div class="chips">${Object.entries(CATS).map(([k, v]) =>
        `<label class="chip"><input type="checkbox" name="interest" value="${k}" ${p.interests.includes(k) ? 'checked' : ''}><span>${CAT_ICON[k]} ${v}</span></label>`).join('')}
      </div></div>
    <label class="field"><span>Travel pace</span>
      <select name="pace">
        <option value="relaxed" ${p.pace === 'relaxed' ? 'selected' : ''}>Relaxed – 2 activities a day</option>
        <option value="balanced" ${p.pace === 'balanced' ? 'selected' : ''}>Balanced – 3 activities a day</option>
        <option value="packed" ${p.pace === 'packed' ? 'selected' : ''}>Packed – 4 activities a day</option>
      </select></label>
    <label class="check"><input type="checkbox" name="pricey" ${p.avoidPricey ? 'checked' : ''}> Skip activities above ₹2,500 per person</label>`;
}

function readPrefs(fd) {
  return { interests: fd.getAll('interest'), pace: fd.get('pace') || 'balanced', avoidPricey: fd.get('pricey') === 'on' };
}

/* ---------- itinerary generator (personalised by preferences) ---------- */
function generateItinerary(trip) {
  const D = DEST[trip.dest], p = trip.prefs || defaultPrefs();
  let pool = D.acts.map(([name, cat, hours, price, desc]) => ({ title: name, cat, hours, cost: price * trip.travelers, note: desc }));
  if (p.avoidPricey) pool = pool.filter(a => a.cost / trip.travelers <= 2500);
  const liked = pool.filter(a => p.interests.includes(a.cat));
  const rest = pool.filter(a => !p.interests.includes(a.cat));
  const ordered = [...liked, ...rest];

  const perDay = { relaxed: 2, balanced: 3, packed: 4 }[p.pace] || 3;
  const slots = { 2: ['10:00', '16:30'], 3: ['09:00', '13:30', '18:30'], 4: ['08:30', '11:30', '15:00', '19:00'] }[perDay];
  const n = dayCount(trip);
  let ptr = 0;
  const take = () => ptr < ordered.length
    ? { ...ordered[ptr++] }
    : { title: 'Free time – wander local cafés & markets', cat: 'relaxation', hours: 2, cost: 0, note: 'Unplanned time to explore at your own pace.' };

  const days = [];
  for (let i = 0; i < n; i++) {
    const first = i === 0, last = i === n - 1;
    const items = [];
    let count = perDay - (first ? 1 : 0) - (last ? 1 : 0);
    count = Math.max(1, count);
    let times = slots;
    if (first) { items.push({ time: '14:00', title: 'Arrive & check in to the hotel', cat: 'travel', cost: 0, note: 'Settle in, freshen up and pick up a local SIM or map.' }); times = ['17:00', '19:30', '21:00']; }
    else if (last) times = ['08:30', '10:30', '11:30'];
    for (let k = 0; k < count; k++) items.push({ ...take(), time: times[k] || '12:00' });
    if (last) items.push({ time: last && first ? '21:00' : '13:00', title: 'Check out & head to the airport', cat: 'travel', cost: 0, note: 'Keep documents and tickets handy.' });
    items.forEach(it => { it.id = uid(); });
    items.sort((a, b) => a.time.localeCompare(b.time));
    days.push({ date: iso(addDays(parseD(trip.start), i)), items });
  }
  trip.itinerary = days;
}

/* ---------- alerts ---------- */
function buildAlerts() {
  const out = [];
  state.trips.forEach(t => {
    const st = tripStatus(t);
    if (st.k === 'done') return;
    const s = daysUntil(t.start), spent = tripSpent(t);
    const types = new Set(t.bookings.map(b => b.type));

    if (spent > t.budget) out.push({ level: 'danger', icon: '💸', title: `Over budget: ${t.name}`, text: `You have spent ${fmt(spent)} against a budget of ${fmt(t.budget)} (${fmt(spent - t.budget)} over).`, trip: t.id, view: 'trips', cta: 'Review bookings', order: -1 });
    else if (t.budget > 0 && spent >= 0.8 * t.budget) out.push({ level: 'warn', icon: '⚠️', title: `Budget almost used: ${t.name}`, text: `${Math.round(spent / t.budget * 100)}% of your ${fmt(t.budget)} budget is already booked.`, trip: t.id, view: 'trips', cta: 'Review bookings', order: 0 });

    if (st.k === 'soon' && s <= 7) out.push({ level: 'warn', icon: '🧳', title: `${t.name} starts ${when(s)}`, text: `Check your bookings and pack for ${plural(dayCount(t), 'day')} in ${t.dest}.`, trip: t.id, view: 'trips', cta: 'Open trip', order: s });
    if (st.k === 'live') out.push({ level: 'info', icon: '📍', title: `${t.name} is in progress`, text: st.label.replace('In progress · ', '') + '. Check today\'s plan.', trip: t.id, view: 'itinerary', cta: 'See itinerary', order: 0 });
    if (st.k === 'soon' && s <= 60 && !types.has('flight')) out.push({ level: 'warn', icon: '✈️', title: `No flight booked for ${t.name}`, text: `Your trip starts ${when(s)} and no flight has been added yet.`, trip: t.id, view: 'search', tab: 'flights', cta: 'Find flights', order: s });
    if (st.k === 'soon' && s <= 60 && !types.has('hotel')) out.push({ level: 'warn', icon: '🏨', title: `No hotel booked for ${t.name}`, text: `Add a stay in ${t.dest} before prices go up.`, trip: t.id, view: 'search', tab: 'hotels', cta: 'Find hotels', order: s + 1 });
    if (!t.itinerary || !t.itinerary.length) out.push({ level: 'info', icon: '📅', title: `No itinerary for ${t.name}`, text: 'Generate a day-by-day plan based on your preferences.', trip: t.id, view: 'itinerary', cta: 'Create itinerary', order: 50 });

    t.bookings.forEach(b => {
      const d = daysUntil(b.date);
      if (d < 0 || d > 14) return;
      const label = b.type === 'hotel' ? 'Hotel check-in' : b.type === 'flight' ? 'Flight' : 'Activity';
      out.push({ level: d <= 1 ? 'warn' : 'info', icon: TYPE_ICON[b.type], title: `${label} ${when(d)}: ${b.title}`, text: `${fmtDay(b.date)} at ${b.time} · ${t.name}`, trip: t.id, view: 'trips', cta: 'View trip', order: d });
    });
  });
  const rank = { danger: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level] || a.order - b.order);
}

function alertHTML(a) {
  return `<div class="alert ${a.level}">
    <div class="ai">${svgIcon(a.level === 'danger' ? 'alert' : 'bell')}</div>
    <div><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div>
    <button class="btn ghost small" data-action="goto" data-view="${a.view}" data-trip="${a.trip}" ${a.tab ? `data-tab="${a.tab}"` : ''}>${a.cta}</button>
  </div>`;
}

/* =====================================================================
   VIEWS
   ===================================================================== */
const RENDER = { dashboard: renderDashboard, plan: renderPlan, search: renderSearch, trips: renderTrips, itinerary: renderItinerary, alerts: renderAlerts };

/* ---------- destination hero carousel ---------- */
const HOME_QUOTES = {
  Goa: 'Let the tide slow down your sense of time.',
  Jaipur: 'Every quiet courtyard has a story to tell.',
  Manali: 'Take the long way to the mountains.',
  Kerala: 'Some journeys are best measured by the water.',
  Dubai: 'The horizon is only the beginning.',
  Singapore: 'Find a little wonder on every street.'
};
const CAROUSEL_MS = 7000;
const carouselReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let carouselIndex = 0;
let carouselPaused = carouselReducedMotion;
let carouselTimer = null;

function carouselHTML() {
  const names = Object.keys(DEST).filter(name => HOME_QUOTES[name]);
  return `<section class="destination-carousel ${carouselPaused ? 'paused' : ''}" aria-label="Featured destinations" aria-roledescription="carousel" tabindex="0">
    <div class="carousel-slides">${names.map((name, i) => {
      const d = DEST[name];
      return `<article class="carousel-slide ${i === carouselIndex ? 'active' : ''}" data-slide="${i}" aria-roledescription="slide" aria-label="${i + 1} of ${names.length}: ${esc(name)}" aria-hidden="${i !== carouselIndex}" ${i !== carouselIndex ? 'inert' : ''}>
        <div class="carousel-fallback" aria-hidden="true"><span>${d.emoji}</span></div>
        <img class="carousel-photo" ${i < 2 ? `src="${d.img}"` : `data-src="${d.img}"`} alt="${esc(name)} destination landscape" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        <div class="carousel-shade"></div>
        <div class="carousel-copy"><span class="carousel-kicker">${esc(d.country)} · CURATED FOR YOU</span><h2>${esc(name)}</h2><p class="carousel-quote">“${esc(HOME_QUOTES[name])}”</p><div class="row"><button class="btn carousel-cta" data-action="plan-dest" data-dest="${esc(name)}">Plan a trip</button><button class="btn ghost carousel-more" data-action="destination" data-dest="${esc(name)}">Discover ${esc(name)}</button></div></div>
        <a class="carousel-credit" href="${esc(d.imgSource)}" target="_blank" rel="noopener noreferrer" aria-label="Photo credit: ${esc(d.imgCredit)}">${esc(d.imgCredit)}</a>
      </article>`;
    }).join('')}</div>
    <div class="carousel-controls"><div class="carousel-dots" role="group" aria-label="Choose a featured destination">${names.map((name, i) => `<button type="button" class="carousel-dot ${i === carouselIndex ? 'active' : ''}" data-action="carousel-go" data-index="${i}" aria-label="Show ${esc(name)}" aria-current="${i === carouselIndex ? 'true' : 'false'}"></button>`).join('')}</div>
      <div class="carousel-tools"><div class="carousel-progress" role="progressbar" aria-label="Time until next destination" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="carouselProgress"></i></div><button type="button" class="carousel-play" data-action="carousel-toggle" aria-label="${carouselPaused ? 'Play' : 'Pause'} slideshow">${carouselPaused ? '▶' : 'Ⅱ'}</button></div>
    </div>
    <button type="button" class="carousel-arrow previous" data-action="carousel-prev" aria-label="Previous destination">‹</button><button type="button" class="carousel-arrow next" data-action="carousel-next" aria-label="Next destination">›</button>
  </section>`;
}

function loadCarouselImage(index) {
  const img = $(`.carousel-slide[data-slide="${index}"] .carousel-photo`);
  if (img?.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
}

function setCarouselUI() {
  const slides = $$('.carousel-slide');
  if (!slides.length) return;
  slides.forEach((slide, i) => {
    const active = i === carouselIndex;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.inert = !active;
  });
  $$('.carousel-dot').forEach((dot, i) => {
    const active = i === carouselIndex;
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-current', String(active));
  });
  const p = $('.carousel-progress');
  if (p) p.setAttribute('aria-valuenow', '0');
  loadCarouselImage(carouselIndex);
  loadCarouselImage((carouselIndex + 1) % slides.length);
}

function startCarousel() {
  clearInterval(carouselTimer);
  carouselTimer = null;
  const progress = $('#carouselProgress');
  const bar = $('.carousel-progress');
  if (!progress || !bar) return;
  progress.style.width = '0%';
  bar.setAttribute('aria-valuenow', '0');
  if (carouselPaused) return;
  const started = Date.now();
  carouselTimer = setInterval(() => {
    const percent = Math.min(100, (Date.now() - started) / CAROUSEL_MS * 100);
    progress.style.width = `${percent}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(percent)));
    if (percent >= 100) goSlide(carouselIndex + 1);
  }, 80);
}

function goSlide(index) {
  const count = $$('.carousel-slide').length;
  carouselIndex = (index + count) % count;
  setCarouselUI();
  if (!carouselPaused) startCarousel();
}

function toggleCarousel() {
  carouselPaused = !carouselPaused;
  const section = $('.destination-carousel');
  if (!section) return;
  section.classList.toggle('paused', carouselPaused);
  const button = $('.carousel-play');
  if (button) { button.textContent = carouselPaused ? '▶' : 'Ⅱ'; button.setAttribute('aria-label', `${carouselPaused ? 'Play' : 'Pause'} slideshow`); }
  if (carouselPaused) { clearInterval(carouselTimer); carouselTimer = null; }
  else startCarousel();
}

function bindCarousel() {
  const section = $('.destination-carousel');
  if (!section) return;
  section.querySelectorAll('.carousel-photo').forEach(img => {
    img.onerror = () => { img.hidden = true; img.closest('.carousel-slide')?.classList.add('image-missing'); };
    img.onload = () => { img.closest('.carousel-slide')?.classList.add('image-loaded'); };
  });
  setCarouselUI();
  startCarousel();
  let startX = null;
  section.addEventListener('pointerdown', e => { startX = e.clientX; });
  section.addEventListener('pointerup', e => {
    if (startX === null) return;
    const distance = e.clientX - startX; startX = null;
    if (Math.abs(distance) > 50) goSlide(carouselIndex + (distance < 0 ? 1 : -1));
  });
}

document.addEventListener('keydown', e => {
  if (ui.view !== 'dashboard' || !e.target.closest?.('.destination-carousel')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); goSlide(carouselIndex + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goSlide(carouselIndex - 1); }
});

/* ---------- dashboard ---------- */
function renderDashboard() {
  const el = $('#view-dashboard');
  const trips = state.trips;
  const upcoming = trips.filter(t => tripStatus(t).k !== 'done').sort((a, b) => a.start.localeCompare(b.start));
  const bookings = trips.reduce((s, t) => s + t.bookings.length, 0);
  const spend = trips.reduce((s, t) => s + tripSpent(t), 0);
  const next = upcoming[0];

  let hero;
  if (next) {
    const st = tripStatus(next), spent = tripSpent(next), pct = next.budget ? Math.min(100, spent / next.budget * 100) : 0;
    const big = st.k === 'live' ? `Day ${1 - daysUntil(next.start)}` : daysUntil(next.start);
    const small = st.k === 'live' ? `of ${dayCount(next)}` : 'days to go';
    hero = `<div class="card hero">
      <div style="flex:1;min-width:240px">
        <small>${st.k === 'live' ? 'Happening now' : 'Your next trip'}</small>
        <h2>${DEST[next.dest].emoji} ${esc(next.name)}</h2>
        <p>${esc(next.dest)} · ${fmtDate(next.start)} – ${fmtDate(next.end)} · ${plural(next.travelers, 'traveller')}</p>
        <div class="progress" style="margin-top:14px"><i style="width:${pct}%"></i></div>
        <p class="small-text" style="margin-top:6px">${fmt(spent)} of ${fmt(next.budget)} budget used</p>
        <div class="row" style="margin-top:14px">
          <button class="btn ghost small" data-action="open-trip" data-trip="${next.id}">Open trip</button>
          <button class="btn ghost small" data-action="goto" data-view="itinerary" data-trip="${next.id}">Itinerary</button>
        </div>
      </div>
      <div class="countdown"><b>${big}</b><span>${small}</span></div>
    </div>`;
  } else {
    hero = `<div class="card hero">
      <div><h2>Where to next?</h2><p>Create your first trip and let PlanMyTrip organise the rest.</p></div>
      <div class="row"><button class="btn accent" data-action="nav" data-view="plan">Plan a trip</button><button class="btn ghost" data-action="demo">Try demo trip</button></div>
    </div>`;
  }

  const alerts = buildAlerts().slice(0, 3);
  el.innerHTML = `
    <div class="page-head"><h1>Welcome back</h1><p>Your trips, bookings and reminders at a glance.</p></div>
    ${carouselHTML()}
    ${hero}
    <div class="grid cols-4 mt">
      <div class="card stat"><div class="ico">${svgIcon('bag')}</div><div><b>${trips.length}</b><span>Total trips</span></div></div>
      <div class="card stat"><div class="ico">${svgIcon('calendar')}</div><div><b>${upcoming.length}</b><span>Upcoming / active</span></div></div>
      <div class="card stat"><div class="ico">${svgIcon('ticket')}</div><div><b>${bookings}</b><span>Bookings saved</span></div></div>
      <div class="card stat"><div class="ico">${svgIcon('activity')}</div><div><b>${fmt(spend)}</b><span>Total planned spend</span></div></div>
    </div>
    <div class="grid cols-2 mt">
      <div class="card" style="margin:0">
        <h3>Quick actions</h3>
        <div class="row">
          <button class="btn" data-action="nav" data-view="plan">+ New trip</button>
          <button class="btn ghost" data-action="search-tab" data-tab="flights">${svgIcon('flight')} Flights</button>
          <button class="btn ghost" data-action="search-tab" data-tab="hotels">${svgIcon('hotel')} Hotels</button>
          <button class="btn ghost" data-action="search-tab" data-tab="activities">${svgIcon('activity')} Activities</button>
        </div>
        <h3 style="margin-top:22px">Budget overview</h3>
        ${trips.length ? trips.map(t => {
          const spent = tripSpent(t), pct = t.budget ? spent / t.budget * 100 : 0;
          return `<div class="bar-row"><span>${esc(t.name)}</span><div class="progress ${pct > 100 ? 'over' : pct >= 80 ? 'warn' : ''}"><i style="width:${Math.min(100, pct)}%"></i></div><span class="muted">${fmt(spent)} / ${fmt(t.budget)}</span></div>`;
        }).join('') : '<p class="muted small-text">No trips yet – budgets will show up here.</p>'}
      </div>
      <div class="card" style="margin:0">
        <div class="row"><h3 style="margin:0">Latest alerts</h3><span class="spacer"></span><button class="btn ghost small" data-action="nav" data-view="alerts">View all</button></div>
        <div style="margin-top:12px">${alerts.length ? alerts.map(alertHTML).join('') : '<p class="muted small-text">All clear – nothing needs your attention. ✅</p>'}</div>
      </div>
    </div>
    <section class="destinations-section">
      <div class="row"><div><h2>Find your next escape</h2><p class="muted small-text">A few places to start dreaming.</p></div><span class="spacer"></span>
      <label class="check"><input id="favoritesOnly" type="checkbox" ${ui.favoritesOnly ? 'checked' : ''}> Favourites</label></div>
      <div class="destination-grid">${Object.entries(DEST).filter(([name]) => !HOME_QUOTES[name] && (!ui.favoritesOnly || state.favorites.includes(name))).map(([name, d]) => `<article class="destination-card">
        <div class="destination-art" aria-hidden="true"><img src="${esc(d.img)}" alt="" loading="lazy" onerror="this.hidden=true"><small>${esc(d.country)}</small></div>
        <div class="destination-body"><div class="row"><h3>${esc(name)}</h3><span class="spacer"></span><button class="icon-btn favorite-btn ${state.favorites.includes(name) ? 'selected' : ''}" aria-label="${state.favorites.includes(name) ? 'Remove from' : 'Add to'} favourites: ${esc(name)}" aria-pressed="${state.favorites.includes(name)}" data-action="favorite" data-dest="${esc(name)}">${state.favorites.includes(name) ? '♥' : '♡'}</button></div>
        <p class="muted small-text">${esc(d.tag)}</p><div class="row destination-actions"><button class="btn ghost small" data-action="destination" data-dest="${esc(name)}">Explore</button><button class="btn small" data-action="plan-dest" data-dest="${esc(name)}">Plan trip</button></div></div>
      </article>`).join('') || '<div class="empty card">No favourites yet. Save a destination with the heart to see it here.</div>'}</div>
    </section>`;
  bindCarousel();
}

/* ---------- plan a trip ---------- */
function renderPlan() {
  const el = $('#view-plan');
  const dest = planDest || 'Goa';
  const start = iso(addDays(TODAY, 14));
  el.innerHTML = `
    <div class="page-head"><h1>Plan a new trip</h1><p>Tell us where, when and what you like – we'll set up the trip and draft an itinerary.</p></div>
    <form id="planForm" class="card" novalidate>
      <div class="form-grid">
        <label class="field"><span>Trip name</span><input type="text" name="tripName" placeholder="e.g. Family holiday" maxlength="40"></label>
        <label class="field"><span>Destination</span><select name="dest">${destOptions(dest)}</select></label>
        <label class="field"><span>Start date</span><input type="date" name="start" min="${TODAY_ISO}" value="${start}" required></label>
        <label class="field"><span>End date</span><input type="date" name="end" min="${start}" value="${iso(addDays(TODAY, 17))}" required></label>
        <label class="field"><span>Travellers</span><input type="number" name="travelers" min="1" max="20" value="2" required></label>
        <label class="field"><span>Total budget (₹)</span><input type="number" name="budget" min="1000" step="500" value="50000" required></label>
      </div>
      <h3 style="margin:22px 0 12px">Your preferences</h3>
      <div class="form-grid">${prefsHTML(defaultPrefs())}</div>
      <p id="planTag" class="muted small-text" style="margin-top:14px">${DEST[dest].emoji} ${DEST[dest].tag}</p>
      <p class="form-error" id="planError"></p>
      <div class="row"><button class="btn" type="submit">Create trip &amp; generate itinerary</button></div>
    </form>`;
}

function submitPlan(form) {
  const fd = new FormData(form);
  const dest = fd.get('dest'), start = fd.get('start'), end = fd.get('end');
  const travelers = parseInt(fd.get('travelers'), 10), budget = parseInt(fd.get('budget'), 10);
  const err = msg => { $('#planError').textContent = msg; };
  if (!start || !end) return err('Please choose both start and end dates.');
  if (start < TODAY_ISO) return err('Start date cannot be in the past.');
  if (end < start) return err('End date must be on or after the start date.');
  if (daysBetween(start, end) > 29) return err('Trips longer than 30 days are not supported in this prototype.');
  if (!(travelers >= 1)) return err('Enter at least one traveller.');
  if (!(budget >= 1)) return err('Enter a valid budget.');
  const trip = {
    id: uid(), name: (fd.get('tripName') || '').trim() || `${dest} getaway`, dest, start, end,
    travelers, budget, prefs: readPrefs(fd), bookings: [], itinerary: [], checklist: []
  };
  generateItinerary(trip);
  state.trips.push(trip); save();
  planDest = null;
  ui.openTrip = trip.id;
  toast('Trip created with a draft itinerary ✨');
  show('trips');
}

/* ---------- search & book ---------- */
function renderSearch() {
  const el = $('#view-search');
  const tabs = [['flights', '✈️ Flights'], ['hotels', '🏨 Hotels'], ['activities', '🎟️ Activities']];
  el.innerHTML = `
    <div class="page-head"><h1>Search &amp; organise</h1><p>Find flights, hotels and things to do, then add them straight to a trip.</p></div>
    <div class="tabs">${tabs.map(([k, l]) => `<button data-action="tab" data-tab="${k}" class="${ui.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
    <div class="card"><div class="form-grid">${filtersHTML()}</div></div>
    <div id="results" class="mt"></div>`;
  renderResults();
}

function selectField(key, label, options) {
  return `<label class="field"><span>${label}</span><select data-ui="${key}">${options.map(([v, t]) =>
    `<option value="${v}" ${String(ui[key]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
}

function filtersHTML() {
  const destSel = `<label class="field"><span>Destination</span><select data-ui="dest">${destOptions(ui.dest)}</select></label>`;
  if (ui.tab === 'flights') return `
    ${selectField('dir', 'Journey', [['out', 'Outbound (home → destination)'], ['ret', 'Return (destination → home)']])}
    ${selectField('origin', 'Home city', CITIES.map(c => [c, c]))}
    ${destSel}
    <label class="field"><span>Date</span><input type="date" data-ui="date" min="${TODAY_ISO}" value="${ui.date}"></label>
    ${selectField('fSort', 'Sort by', [['price', 'Cheapest'], ['duration', 'Fastest'], ['departure', 'Earliest departure']])}
    <label class="check" style="align-self:end;padding-bottom:10px"><input type="checkbox" data-ui="nonstop" ${ui.nonstop ? 'checked' : ''}> Non-stop only</label>`;
  if (ui.tab === 'hotels') return `
    ${destSel}
    <label class="field"><span>Check-in</span><input type="date" data-ui="hIn" min="${TODAY_ISO}" value="${ui.hIn}"></label>
    <label class="field"><span>Check-out</span><input type="date" data-ui="hOut" min="${ui.hIn}" value="${ui.hOut}"></label>
    ${selectField('maxPrice', 'Max price / night', [['any', 'Any'], ['3000', 'Up to ₹3,000'], ['6000', 'Up to ₹6,000'], ['12000', 'Up to ₹12,000']])}
    ${selectField('minStars', 'Minimum stars', [['0', 'Any'], ['3', '3★ & up'], ['4', '4★ & up'], ['5', '5★ only']])}
    ${selectField('hSort', 'Sort by', [['price', 'Lowest price'], ['stars', 'Highest rating']])}`;
  return `
    ${destSel}
    ${selectField('cat', 'Category', [['all', 'All'], ...Object.entries(CATS)])}
    ${selectField('maxPrice', 'Max price / person', [['any', 'Any'], ['1000', 'Up to ₹1,000'], ['2500', 'Up to ₹2,500'], ['5000', 'Up to ₹5,000']])}
    ${selectField('aSort', 'Sort by', [['price', 'Lowest price'], ['duration', 'Shortest']])}`;
}

function renderResults() {
  const box = $('#results');
  if (!box) return;
  lastResults = {};
  let html = '';
  const reg = list => list.forEach(i => { lastResults[i.id] = i; });
  const D = DEST[ui.dest];

  if (ui.tab === 'flights') {
    if (!ui.date || ui.date < TODAY_ISO) { box.innerHTML = emptyState('📅', 'Pick a valid date', 'Choose today or a future date to see flights.'); return; }
    let list = getFlights(ui.origin, ui.dest, ui.date, ui.dir === 'ret');
    if (ui.nonstop) list = list.filter(f => f.stops === 0);
    list.sort((a, b) => ui.fSort === 'duration' ? a.dur - b.dur : ui.fSort === 'departure' ? a.dep.localeCompare(b.dep) : a.price - b.price);
    reg(list);
    html = `<p class="muted small-text" style="margin-bottom:10px">${list.length} flights · ${list[0] ? list[0].from : ''} → ${list[0] ? list[0].to : ''} · ${fmtDate(ui.date)} · price per person</p>` +
      (list.map(f => `<div class="result">
        <div><h4>${f.airline} <span class="muted">${f.code}</span></h4>
          <div class="flight-line">
            <div><div class="t">${f.dep}</div><small class="muted">${esc(f.from)}</small></div>
            <div class="arrow">${Math.floor(f.dur / 60)}h ${f.dur % 60}m<i></i>${f.stops ? '1 stop' : 'Non-stop'}</div>
            <div><div class="t">${f.arr}${f.nextDay ? '<sup>+1</sup>' : ''}</div><small class="muted">${esc(f.to)}</small></div>
          </div></div>
        <div class="price"><b>${fmt(f.price)}</b><small>per person</small><br><button class="btn small" data-action="add" data-id="${f.id}">Add to trip</button></div>
      </div>`).join('') || emptyState('🔍', 'No flights match', 'Try turning off the non-stop filter.'));
  }

  if (ui.tab === 'hotels') {
    if (!ui.hIn || ui.hIn < TODAY_ISO || !ui.hOut || ui.hOut <= ui.hIn) { box.innerHTML = emptyState('📅', 'Check your dates', 'Check-out must be after check-in, and check-in cannot be in the past.'); return; }
    let list = getHotels(ui.dest, ui.hIn, ui.hOut);
    if (ui.maxPrice !== 'any') list = list.filter(h => h.price <= Number(ui.maxPrice));
    list = list.filter(h => h.stars >= Number(ui.minStars));
    list.sort((a, b) => ui.hSort === 'stars' ? b.stars - a.stars : a.price - b.price);
    reg(list);
    html = `<p class="muted small-text" style="margin-bottom:10px">${list.length} stays in ${ui.dest} · ${plural(list[0] ? list[0].nights : daysBetween(ui.hIn, ui.hOut), 'night')}</p>` +
      (list.map(h => `<div class="result">
        <div><h4>${esc(h.name)}</h4>
          <div class="meta"><span class="stars">${'★'.repeat(h.stars)}${'☆'.repeat(5 - h.stars)}</span> · ${esc(h.area)}, ${ui.dest}</div>
          <div class="meta">${fmtDate(h.checkIn)} → ${fmtDate(h.checkOut)}</div></div>
        <div class="price"><b>${fmt(h.price)}</b><small>per night · ${fmt(h.price * h.nights)} total</small><br><button class="btn small" data-action="add" data-id="${h.id}">Add to trip</button></div>
      </div>`).join('') || emptyState('🔍', 'No hotels match', 'Loosen the price or star filters.'));
  }

  if (ui.tab === 'activities') {
    let list = getActivities(ui.dest);
    if (ui.cat !== 'all') list = list.filter(a => a.cat === ui.cat);
    if (ui.maxPrice !== 'any') list = list.filter(a => a.price <= Number(ui.maxPrice));
    if (ui.searchTerm) list = list.filter(a => `${a.name} ${a.desc} ${a.cat} ${ui.dest}`.toLowerCase().includes(ui.searchTerm.toLowerCase()));
    list.sort((a, b) => ui.aSort === 'duration' ? a.hours - b.hours : a.price - b.price);
    reg(list);
    html = `<p class="muted small-text" style="margin-bottom:10px">${list.length} experiences in ${ui.dest} – ${D.tag.toLowerCase()}</p>` +
      (list.map(a => `<div class="result">
        <div><h4>${CAT_ICON[a.cat]} ${esc(a.name)}</h4>
          <div class="meta">${esc(a.desc)}</div>
          <div class="meta"><span class="badge ${a.cat}">${CATS[a.cat]}</span> · about ${a.hours}h</div></div>
        <div class="price"><b>${fmt(a.price)}</b><small>per person</small><br><button class="btn small" data-action="add" data-id="${a.id}">Add to trip</button></div>
      </div>`).join('') || emptyState('🔍', 'Nothing found', 'Try a different category or price.'));
  }
  box.innerHTML = html;
}

/* ---------- add-to-trip modal ---------- */
function openAdd(id) {
  const item = lastResults[id];
  if (!item) return;
  modalItem = item;
  const m = $('#modal');
  const trips = state.trips.filter(t => t.dest === item.dest && tripStatus(t).k !== 'done');
  if (!trips.length) {
    m.innerHTML = `<h3>No ${esc(item.dest)} trip yet</h3>
      <p class="muted">Create a trip to ${esc(item.dest)} first, then you can add this to it.</p>
      <div class="modal-actions"><button class="btn ghost" data-action="close-modal">Cancel</button>
      <button class="btn" data-action="plan-dest" data-dest="${esc(item.dest)}">Plan a ${esc(item.dest)} trip</button></div>`;
    m.showModal(); return;
  }
  const title = item.type === 'flight' ? `${item.airline} ${item.code}` : item.name;
  let extra = '';
  if (item.type === 'flight') extra = `<p class="muted small-text" style="margin-top:12px">${esc(item.from)} → ${esc(item.to)} on ${fmtDate(item.date)}, departs ${item.dep}</p>`;
  if (item.type === 'hotel') extra = `<p class="muted small-text" style="margin-top:12px">${fmtDate(item.checkIn)} → ${fmtDate(item.checkOut)} (${plural(item.nights, 'night')}). One room per 2 travellers.</p>`;
  if (item.type === 'activity') extra = `
    <div class="form-grid" style="margin-top:12px">
      <label class="field"><span>Date</span><input type="date" name="date" required></label>
      <label class="field"><span>Time</span><input type="time" name="time" value="10:00" required></label>
    </div>`;
  m.innerHTML = `<form id="modalForm" novalidate>
      <h3>Add to trip</h3>
      <p><b>${esc(title)}</b></p>
      <label class="field" style="margin-top:12px"><span>Choose trip</span>
        <select name="trip">${trips.map(t => `<option value="${t.id}">${esc(t.name)} (${fmtDate(t.start)})</option>`).join('')}</select></label>
      ${extra}
      <div class="summary" id="modalSummary"></div>
      <p class="form-error" id="modalError"></p>
      <div class="modal-actions"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button><button class="btn" type="submit">Add booking</button></div>
    </form>`;
  m.showModal();
  syncModal();
}

function pricing(item, trip) {
  const n = trip.travelers;
  if (item.type === 'flight') return { total: item.price * n, text: `${fmt(item.price)} × ${plural(n, 'traveller')}` };
  if (item.type === 'hotel') { const rooms = Math.ceil(n / 2); return { total: item.price * item.nights * rooms, text: `${fmt(item.price)} × ${plural(item.nights, 'night')} × ${plural(rooms, 'room')}` }; }
  return { total: item.price * n, text: `${fmt(item.price)} × ${plural(n, 'traveller')}` };
}

function syncModal() {
  const form = $('#modalForm');
  if (!form || !modalItem) return;
  const trip = findTrip(form.elements.trip.value);
  const p = pricing(modalItem, trip);
  const left = trip.budget - tripSpent(trip) - p.total;
  $('#modalSummary').innerHTML = `Total: <b>${fmt(p.total)}</b><br><span class="muted">${p.text}</span><br>
    <span class="${left < 0 ? '' : 'muted'}" style="${left < 0 ? 'color:var(--danger)' : ''}">${left < 0 ? `This puts you ${fmt(-left)} over budget` : `${fmt(left)} of budget left after this`}</span>`;
  if (modalItem.type === 'activity') {
    const d = form.elements.date;
    d.min = trip.start; d.max = trip.end;
    if (!d.value || d.value < trip.start || d.value > trip.end) d.value = trip.start;
  }
}

function submitAdd(form) {
  const item = modalItem, trip = findTrip(form.elements.trip.value);
  if (!item || !trip) return;
  const p = pricing(item, trip), n = trip.travelers;
  let b;
  if (item.type === 'flight') b = { type: 'flight', title: `${item.airline} ${item.code}`, detail: `${item.from} → ${item.to} · ${item.dep}–${item.arr}${item.nextDay ? ' (+1)' : ''} · ${plural(n, 'traveller')}`, date: item.date, time: item.dep };
  else if (item.type === 'hotel') b = { type: 'hotel', title: item.name, detail: `${item.stars}★ · ${item.area} · ${fmtDate(item.checkIn)} → ${fmtDate(item.checkOut)}`, date: item.checkIn, endDate: item.checkOut, time: '14:00' };
  else {
    const date = form.elements.date.value, time = form.elements.time.value;
    if (!date || date < trip.start || date > trip.end) { $('#modalError').textContent = 'Pick a date within the trip dates.'; return; }
    b = { type: 'activity', title: item.name, detail: `${CATS[item.cat]} · about ${item.hours}h · ${plural(n, 'traveller')}`, date, time: time || '10:00' };
  }
  const bookingRef = 'TM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  trip.bookings.push({ id: uid(), ref: bookingRef, price: p.total, ...b });
  save(); updateBadge();
  $('#modal').innerHTML = `<div class="confirmation-mark" aria-hidden="true">✓</div><p class="eyebrow">BOOKING SAVED</p><h2>It's in the plan.</h2><p class="muted">${esc(b.title)} has been added to ${esc(trip.name)}.</p><div class="summary"><span>Booking reference</span><br><b>${bookingRef}</b><hr><span>Price breakdown</span><br>${esc(p.text)}<br><b>${fmt(p.total)} total</b></div><div class="modal-actions"><button class="btn" data-action="booking-done" data-trip="${trip.id}">View trip</button></div>`;
  modalItem = null;
}

/* ---------- my trips ---------- */
function renderTrips() {
  const el = $('#view-trips');
  if (ui.openTrip && findTrip(ui.openTrip)) return renderTripDetail(el, findTrip(ui.openTrip));
  ui.openTrip = null;
  if (!state.trips.length) {
    el.innerHTML = `<div class="page-head"><h1>My trips</h1></div>` +
      emptyState('🧳', 'No trips yet', 'Create a trip to start adding flights, hotels and activities.', '<button class="btn" data-action="nav" data-view="plan">Plan a trip</button>');
    return;
  }
  const sorted = [...state.trips].sort((a, b) => a.start.localeCompare(b.start));
  el.innerHTML = `
    <div class="page-head row"><div><h1>My trips</h1><p>${plural(state.trips.length, 'trip')} saved</p></div>
      <button class="btn" data-action="nav" data-view="plan">+ New trip</button></div>
    <div class="grid cols-3">${sorted.map(t => {
      const st = tripStatus(t), spent = tripSpent(t), pct = t.budget ? spent / t.budget * 100 : 0;
      return `<div class="card trip-card">
        <div class="row"><span class="emoji">${DEST[t.dest].emoji}</span><span class="spacer"></span><span class="badge ${st.k}">${st.label}</span></div>
        <h3 style="margin:0">${esc(t.name)}</h3>
        <p class="muted small-text">${esc(t.dest)} · ${fmtDate(t.start)} – ${fmtDate(t.end)}<br>${plural(t.travelers, 'traveller')} · ${plural(t.bookings.length, 'booking')}</p>
        <div class="progress ${pct > 100 ? 'over' : pct >= 80 ? 'warn' : ''}"><i style="width:${Math.min(100, pct)}%"></i></div>
        <p class="small-text muted">${fmt(spent)} of ${fmt(t.budget)}</p>
        <button class="btn ghost small" data-action="open-trip" data-trip="${t.id}">Open trip</button>
      </div>`;
    }).join('')}</div>`;
}

function renderTripDetail(el, t) {
  const st = tripStatus(t), spent = tripSpent(t), pct = t.budget ? spent / t.budget * 100 : 0;
  const bookings = [...t.bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  el.innerHTML = `
    <div class="page-head"><button class="btn ghost small" data-action="close-trip">← All trips</button></div>
    <div class="card hero">
      <div style="flex:1;min-width:240px">
        <h2>${DEST[t.dest].emoji} ${esc(t.name)}</h2>
        <p>${esc(t.dest)}, ${esc(DEST[t.dest].country)} · ${fmtDate(t.start)} – ${fmtDate(t.end)} (${plural(dayCount(t), 'day')}) · ${plural(t.travelers, 'traveller')}</p>
        <p style="margin-top:6px"><span class="badge ${st.k}">${st.label}</span></p>
      </div>
      <div class="row">
        <button class="btn ghost small" data-action="goto" data-view="itinerary" data-trip="${t.id}">📅 Itinerary</button>
        <button class="btn ghost small" data-action="del-trip" data-trip="${t.id}">Delete</button>
      </div>
    </div>
    <div class="card mt">
      <div class="row"><h3 style="margin:0">Budget</h3><span class="spacer"></span><b>${fmt(spent)}</b><span class="muted">of ${fmt(t.budget)}</span></div>
      <div class="progress ${pct > 100 ? 'over' : pct >= 80 ? 'warn' : ''}" style="margin-top:10px"><i style="width:${Math.min(100, pct)}%"></i></div>
      <p class="small-text muted" style="margin-top:8px">${spent > t.budget ? `${fmt(spent - t.budget)} over budget` : `${fmt(t.budget - spent)} remaining`}</p>
    </div>
    <div class="card">
      <div class="row"><h3 style="margin:0">Bookings</h3><span class="spacer"></span>
        <button class="btn ghost small" data-action="search-for" data-trip="${t.id}" data-tab="flights">+ Flight</button>
        <button class="btn ghost small" data-action="search-for" data-trip="${t.id}" data-tab="hotels">+ Hotel</button>
        <button class="btn ghost small" data-action="search-for" data-trip="${t.id}" data-tab="activities">+ Activity</button>
      </div>
      <div style="margin-top:10px">${bookings.length ? bookings.map(b => `
        <div class="booking">
          <div class="bi">${TYPE_ICON[b.type]}</div>
          <div><b>${esc(b.title)}</b><small>${fmtDay(b.date)}${b.endDate ? ' → ' + fmtDay(b.endDate) : ''} · ${b.time}<br>${esc(b.detail)}</small></div>
          <b class="bp">${fmt(b.price)}</b>
          <button class="icon-btn" title="Remove booking" aria-label="Remove booking" data-action="del-booking" data-trip="${t.id}" data-id="${b.id}">✕</button>
        </div>`).join('') : '<p class="muted small-text">No bookings yet. Use the buttons above to search and add flights, hotels or activities.</p>'}
      </div>
    </div>
    <section class="card checklist-card mt">
      <div class="row"><div><h3 style="margin:0">Packing checklist</h3><p class="muted small-text">${(t.checklist || []).filter(x => x.done).length} of ${(t.checklist || []).length} packed</p></div><span class="spacer"></span></div>
      <div class="progress mt"><i style="width:${t.checklist && t.checklist.length ? Math.round(t.checklist.filter(x => x.done).length / t.checklist.length * 100) : 0}%"></i></div>
      <div class="row checklist-presets"><span class="muted small-text">Add a preset:</span><button class="btn ghost small" data-action="checklist-preset" data-trip="${t.id}" data-preset="Beach">Beach</button><button class="btn ghost small" data-action="checklist-preset" data-trip="${t.id}" data-preset="Mountain">Mountain</button><button class="btn ghost small" data-action="checklist-preset" data-trip="${t.id}" data-preset="City">City</button></div>
      <div class="checklist-items">${(t.checklist || []).map((item, i) => `<div class="checklist-item ${item.done ? 'done' : ''}"><input id="pack-${t.id}-${i}" type="checkbox" data-checklist="${i}" data-trip="${t.id}" ${item.done ? 'checked' : ''}><label for="pack-${t.id}-${i}">${esc(item.text)}</label><button type="button" class="icon-btn" aria-label="Remove ${esc(item.text)}" data-action="remove-checklist" data-trip="${t.id}" data-index="${i}">×</button></div>`).join('') || '<p class="muted small-text">Start with a preset or add your own essentials.</p>'}</div>
      <form class="row checklist-add" data-trip="${t.id}"><input type="text" name="item" maxlength="60" placeholder="Add an item to pack…" aria-label="New packing item"><button class="btn ghost small" type="submit">Add item</button></form>
    </section>`;
}

/* ---------- itinerary ---------- */
function renderItinerary() {
  const el = $('#view-itinerary');
  if (!state.trips.length) {
    el.innerHTML = `<div class="page-head"><h1>Itinerary</h1></div>` + emptyState('📅', 'Create a trip first', 'Itineraries are generated for a trip based on your preferences.', '<button class="btn" data-action="nav" data-view="plan">Plan a trip</button>');
    return;
  }
  if (!ui.itTrip || !findTrip(ui.itTrip)) ui.itTrip = state.trips[0].id;
  const t = findTrip(ui.itTrip);
  const p = t.prefs || defaultPrefs();
  const total = (t.itinerary || []).reduce((s, d) => s + d.items.reduce((x, i) => x + (i.cost || 0), 0), 0);

  el.innerHTML = `
    <div class="page-head row"><div><h1>Itinerary</h1><p>Personalised day-by-day plan for your trip.</p></div>
      <div class="row no-print"><select id="itTripSel" style="width:auto">${state.trips.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <button class="btn ghost" data-action="print">🖨 Print</button></div></div>
    <form id="itForm" class="card no-print" novalidate>
      <h3>Preferences for ${esc(t.name)}</h3>
      <div class="form-grid">${prefsHTML(p)}</div>
      <div class="row" style="margin-top:14px"><button class="btn" type="submit">${t.itinerary && t.itinerary.length ? 'Regenerate itinerary' : 'Generate itinerary'}</button>
      <span class="muted small-text">Regenerating replaces the current plan, including custom items.</span></div>
    </form>
    ${t.itinerary && t.itinerary.length ? `
      <div class="row mt" style="margin-bottom:12px"><h3 style="margin:0">${DEST[t.dest].emoji} ${esc(t.dest)} · ${plural(dayCount(t), 'day')}</h3><span class="spacer"></span>
        <span class="muted small-text">Estimated activity cost for ${plural(t.travelers, 'traveller')}: <b style="color:var(--ink)">${fmt(total)}</b></span></div>
      ${t.itinerary.map((d, di) => `
        <div class="card day" style="margin-top:14px">
          <div class="day-head"><h4>Day ${di + 1}<span>${fmtDay(d.date)}</span></h4><span class="muted small-text">${plural(d.items.length, 'item')}</span></div>
          ${d.items.map(i => `
            <div class="it-item">
              <div class="time">${i.time}</div>
              <div><b>${CAT_ICON[i.cat] || '📌'} ${esc(i.title)}</b><small>${esc(i.note || '')}</small></div>
              <div class="cost"><span class="badge ${i.cat}">${i.cost ? fmt(i.cost) : 'Free'}</span></div>
              <button class="icon-btn no-print" title="Remove" aria-label="Remove item" data-action="rm-item" data-day="${di}" data-id="${i.id}">✕</button>
            </div>`).join('')}
          <form class="add-line no-print" data-day="${di}" novalidate>
            <input type="time" name="time" value="12:00" aria-label="Time">
            <input type="text" name="title" placeholder="Add your own plan…" maxlength="60" aria-label="Activity name">
            <input type="number" name="cost" placeholder="Cost ₹" min="0" aria-label="Cost">
            <button class="btn ghost small" type="submit">Add</button>
          </form>
        </div>`).join('')}` : emptyState('🗓️', 'No itinerary yet', 'Pick your preferences above and generate a plan.')}`;
}

function submitItinerary(form) {
  const t = findTrip(ui.itTrip);
  if (!t) return;
  t.prefs = readPrefs(new FormData(form));
  generateItinerary(t); save();
  toast('Itinerary generated ✨');
  renderItinerary(); updateBadge();
}

function submitCustomItem(form) {
  const t = findTrip(ui.itTrip), fd = new FormData(form);
  const title = (fd.get('title') || '').trim();
  if (!title) { toast('Type what you plan to do first'); return; }
  const day = t.itinerary[Number(form.dataset.day)];
  day.items.push({ id: uid(), time: fd.get('time') || '12:00', title, cat: 'custom', cost: Math.max(0, Number(fd.get('cost')) || 0), note: 'Added by you' });
  day.items.sort((a, b) => a.time.localeCompare(b.time));
  save(); renderItinerary();
}

const PACKING_PRESETS = {
  Beach: ['Swimwear', 'Sunscreen', 'Sunglasses', 'Sandals', 'Beach towel'],
  Mountain: ['Warm layers', 'Hiking shoes', 'Water bottle', 'Rain jacket', 'First-aid kit'],
  City: ['Comfortable walking shoes', 'Day bag', 'Power adapter', 'Reusable water bottle', 'Travel documents']
};

function showDestination(name) {
  const d = DEST[name];
  if (!d) return;
  const m = $('#modal');
  m.innerHTML = `<div class="destination-modal-art" aria-hidden="true">${d.emoji}</div><p class="eyebrow">${esc(d.country)} · TRAVEL GUIDE</p><h2>${esc(name)}</h2><p class="muted">${esc(d.tag)}</p><div class="quick-facts"><div><b>Best time</b><span>${name === 'Goa' ? 'Nov – Feb' : name === 'Manali' ? 'Mar – Jun' : name === 'Kerala' ? 'Oct – Mar' : 'Oct – Mar'}</span></div><div><b>Typical day</b><span>From ${fmt(d.base)}</span></div><div><b>Top activities</b><span>${d.acts.slice(0, 3).map(a => esc(a[0])).join(' · ')}</span></div></div><div class="modal-actions"><button class="btn ghost" data-action="close-modal">Close</button><button class="btn" data-action="plan-dest" data-dest="${esc(name)}">Plan a trip here</button></div>`;
  m.showModal();
}

/* ---------- alerts ---------- */
function renderAlerts() {
  const el = $('#view-alerts');
  const alerts = buildAlerts();
  const sched = [];
  state.trips.forEach(t => {
    if (tripStatus(t).k === 'done') return;
    t.bookings.forEach(b => { const d = daysUntil(b.date); if (d >= 0 && d <= 60) sched.push({ ...b, d, trip: t }); });
  });
  sched.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  el.innerHTML = `
    <div class="page-head"><h1>Alerts &amp; schedule</h1><p>Timely reminders about your bookings, schedules and travel plans.</p></div>
    <div class="grid cols-2" style="align-items:start">
      <div class="card" style="margin:0"><h3>Reminders (${alerts.length})</h3>
        ${alerts.length ? alerts.map(alertHTML).join('') : '<p class="muted">Nothing needs attention right now. ✅</p>'}</div>
      <div class="card" style="margin:0"><h3>Upcoming schedule · next 60 days</h3>
        ${sched.length ? `<ul class="timeline">${sched.map(b => `<li>
            <div class="when">${fmtDay(b.date)}<small>${b.time} · ${when(b.d)}</small></div>
            <div><b>${TYPE_ICON[b.type]} ${esc(b.title)}</b><br><span class="muted small-text">${esc(b.trip.name)} · ${esc(b.detail)}</span></div>
          </li>`).join('')}</ul>` : '<p class="muted">No upcoming bookings in the next 60 days.</p>'}</div>
    </div>`;
}

/* ---------- demo data ---------- */
function loadDemo() {
  const start = iso(addDays(TODAY, 12)), end = iso(addDays(TODAY, 15));
  const trip = { id: uid(), name: 'Goa friends trip', dest: 'Goa', start, end, travelers: 2, budget: 45000, prefs: { interests: ['adventure', 'food'], pace: 'balanced', avoidPricey: false }, bookings: [], itinerary: [] };
  const fl = getFlights('Mumbai', 'Goa', start)[1], rt = getFlights('Mumbai', 'Goa', end, true)[3];
  trip.bookings.push(
    { id: uid(), type: 'flight', title: `${fl.airline} ${fl.code}`, detail: `${fl.from} → ${fl.to} · ${fl.dep}–${fl.arr} · 2 travellers`, price: fl.price * 2, date: start, time: fl.dep },
    { id: uid(), type: 'flight', title: `${rt.airline} ${rt.code}`, detail: `${rt.from} → ${rt.to} · ${rt.dep}–${rt.arr} · 2 travellers`, price: rt.price * 2, date: end, time: rt.dep },
    { id: uid(), type: 'hotel', title: 'Beachside Resort Calangute', detail: `4★ · Calangute · ${fmtDate(start)} → ${fmtDate(end)}`, price: 5200 * 3, date: start, endDate: end, time: '14:00' },
    { id: uid(), type: 'activity', title: 'Baga water sports combo', detail: 'Adventure · about 3h · 2 travellers', price: 3600, date: iso(addDays(parseD(start), 1)), time: '10:00' }
  );
  generateItinerary(trip);
  state.trips.push(trip); save();
  ui.openTrip = trip.id;
  toast('Demo trip loaded');
  show('trips');
}

/* =====================================================================
   EVENTS
   ===================================================================== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const d = el.dataset;
  switch (d.action) {
    case 'nav': if (d.view === 'trips') ui.openTrip = null; if (d.view === 'plan') planDest = null; show(d.view); break;
    case 'goto':
      if (d.trip) { ui.itTrip = d.trip; ui.openTrip = d.trip; }
      if (d.tab) { ui.tab = d.tab; const t = d.trip && findTrip(d.trip); if (t) applyTripToSearch(t); }
      show(d.view); break;
    case 'tab': ui.tab = d.tab; ui.maxPrice = 'any'; renderSearch(); break;
    case 'search-tab': ui.tab = d.tab; ui.maxPrice = 'any'; show('search'); break;
    case 'search-for': { const t = findTrip(d.trip); ui.tab = d.tab; ui.maxPrice = 'any'; if (t) applyTripToSearch(t); show('search'); break; }
    case 'add': openAdd(d.id); break;
    case 'close-modal': $('#modal').close(); break;
    case 'favorite': {
      state.favorites = state.favorites || [];
      state.favorites = state.favorites.includes(d.dest) ? state.favorites.filter(x => x !== d.dest) : [...state.favorites, d.dest];
      save(); renderDashboard(); break;
    }
    case 'destination': showDestination(d.dest); break;
    case 'carousel-go': goSlide(Number(d.index)); break;
    case 'carousel-prev': goSlide(carouselIndex - 1); break;
    case 'carousel-next': goSlide(carouselIndex + 1); break;
    case 'carousel-toggle': toggleCarousel(); break;
    case 'booking-done': $('#modal').close(); ui.openTrip = d.trip; show('trips'); break;
    case 'toggle-theme': {
      const dark = document.documentElement.dataset.theme !== 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      localStorage.setItem('travelManager.theme', dark ? 'dark' : 'light');
      $('#themeLabel').textContent = dark ? 'Light mode' : 'Dark mode'; break;
    }
    case 'info': {
      const m = $('#modal'); m.innerHTML = `<h2>${esc(el.textContent.trim())}</h2><p class="muted">${esc(d.info)}</p><div class="modal-actions"><button class="btn" data-action="close-modal">Got it</button></div>`; m.showModal(); break;
    }
    case 'profile': toast('Welcome, traveller'); break;
    case 'checklist-preset': {
      const t = findTrip(d.trip); if (!t) break;
      t.checklist = t.checklist || [];
      PACKING_PRESETS[d.preset].forEach(text => { if (!t.checklist.some(x => x.text === text)) t.checklist.push({ text, done: false }); });
      save(); renderTrips(); break;
    }
    case 'remove-checklist': {
      const t = findTrip(d.trip); if (t) { t.checklist.splice(Number(d.index), 1); save(); renderTrips(); } break;
    }
    case 'plan-dest': planDest = d.dest; if ($('#modal').open) $('#modal').close(); show('plan'); break;
    case 'open-trip': ui.openTrip = d.trip; show('trips'); break;
    case 'close-trip': ui.openTrip = null; show('trips'); break;
    case 'del-trip':
      if (confirm('Delete this trip and all its bookings?')) { state.trips = state.trips.filter(t => t.id !== d.trip); ui.openTrip = null; save(); toast('Trip deleted'); show('trips'); }
      break;
    case 'del-booking': { const t = findTrip(d.trip); t.bookings = t.bookings.filter(b => b.id !== d.id); save(); toast('Booking removed'); renderTrips(); updateBadge(); break; }
    case 'rm-item': { const t = findTrip(ui.itTrip), day = t.itinerary[Number(d.day)]; day.items = day.items.filter(i => i.id !== d.id); save(); renderItinerary(); break; }
    case 'print': window.print(); break;
    case 'demo': loadDemo(); break;
    case 'reset':
      if (confirm('Remove all trips and bookings from this browser?')) { state = { trips: [], favorites: [] }; ui.openTrip = null; ui.itTrip = null; save(); toast('All data cleared'); show('dashboard'); }
      break;
  }
});

function applyTripToSearch(t) {
  ui.dest = t.dest;
  ui.date = t.start; ui.hIn = t.start; ui.hOut = t.end > t.start ? t.end : iso(addDays(parseD(t.start), 1));
  if (ui.date < TODAY_ISO) ui.date = ui.hIn = TODAY_ISO;
  if (ui.hOut <= ui.hIn) ui.hOut = iso(addDays(parseD(ui.hIn), 1));
}

document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'planForm') submitPlan(f);
  else if (f.id === 'itForm') submitItinerary(f);
  else if (f.id === 'modalForm') submitAdd(f);
  else if (f.classList.contains('add-line')) submitCustomItem(f);
  else if (f.classList.contains('checklist-add')) {
    const trip = findTrip(f.dataset.trip), input = f.elements.namedItem('item'), text = input.value.trim();
    if (!trip || !text) return;
    trip.checklist = trip.checklist || [];
    if (!trip.checklist.some(item => item.text.toLowerCase() === text.toLowerCase())) trip.checklist.push({ text, done: false });
    save(); renderTrips();
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'favoritesOnly') { ui.favoritesOnly = t.checked; renderDashboard(); return; }
  if (t.dataset.checklist !== undefined) {
    const trip = findTrip(t.dataset.trip); if (trip && trip.checklist && trip.checklist[t.dataset.checklist]) { trip.checklist[t.dataset.checklist].done = t.checked; save(); renderTrips(); } return;
  }
  if (t.dataset.ui) {
    const key = t.dataset.ui;
    ui[key] = t.type === 'checkbox' ? t.checked : t.value;
    if (key === 'hIn' && ui.hOut <= ui.hIn) ui.hOut = iso(addDays(parseD(ui.hIn), 1));
    if (key === 'hIn') renderSearch(); else renderResults();
  } else if (t.id === 'itTripSel') { ui.itTrip = t.value; renderItinerary(); }
  else if (t.form && t.form.id === 'modalForm' && t.name === 'trip') syncModal();
  else if (t.form && t.form.id === 'planForm') {
    if (t.name === 'start') { const end = t.form.elements.end; end.min = t.value; if (end.value < t.value) end.value = t.value; }
    if (t.name === 'dest') $('#planTag').textContent = `${DEST[t.value].emoji} ${DEST[t.value].tag}`;
  }
});

let onboardingStep = 0;
const onboarding = [
  ['Plan a trip', 'Choose a destination, travel dates and budget. We will create a trip space and draft a day-by-day itinerary.'],
  ['Search and book', 'Explore sample flights, stays and activities. Add them to your trip and keep an eye on the price breakdown.'],
  ['Track alerts', 'Your trips, packing list and timely reminders live together in one simple dashboard.']
];
function renderOnboarding() {
  const [title, body] = onboarding[onboardingStep], m = $('#modal');
  m.innerHTML = `<p class="eyebrow">A QUICK TOUR · ${onboardingStep + 1} OF ${onboarding.length}</p><h2>${title}</h2><p class="muted">${body}</p><div class="onboarding-dots" aria-label="Step ${onboardingStep + 1} of ${onboarding.length}">${onboarding.map((_, i) => `<i class="${i === onboardingStep ? 'active' : ''}"></i>`).join('')}</div><div class="modal-actions"><button class="btn ghost" data-action="onboarding-skip">Skip tour</button><button class="btn" data-action="onboarding-next">${onboardingStep === onboarding.length - 1 ? 'Start planning' : 'Next'}</button></div>`;
  if (!m.open) m.showModal();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]'); if (!el) return;
  if (el.dataset.action === 'onboarding-skip' || el.dataset.action === 'onboarding-next') {
    e.stopImmediatePropagation();
    if (el.dataset.action === 'onboarding-skip' || onboardingStep === onboarding.length - 1) { localStorage.setItem('travelManager.onboarding', 'done'); $('#modal').close(); }
    else { onboardingStep++; renderOnboarding(); }
  }
});

const globalSearch = $('#globalSearch');
globalSearch.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const term = globalSearch.value.trim(); if (!term) return;
  const destName = Object.keys(DEST).find(name => name.toLowerCase() === term.toLowerCase()) || Object.keys(DEST).find(name => name.toLowerCase().includes(term.toLowerCase()));
  if (destName) ui.dest = destName;
  ui.searchTerm = destName ? '' : term;
  ui.tab = 'activities'; ui.maxPrice = 'any'; ui.cat = 'all';
  show('search'); setTimeout(() => $('#results')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 0);
});

const savedTheme = localStorage.getItem('travelManager.theme');
if (savedTheme === 'dark') document.documentElement.dataset.theme = 'dark';
$('#themeLabel').textContent = savedTheme === 'dark' ? 'Light mode' : 'Dark mode';

/* ---------- start ---------- */
show('dashboard');
if (!localStorage.getItem('travelManager.onboarding')) renderOnboarding();
