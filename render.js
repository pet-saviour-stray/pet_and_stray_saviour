// Renders backend data into the existing page layouts.
const Render = {
  esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  money(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN')}`;
  },

  loading(el, msg = 'Loading...') {
    if (el) el.innerHTML = `<div class="col-span-full text-center py-10 text-sm text-stone-400">${msg}</div>`;
  },

  error(el, msg) {
    if (el) el.innerHTML = `<div class="col-span-full text-center py-10 text-sm text-red-500">${Render.esc(msg)}</div>`;
  },

  empty(el, msg = 'Nothing to show yet.') {
    if (el) el.innerHTML = `<div class="col-span-full text-center py-10 text-sm text-stone-400">${msg}</div>`;
  },

  // ---- Stat counters (data-stat="taggedAnimals" etc.) ----
  async stats() {
    const targets = document.querySelectorAll('[data-stat]');
    if (!targets.length) return;
    try {
      const s = await Api.get('/stats');
      targets.forEach((el) => {
        const key = el.getAttribute('data-stat');
        if (s[key] != null) el.textContent = `${Number(s[key]).toLocaleString('en-IN')}+`;
      });
    } catch { /* leave placeholders */ }
  },

  // ---- Adoptable pets ----
  petCard(p) {
    const tags = (p.temperament || [])
      .map((t) => `<span class="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">${Render.esc(t)}</span>`)
      .join('');
    const urgent = p.isUrgent
      ? `<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow-xs">Urgent Rescue</span>`
      : '';
    const img = p.imageUrl || 'https://via.placeholder.com/800x520?text=Pet';
    return `
    <div class="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      <div class="relative">
        <img src="${Render.esc(img)}" alt="${Render.esc(p.name)}" class="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500">
        ${urgent}
        <div class="absolute top-3 right-3 bg-white/95 p-2 rounded-lg text-rose-500 shadow-xs"><i data-lucide="heart" class="w-4 h-4 fill-rose-500"></i></div>
      </div>
      <div class="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center justify-between"><h3 class="text-xl font-bold font-outfit text-[#1F2937]">${Render.esc(p.name)}</h3><span class="text-xs font-bold text-[#065F46] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">${p.adoptionFee ? Render.money(p.adoptionFee) : '₹0'} Adoption Fee</span></div>
          <p class="text-xs text-stone-500 font-medium">${Render.esc(p.breed)} • ${Render.esc(p.ageText)} • ${Render.esc(p.gender)}</p>
          <div class="flex flex-wrap gap-1.5 pt-1">${tags}</div>
          <p class="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">${Render.esc(p.description)}</p>
        </div>
        <div class="pt-4 border-t border-stone-100 space-y-3">
          <p class="text-[11px] text-stone-500 flex items-center gap-1 font-semibold"><i data-lucide="home" class="w-3.5 h-3.5 text-[#D97706]"></i> ${Render.esc(p.shelterName || 'Verified Shelter')}</p>
          <button onclick="openAdoptModal('${Render.esc(p.name)}','${p._id}')" class="w-full py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"><i data-lucide="paw-print" class="w-4 h-4"></i><span>Apply to Adopt ${Render.esc(p.name)}</span></button>
        </div>
      </div>
    </div>`;
  },

  async pets(selector, { limit } = {}) {
    const el = document.querySelector(selector);
    if (!el) return;
    Render.loading(el, 'Loading pets...');
    try {
      const q = limit ? `?status=available&limit=${limit}` : '?status=available';
      const pets = await Api.get(`/pets${q}`);
      if (!pets.length) return Render.empty(el, 'No pets available right now.');
      el.innerHTML = pets.map(Render.petCard).join('');
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      Render.error(el, err.message);
    }
  },

  // ---- Shelters ----
  shelterCard(s) {
    const vet = (s.veterinarians && s.veterinarians[0]) || null;
    const img = s.imageUrl || 'https://via.placeholder.com/800x440?text=Shelter';
    const distance = (typeof s.distanceKm === 'number')
      ? `<span class="absolute top-3 right-3 bg-[#1F2937]/90 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1"><i data-lucide="navigation" class="w-3 h-3 text-amber-400"></i>${s.distanceKm.toFixed(1)} km away</span>`
      : '';
    return `
    <div data-animal-type="${Render.esc(s.category)}" class="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div class="relative"><img src="${Render.esc(img)}" alt="${Render.esc(s.name)}" class="w-full h-44 object-cover">
        ${s.isVerified ? `<span class="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1"><i data-lucide="badge-check" class="w-3 h-3"></i>Verified</span>` : ''}
        ${distance}
        <div class="absolute bottom-3 right-3 bg-white/95 px-2 py-1 rounded-md text-[11px] font-bold text-amber-600 flex items-center gap-1 shadow-xs"><i data-lucide="star" class="w-3 h-3 fill-amber-500 text-amber-500"></i>${s.rating} (${s.reviewCount})</div>
      </div>
      <div class="p-5 space-y-3">
        <h3 class="text-lg font-bold font-outfit text-[#1F2937] leading-tight">${Render.esc(s.name)}</h3>
        <p class="text-xs text-stone-500 flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#D97706]"></i>${Render.esc(s.city)}</p>
        <p class="text-[11px] text-stone-400">${Render.esc(s.address)}</p>
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
          <span class="flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5 text-[#065F46]"></i>${s.occupiedBeds}/${s.totalBeds} beds</span>
          <span class="flex items-center gap-1"><i data-lucide="indian-rupee" class="w-3.5 h-3.5 text-[#D97706]"></i>${Render.money(s.boardRate)}/day board</span>
        </div>
        ${vet ? `<p class="text-[11px] text-stone-500">👨‍⚕️ ${Render.esc(vet.name)} (${Render.esc(vet.specialization)})</p>` : ''}
        <a href="tel:9973169896" class="w-full mt-2 py-2.5 rounded-xl bg-stone-900 hover:bg-[#D97706] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"><span>Contact Shelter</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></a>
      </div>
    </div>`;
  },

  async shelters(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    Render.loading(el, 'Loading shelters...');
    try {
      const shelters = await Api.get('/shelters');
      if (!shelters.length) return Render.empty(el, 'No shelters listed yet.');
      window.__shelterState = { all: shelters, userCoords: null, radiusKm: 0, category: 'All' };
      Render.renderShelterList(shelters);
      if (typeof initShelterFilters === 'function') initShelterFilters();
    } catch (err) {
      Render.error(el, err.message);
    }
  },

  // Renders a given list of shelters into the grid (used by the location filter).
  renderShelterList(list) {
    const el = document.querySelector('[data-shelters-grid]');
    if (!el) return;
    if (!list.length) return Render.empty(el, 'No shelters match your filters.');
    el.innerHTML = list.map(Render.shelterCard).join('');
    if (window.lucide) lucide.createIcons();
  },

  // ---- Testimonials ----
  async testimonials(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const items = await Api.get('/testimonials');
      if (!items.length) return;
      el.innerHTML = items
        .map(
          (t) => `
      <div class="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between">
        <div class="space-y-3">
          <span class="text-[10px] font-bold uppercase px-2.5 py-1 bg-amber-50 text-[#D97706] rounded-md border border-amber-200/60">${Render.esc(t.category)}</span>
          <p class="text-sm text-stone-600 italic leading-relaxed">"${Render.esc(t.quote)}"</p>
        </div>
        <div class="pt-3 border-t border-stone-100"><p class="font-bold text-[#1F2937] text-sm">${Render.esc(t.authorName)}</p><p class="text-xs text-stone-500">${Render.esc(t.authorRole)}</p></div>
      </div>`
        )
        .join('');
    } catch { /* keep static fallback */ }
  },
};

window.Render = Render;
