// ===== Init icons =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  const y = document.getElementById('yearNow');
  if (y) y.textContent = new Date().getFullYear();
});

// ===== Toast notifications =====
function showToast(message, type = 'success') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 3200);
  setTimeout(() => el.remove(), 3700);
}

// ===== Mobile menu =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden-modal');
}

// ===== Generic modal open/close =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('hidden-modal'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('hidden-modal'); document.body.style.overflow = ''; }
}
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.add('hidden-modal');
    document.body.style.overflow = '';
  }
});

// ===== Sound toggle (top bar) =====
let soundEnabled = true;
function toggleSound() {
  soundEnabled = !soundEnabled;
  document.querySelectorAll('[data-sound-label]').forEach(el => {
    el.textContent = soundEnabled ? 'Buzzer On' : 'Muted';
  });
  document.querySelectorAll('[data-sound-icon]').forEach(el => {
    el.setAttribute('data-lucide', soundEnabled ? 'volume-2' : 'volume-x');
    el.classList.toggle('text-emerald-400', soundEnabled);
    el.classList.toggle('text-stone-400', !soundEnabled);
  });
  if (window.lucide) lucide.createIcons();
}

// small beep using WebAudio, replaces original mp3 alert utility
function playBeep(freq = 880, duration = 150) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) { /* audio not available */ }
}

// ===== Generic form handler (SOS, Contact, Volunteer, Services quick request, Donation) =====
function handleFormSubmit(formEl, successMsg, resultElId) {
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    formEl.classList.add('hidden-modal');
    const result = document.getElementById(resultElId);
    if (result) result.classList.remove('hidden-modal');
    showToast(successMsg, 'success');
  });
}

// ===== HOME PAGE: mini radar demo =====
function initHomeRadarDemo() {
  const btn = document.getElementById('radarDemoBtn');
  if (!btn) return;
  const beacon = document.getElementById('radarBeacon');
  const statusBox = document.getElementById('radarStatus');
  const speedLabel = document.getElementById('radarSpeed');

  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'Simulating Collision Avoidance...';
    playBeep(660, 120);
    statusBox.className = 'p-3 rounded-xl border text-xs font-bold bg-stone-800/80 border-stone-700 text-stone-300';
    statusBox.innerHTML = 'Proximity Radar Active. Scanning for tagged collars in 150m radius.';

    setTimeout(() => {
      playBeep(440, 250);
      speedLabel.textContent = 'Speed: 20 km/h (Slowed)';
      beacon.classList.add('animate-float-beacon');
      statusBox.className = 'p-3 rounded-xl border text-xs font-bold bg-amber-950/80 border-amber-500 text-amber-300 animate-bounce';
      statusBox.innerHTML = '⚠️ WARNING: Stray Animal detected ahead at 25m! Buzzer Triggered.';
    }, 600);

    setTimeout(() => {
      playBeep(880, 200);
      statusBox.className = 'p-3 rounded-xl border text-xs font-bold bg-emerald-950/80 border-emerald-500 text-emerald-300';
      statusBox.innerHTML = '✅ Safe Passage Achieved! Vehicle decelerated safely.';
      btn.disabled = false;
      btn.textContent = 'Test Proximity Buzzer & Safe Passage';
    }, 1800);
  });
}

// ===== FEATURES PAGE: 25m simulator with slider =====
function initFeaturesSimulator() {
  const slider = document.getElementById('distanceSlider');
  if (!slider) return;
  const distanceLabel = document.getElementById('distanceLabel');
  const hud = document.getElementById('simulatorHud');
  const beacon = document.getElementById('simBeacon');
  const outcome = document.getElementById('simOutcome');

  function update() {
    const dist = parseInt(slider.value, 10);
    distanceLabel.textContent = dist + 'm';
    if (dist <= 25) {
      hud.className = 'p-5 rounded-xl border text-sm font-bold text-center transition-all bg-red-950/80 border-red-500 text-red-300 animate-pulse';
      hud.innerHTML = '🚨 HAZARD ALARM ACTIVE — Animal within 25m safety zone! Slow down NOW.';
      beacon.classList.add('animate-float-beacon');
      outcome.textContent = 'Driver Action: Braking Safely';
      outcome.className = 'text-xs font-bold text-red-400';
    } else {
      hud.className = 'p-5 rounded-xl border text-sm font-bold text-center transition-all bg-emerald-950/80 border-emerald-600 text-emerald-300';
      hud.innerHTML = '✅ Safe Monitoring Mode — Animal beyond 25m. No alarm needed.';
      beacon.classList.remove('animate-float-beacon');
      outcome.textContent = 'Driver Action: Normal Cruising';
      outcome.className = 'text-xs font-bold text-emerald-400';
    }
  }
  slider.addEventListener('input', update);
  update();
}

// ===== SHELTER PAGE: filters & tabs =====
function initShelterFilters() {
  const filterBtns = document.querySelectorAll('[data-filter]');
  if (!filterBtns.length) return;
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('bg-[#D97706]', 'text-white'));
      btn.classList.add('bg-[#D97706]', 'text-white');
      if (window.__shelterState) window.__shelterState.category = btn.getAttribute('data-filter');
      applyShelterFilters();
    };
  });
}

// Great-circle distance between two coordinates in kilometers.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Applies the active category + location filters and re-renders the grid.
function applyShelterFilters() {
  const st = window.__shelterState;
  if (!st || !window.Render) return;
  let list = st.all.slice();

  if (st.category && st.category !== 'All') {
    list = list.filter(s => (s.category || '') === st.category);
  }

  if (st.userCoords) {
    list = list.map(s => {
      const out = Object.assign({}, s);
      out.distanceKm = (typeof s.lat === 'number' && typeof s.lng === 'number')
        ? haversineKm(st.userCoords.lat, st.userCoords.lng, s.lat, s.lng)
        : undefined;
      return out;
    });
    if (st.radiusKm) list = list.filter(s => typeof s.distanceKm === 'number' && s.distanceKm <= st.radiusKm);
    list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  Render.renderShelterList(list);
  updateShelterMapMarkers(list);
}

// ===== SHELTER PAGE: near-me geolocation + OpenStreetMap/Leaflet map =====
let shelterMap = null;
let shelterMarkers = [];
let shelterUserMarker = null;

function onShelterRadiusChange() {
  const sel = document.getElementById('shelterRadius');
  if (window.__shelterState) window.__shelterState.radiusKm = Number(sel && sel.value) || 0;
  applyShelterFilters();
}

function findSheltersNearMe() {
  const btn = document.getElementById('nearMeBtn');
  const status = document.getElementById('shelterLocationStatus');
  const showStatus = (html) => { if (status) { status.classList.remove('hidden'); status.innerHTML = html; } };
  if (!navigator.geolocation) {
    showStatus('⚠️ Geolocation is not supported on this browser.');
    return;
  }
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Detecting...</span>';
  if (window.lucide) lucide.createIcons();
  showStatus('Requesting your location...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (window.__shelterState) {
        window.__shelterState.userCoords = coords;
        const sel = document.getElementById('shelterRadius');
        window.__shelterState.radiusKm = Number(sel && sel.value) || 0;
      }
      showStatus(`📍 Showing shelters near you (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}), sorted by distance.`);
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Location On</span>';
      if (window.lucide) lucide.createIcons();
      ensureShelterMap(coords);
      applyShelterFilters();
    },
    (err) => {
      let msg = 'Could not fetch your location.';
      if (err.code === 1) msg = 'Location permission denied. Please allow location access to sort by distance.';
      showStatus('⚠️ ' + msg);
      btn.disabled = false;
      btn.innerHTML = original;
      if (window.lucide) lucide.createIcons();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function ensureShelterMap(coords) {
  const mapEl = document.getElementById('shelterMap');
  if (!mapEl || typeof L === 'undefined') return;
  mapEl.classList.remove('hidden');
  if (!shelterMap) {
    shelterMap = L.map(mapEl).setView([coords.lat, coords.lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(shelterMap);
  } else {
    shelterMap.setView([coords.lat, coords.lng], 10);
  }
  setTimeout(() => shelterMap.invalidateSize(), 120);
  if (shelterUserMarker) shelterUserMarker.remove();
  shelterUserMarker = L.marker([coords.lat, coords.lng]).addTo(shelterMap).bindPopup('<strong>You are here</strong>');
}

function updateShelterMapMarkers(list) {
  if (!shelterMap || typeof L === 'undefined') return;
  shelterMarkers.forEach(m => m.remove());
  shelterMarkers = [];
  const bounds = [];
  if (shelterUserMarker) bounds.push(shelterUserMarker.getLatLng());
  list.forEach(s => {
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return;
    const esc = window.Render ? Render.esc : (v) => v;
    const dist = typeof s.distanceKm === 'number' ? ` — ${s.distanceKm.toFixed(1)} km away` : '';
    const m = L.marker([s.lat, s.lng]).addTo(shelterMap)
      .bindPopup(`<strong>${esc(s.name)}</strong><br>${esc(s.city || '')}${dist}`);
    shelterMarkers.push(m);
    bounds.push([s.lat, s.lng]);
  });
  if (bounds.length > 1) shelterMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
}

function switchTab(groupName, tabId, btnEl) {
  document.querySelectorAll(`[data-tab-group="${groupName}"]`).forEach(el => el.classList.add('hidden-modal'));
  const target = document.getElementById(tabId);
  if (target) target.classList.remove('hidden-modal');
  document.querySelectorAll(`[data-tab-btn-group="${groupName}"]`).forEach(b => {
    b.classList.remove('bg-[#1F2937]', 'bg-[#D97706]', 'bg-[#065F46]', 'text-white', 'shadow-md');
    b.classList.add('bg-white', 'text-stone-700', 'border', 'border-stone-200');
  });
  if (btnEl) {
    btnEl.classList.remove('bg-white', 'text-stone-700', 'border', 'border-stone-200');
    btnEl.classList.add(btnEl.getAttribute('data-active-bg') || 'bg-[#1F2937]', 'text-white', 'shadow-md');
  }
}

// ===== ADOPT / SOS / AUTH form submit handlers wired per-page in inline scripts =====

// ===== Simple confetti burst (canvas-free, DOM based) =====
function fireConfetti(container) {
  const colors = ['#D97706', '#065F46', '#F59E0B', '#10B981', '#DC2626'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 6;
    p.style.position = 'absolute';
    p.style.left = (40 + Math.random() * 20) + '%';
    p.style.top = '0px';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.animation = `confettiFall ${0.8 + Math.random()}s ease-in forwards`;
    p.style.animationDelay = (Math.random() * 0.2) + 's';
    p.style.zIndex = 80;
    container.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

// ===== DONATION PAGE =====
let currentDonationAmount = 1000;
function selectAmount(val, btn) {
  currentDonationAmount = val;
  document.querySelectorAll('.amt-btn').forEach(b => {
    b.classList.remove('border-[#D97706]', 'bg-amber-50', 'text-[#D97706]');
    b.classList.add('border-stone-200', 'text-stone-700');
  });
  btn.classList.remove('border-stone-200', 'text-stone-700');
  btn.classList.add('border-[#D97706]', 'bg-amber-50', 'text-[#D97706]');
  document.getElementById('customAmount').value = '';
  const label = document.getElementById('donateBtnLabel');
  if (label) label.textContent = `Donate ₹${val.toLocaleString('en-IN')} Now`;
}
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'customAmount' && e.target.value) {
    currentDonationAmount = parseInt(e.target.value, 10) || 0;
    document.querySelectorAll('.amt-btn').forEach(b => {
      b.classList.remove('border-[#D97706]', 'bg-amber-50', 'text-[#D97706]');
      b.classList.add('border-stone-200', 'text-stone-700');
    });
    const label = document.getElementById('donateBtnLabel');
    if (label) label.textContent = `Donate ₹${currentDonationAmount.toLocaleString('en-IN')} Now`;
  }
});
let currentDonationCause = 'collars';
function selectCause(btn) {
  document.querySelectorAll('.cause-btn').forEach(b => {
    b.classList.remove('border-[#D97706]', 'bg-amber-50/70', 'shadow-xs', 'ring-2', 'ring-[#D97706]/20');
    b.classList.add('border-[#E5E7EB]', 'bg-stone-50');
  });
  btn.classList.remove('border-[#E5E7EB]', 'bg-stone-50');
  btn.classList.add('border-[#D97706]', 'bg-amber-50/70', 'shadow-xs', 'ring-2', 'ring-[#D97706]/20');
  currentDonationCause = btn.getAttribute('data-cause') || currentDonationCause;
}
document.getElementById('donationForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const [nameEl, emailEl] = this.querySelectorAll('input[type="text"], input[placeholder^="Full Name"], input[type="email"]');
  const anon = document.getElementById('anon')?.checked;
  btn.disabled = true;
  try {
    const { receiptNo, amount } = await Api.post('/donations', {
      donorName: anon ? 'Anonymous Donor' : (nameEl?.value || 'Donor'),
      email: emailEl?.value,
      phone: this.querySelector('input[type="tel"]')?.value,
      amount: currentDonationAmount,
      causeCode: currentDonationCause,
    }, { auth: true });
    const msg = document.getElementById('donationSuccessMsg');
    if (msg) msg.innerHTML = `Your generous gift of <strong>₹${Number(amount).toLocaleString('en-IN')}</strong> has been received. 80G receipt <strong>${receiptNo}</strong> has been generated.`;
    this.classList.add('hidden-modal');
    document.getElementById('donationSuccess').classList.remove('hidden-modal');
    if (window.lucide) lucide.createIcons();
    showToast('Donation received! Thank you for saving lives.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ===== SERVICES PAGE quick request =====
document.getElementById('serviceReqForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const [name, phone, city] = this.querySelectorAll('input');
  try {
    await Api.post('/services/requests', { name: name.value, phone: phone.value, city: city.value });
    this.classList.add('hidden-modal');
    document.getElementById('serviceReqSuccess').classList.remove('hidden-modal');
    if (window.lucide) lucide.createIcons();
    showToast('Service request received! Coordinator will call you soon.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ===== CONTACT PAGE =====
document.getElementById('contactForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const data = {
    name: this.querySelector('[name="name"], input')?.value,
    email: this.querySelector('input[type="email"]')?.value,
    phone: this.querySelector('input[type="tel"]')?.value,
    subject: this.querySelector('input[name="subject"]')?.value,
    message: this.querySelector('textarea')?.value,
  };
  try {
    await Api.post('/contact', data);
    this.classList.add('hidden-modal');
    document.getElementById('contactSuccess').classList.remove('hidden-modal');
    if (window.lucide) lucide.createIcons();
    showToast('Message sent! Our team will respond within 24 hours.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ===== SOS report (shared across pages) =====
document.getElementById('sosForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const [name, phone] = this.querySelectorAll('input');
  try {
    await Api.post('/sos', {
      reporterName: name.value,
      phone: phone.value,
      locationText: document.getElementById('sosLocationInput')?.value,
      lat: window.__sosCoords?.lat,
      lng: window.__sosCoords?.lng,
      description: this.querySelector('textarea')?.value,
    }, { auth: true });
    this.classList.add('hidden-modal');
    document.getElementById('sosSuccess').classList.remove('hidden-modal');
    if (window.lucide) lucide.createIcons();
    showToast('Rescue report received! Team dispatched.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ===== Adoption application (shared across pages) =====
let currentAdoptPetId = null;
function openAdoptModal(petName, petId) {
  currentAdoptPetId = petId || null;
  const title = document.getElementById('adoptModalTitle');
  if (title) title.textContent = 'Apply to Adopt ' + petName;
  const form = document.getElementById('adoptForm');
  if (form) form.dataset.petName = petName;
  openModal('adoptModal');
}
document.getElementById('adoptForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const [name, phone, city] = this.querySelectorAll('input');
  try {
    await Api.post('/adoptions', {
      petId: currentAdoptPetId,
      petName: this.dataset.petName,
      applicantName: name.value,
      phone: phone.value,
      city: city.value,
    }, { auth: true });
    closeModal('adoptModal');
    this.reset();
    showToast('Adoption application submitted! Shelter will call you within 24 hrs.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ===== init page-specific modules on load =====
document.addEventListener('DOMContentLoaded', () => {
  initPremiumUX();
  initHomeRadarDemo();
  initFeaturesSimulator();
  initShelterFilters();
  loadPageData();
});

// ===== Premium UI polish: header elevation, card hover-lift, scroll reveal =====
function initPremiumUX() {
  document.querySelectorAll('header').forEach((h) => {
    const onScroll = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });

  document.querySelectorAll('[class*="hover:shadow-md"]').forEach((el) => el.classList.add('premium-card'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('main section, body > section, footer').forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.85) {
        el.classList.add('reveal');
        io.observe(el);
      }
    });
  }
}

// Loads dynamic content based on which containers exist on the page.
function loadPageData() {
  if (window.Render) {
    Render.stats();
    if (document.querySelector('[data-pets-grid]')) Render.pets('[data-pets-grid]', { limit: document.querySelector('[data-pets-grid]').getAttribute('data-limit') || undefined });
    if (document.querySelector('[data-shelters-grid]')) Render.shelters('[data-shelters-grid]');
    if (document.querySelector('[data-testimonials-grid]')) Render.testimonials('[data-testimonials-grid]');
    if (document.querySelector('[data-services-grid]')) loadServices();
    if (document.querySelector('[data-causes-grid]')) loadCauses();
  }
}

// ===== SOS: Use My Current Location (Geolocation) =====
function captureSosLocation() {
  const status = document.getElementById('sosLocationStatus');
  const input = document.getElementById('sosLocationInput');
  const btn = document.getElementById('useLocationBtn');
  if (!navigator.geolocation) {
    if (status) status.textContent = '⚠️ Geolocation is not supported on this browser.';
    return;
  }
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Detecting location...</span>';
  if (window.lucide) lucide.createIcons();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      window.__sosCoords = { lat: Number(lat), lng: Number(lng) };
      if (input) input.value = `Lat: ${lat}, Lng: ${lng} (GPS location)`;
      if (status) status.innerHTML = `📍 Location captured! <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="underline text-red-600">View on Google Maps</a>`;
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Location Captured</span>';
      if (window.lucide) lucide.createIcons();
    },
    (err) => {
      let msg = 'Could not fetch location. Please type it manually.';
      if (err.code === 1) msg = 'Location permission denied. Please allow location access or type manually.';
      if (status) status.textContent = '⚠️ ' + msg;
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      if (window.lucide) lucide.createIcons();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ===== SERVICES PAGE: render service cards from API =====
async function loadServices() {
  const el = document.querySelector('[data-services-grid]');
  if (!el) return;
  Render.loading(el, 'Loading services...');
  try {
    const services = await Api.get('/services');
    el.innerHTML = services.map((s) => {
      const features = (s.features || []).map((f) =>
        `<div class="flex items-start gap-2 text-xs text-stone-700"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[#065F46] shrink-0 mt-0.5"></i><span>${Render.esc(f)}</span></div>`).join('');
      const cta = s.ctaType === 'sos'
        ? `<button onclick="openModal('sosModal')" class="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"><i data-lucide="alert-octagon" class="w-4 h-4"></i><span>${Render.esc(s.ctaLabel)}</span></button>`
        : `<a href="${Render.esc(s.ctaHref || '#')}" class="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-[#D97706] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"><span>${Render.esc(s.ctaLabel)}</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></a>`;
      return `
      <div class="bg-white rounded-2xl border border-${Render.esc(s.borderColor || 'stone-200')} p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
        <div class="space-y-4">
          <div class="flex items-center justify-between"><span class="px-2.5 py-0.5 rounded-md bg-${Render.esc(s.badgeColor || 'amber-600')} text-white text-[10px] font-bold uppercase tracking-wider">${Render.esc(s.badge)}</span><span class="text-[11px] font-mono text-stone-400 font-bold">${String(s.position).padStart(2, '0')}</span></div>
          <div class="space-y-1.5"><h3 class="text-xl font-bold font-outfit text-[#1F2937] group-hover:text-[#D97706] transition-colors">${Render.esc(s.title)}</h3><p class="text-xs text-stone-600 leading-relaxed font-medium">${Render.esc(s.description)}</p></div>
          <div class="space-y-2 pt-2 border-t border-stone-100">${features}</div>
        </div>
        <div class="pt-5 mt-4 border-t border-stone-100">${cta}</div>
      </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    Render.error(el, err.message);
  }
}

// ===== DONATION PAGE: render cause options from API =====
async function loadCauses() {
  const el = document.querySelector('[data-causes-grid]');
  if (!el) return;
  Render.loading(el, 'Loading causes...');
  try {
    const causes = await Api.get('/donations/causes');
    el.innerHTML = causes.map((c, i) => {
      const active = i === 0;
      currentDonationCause = active ? c.code : currentDonationCause;
      const cls = active
        ? 'border-[#D97706] bg-amber-50/70 shadow-xs ring-2 ring-[#D97706]/20'
        : 'border-[#E5E7EB] bg-stone-50 hover:bg-stone-100';
      return `
      <button type="button" data-cause="${Render.esc(c.code)}" onclick="selectCause(this)" class="cause-btn p-4 rounded-xl text-left border transition-all ${cls}">
        <div class="flex items-center justify-between"><span class="text-2xl">${Render.esc(c.emoji)}</span><span class="text-[10px] font-bold font-mono text-[#065F46] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">${Render.money(c.unitAmount)} ${Render.esc(c.unitLabel)}</span></div>
        <h4 class="text-xs font-bold text-[#1F2937] mt-2">${Render.esc(c.title)}</h4>
        <p class="text-[11px] text-stone-600 mt-1 line-clamp-2">${Render.esc(c.description)}</p>
        <div class="mt-2 text-[10px] font-semibold text-[#D97706]">✨ ${Render.esc(c.highlight)}</div>
      </button>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    Render.error(el, err.message);
  }
}
