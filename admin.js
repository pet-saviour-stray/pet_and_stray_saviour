// Admin dashboard logic. Requires an admin or shelter_manager session.
const STATUS_OPTIONS = {
  sos: ['submitted', 'dispatched', 'rescued', 'closed'],
  adoptions: ['submitted', 'reviewing', 'approved', 'rejected'],
  donations: ['pending', 'paid', 'failed', 'refunded'],
  contact: ['new', 'contacted', 'closed'],
  requests: ['new', 'contacted', 'closed'],
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

function statusSelect(resource, id, current) {
  const opts = STATUS_OPTIONS[resource]
    .map((s) => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`)
    .join('');
  return `<select onchange="AdminUI.updateStatus('${resource}','${id}',this.value)" class="text-xs border border-stone-300 rounded-lg px-2 py-1 bg-white">${opts}</select>`;
}

const AdminUI = {
  role: null,

  async guard() {
    const user = await Auth.loadSession();
    const allowed = ['admin', 'shelter_manager', 'pet_owner'];
    if (!user || !allowed.includes(user.role)) {
      document.body.innerHTML =
        '<div class="min-h-screen flex items-center justify-center text-center p-8"><div><h1 class="text-2xl font-black text-[#1F2937]">Dashboard access required</h1><p class="text-stone-500 mt-2">Sign in as a pet owner, shelter manager or admin to manage listings.</p><a href="index.html" class="inline-block mt-4 px-5 py-2.5 bg-[#D97706] text-white rounded-xl font-bold text-sm">Back to site</a></div></div>';
      return false;
    }
    AdminUI.role = user.role;
    document.getElementById('adminName').textContent = user.fullName;
    const dashRole = document.getElementById('dashRole');
    if (dashRole) dashRole.textContent = user.role.replace('_', ' ');
    const dashTitle = document.getElementById('dashTitle');
    if (dashTitle) dashTitle.textContent = user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard';
    // Hide any tab/divider this role is not allowed to see.
    // Use inline display:none so it always beats Tailwind's display utilities.
    document.querySelectorAll('[data-roles]').forEach((el) => {
      const roles = (el.getAttribute('data-roles') || '').split(',').map((r) => r.trim());
      el.style.display = roles.includes(user.role) ? '' : 'none';
    });
    // Role-specific sidebar labels.
    const petsLabel = document.querySelector('[data-tab-label="pets"]');
    if (petsLabel) petsLabel.textContent = user.role === 'admin' ? 'Manage Pets' : 'My Pets';
    const sheltersLabel = document.querySelector('[data-tab-label="shelters"]');
    if (sheltersLabel) sheltersLabel.textContent = user.role === 'admin' ? 'Manage Shelters' : 'My Shelters';
    return true;
  },

  showTab(name, btn) {
    document.querySelectorAll('[data-admin-panel]').forEach((p) => p.classList.add('hidden-modal'));
    document.getElementById(`panel-${name}`)?.classList.remove('hidden-modal');
    document.querySelectorAll('[data-admin-tab]').forEach((b) => b.classList.remove('bg-[#D97706]', 'text-white'));
    btn?.classList.add('bg-[#D97706]', 'text-white');
    AdminUI.load(name);
  },

  async load(name) {
    const map = {
      overview: AdminUI.loadOverview,
      sos: () => AdminUI.loadTable('sos', '/sos', ['reporterName', 'phone', 'locationText', 'createdAt']),
      adoptions: () => AdminUI.loadTable('adoptions', '/adoptions', ['applicantName', 'petName', 'phone', 'city', 'createdAt']),
      donations: () => AdminUI.loadTable('donations', '/donations', ['donorName', 'amount', 'causeCode', 'receiptNo', 'createdAt']),
      contact: () => AdminUI.loadTable('contact', '/contact', ['name', 'email', 'subject', 'createdAt']),
      requests: () => AdminUI.loadTable('requests', '/services/requests/all', ['name', 'phone', 'city', 'createdAt']),
      pets: AdminUI.loadPets,
      shelters: () => Manage.render('shelters'),
      testimonials: () => Manage.render('testimonials'),
      causes: () => Manage.render('causes'),
      services: () => Manage.render('services'),
    };
    map[name]?.();
  },

  async loadOverview() {
    try {
      const s = await Api.get('/stats');
      document.getElementById('ovStats').innerHTML = [
        ['Tagged Animals', s.taggedAnimals, 'text-amber-500'],
        ['Collisions Avoided', s.collisionsAvoided, 'text-emerald-500'],
        ['Pets Adopted', s.petsAdopted, 'text-rose-500'],
        ['Verified Shelters', s.verifiedShelters, 'text-white'],
      ]
        .map(
          ([label, val, cls]) =>
            `<div class="bg-stone-800 p-4 rounded-xl border border-stone-700"><p class="text-2xl font-black ${cls}">${Number(val).toLocaleString('en-IN')}</p><p class="text-[11px] text-stone-400">${label}</p></div>`
        )
        .join('');
    } catch (err) {
      document.getElementById('ovStats').innerHTML = `<p class="text-red-400 text-sm">${err.message}</p>`;
    }
  },

  async loadTable(resource, path, fields) {
    const el = document.getElementById(`tbl-${resource}`);
    el.innerHTML = '<p class="text-sm text-stone-400 p-4">Loading...</p>';
    try {
      const rows = await Api.get(path, { auth: true });
      if (!rows.length) {
        el.innerHTML = '<p class="text-sm text-stone-400 p-4">No records yet.</p>';
        return;
      }
      const head = fields.map((f) => `<th class="text-left px-3 py-2 font-bold text-stone-500 uppercase text-[10px]">${f}</th>`).join('');
      const body = rows
        .map((r) => {
          const cells = fields
            .map((f) => `<td class="px-3 py-2 text-stone-700">${f === 'createdAt' ? fmtDate(r[f]) : Render.esc(r[f] ?? '-')}</td>`)
            .join('');
          const status = r.status || r.paymentStatus;
          return `<tr class="border-t border-stone-100">${cells}<td class="px-3 py-2">${statusSelect(resource, r._id, status)}</td></tr>`;
        })
        .join('');
      el.innerHTML = `<table class="w-full text-xs"><thead><tr>${head}<th class="text-left px-3 py-2 font-bold text-stone-500 uppercase text-[10px]">Status</th></tr></thead><tbody>${body}</tbody></table>`;
    } catch (err) {
      el.innerHTML = `<p class="text-sm text-red-500 p-4">${err.message}</p>`;
    }
  },

  async updateStatus(resource, id, status) {
    const paths = {
      sos: `/sos/${id}/status`,
      adoptions: `/adoptions/${id}/status`,
      donations: `/donations/${id}/status`,
      contact: `/contact/${id}/status`,
      requests: `/services/requests/${id}/status`,
    };
    try {
      await Api.patch(paths[resource], { status }, { auth: true });
      showToast('Status updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async loadPets() {
    const el = document.getElementById('tbl-pets');
    el.innerHTML = '<p class="text-sm text-stone-400 p-4">Loading...</p>';
    const isAdmin = AdminUI.role === 'admin';
    const formTitle = document.getElementById('petsFormTitle');
    if (formTitle) formTitle.textContent = isAdmin ? 'Add Adoptable Pet' : 'List a Pet for Adoption';
    const formNote = document.getElementById('petsFormNote');
    if (formNote) formNote.textContent = isAdmin
      ? 'Add a pet to the public Adopt directory.'
      : 'List a pet for adoption. It appears publicly and you can remove it anytime.';
    const listTitle = document.getElementById('petsListTitle');
    if (listTitle) listTitle.textContent = isAdmin ? 'Current Listings' : 'My Pet Listings';
    try {
      const pets = await Api.get(isAdmin ? '/pets?limit=60' : '/pets/mine', { auth: true });
      if (!pets.length) {
        el.innerHTML = '<p class="text-sm text-stone-400 p-4">No pet listings yet.</p>';
        return;
      }
      el.innerHTML = pets
        .map((p) => {
          const badge = {
            available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            adopted: 'bg-stone-100 text-stone-500 border-stone-200',
          }[p.status] || 'bg-stone-100 text-stone-500 border-stone-200';
          return `<div class="flex items-center gap-3 border-t border-stone-100 py-2">
            <img src="${Render.esc(p.imageUrl || 'https://via.placeholder.com/60')}" class="w-10 h-10 rounded-lg object-cover">
            <div class="flex-1 min-w-0"><p class="text-sm font-bold text-[#1F2937] truncate">${Render.esc(p.name)}</p><p class="text-[11px] text-stone-400 truncate">${Render.esc(p.breed || '')} • <span class="inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${badge}">${Render.esc(p.status)}</span></p></div>
            <button onclick="AdminUI.deletePet('${p._id}')" class="text-red-500 hover:text-red-700 text-xs font-bold shrink-0">Delete</button>
          </div>`;
        })
        .join('');
    } catch (err) {
      el.innerHTML = `<p class="text-sm text-red-500 p-4">${err.message}</p>`;
    }
  },

  async deletePet(id) {
    if (!confirm('Delete this pet listing?')) return;
    try {
      await Api.del(`/pets/${id}`, { auth: true });
      showToast('Pet removed.', 'success');
      AdminUI.loadPets();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async createPet(form) {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      let imageUrl = '';
      const file = form.image.files[0];
      if (file) imageUrl = await Api.uploadImage(file);
      await Api.post(
        '/pets',
        {
          name: form.name.value,
          species: form.species.value,
          breed: form.breed.value,
          ageText: form.ageText.value,
          gender: form.gender.value,
          temperament: form.temperament.value.split(',').map((t) => t.trim()).filter(Boolean),
          description: form.description.value,
          shelterName: form.shelterName.value,
          isUrgent: form.isUrgent.checked,
          imageUrl,
        },
        { auth: true }
      );
      showToast('Pet added!', 'success');
      form.reset();
      AdminUI.loadPets();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },
};

window.AdminUI = AdminUI;

// ---- Generic create/edit/delete manager for content entities ----
const ENTITIES = {
  shelters: {
    listPath: '/shelters',
    base: '/shelters',
    label: (r) => r.name,
    sub: (r) => `${r.category} • ${r.city} • ${r.occupiedBeds}/${r.totalBeds} beds`,
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug (unique)', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Dogs', 'Cats', 'Cattle', 'Birds', 'Special', 'Puppies'] },
      { name: 'city', label: 'City', required: true },
      { name: 'address', label: 'Address' },
      { name: 'pincode', label: 'Pincode' },
      { name: 'lat', label: 'Latitude (for map)', type: 'number', step: 'any' },
      { name: 'lng', label: 'Longitude (for map)', type: 'number', step: 'any' },
      { name: 'totalBeds', label: 'Total beds', type: 'number' },
      { name: 'occupiedBeds', label: 'Occupied beds', type: 'number' },
      { name: 'boardRate', label: 'Board rate/day', type: 'number' },
      { name: 'rating', label: 'Rating', type: 'number', step: '0.1' },
      { name: 'reviewCount', label: 'Review count', type: 'number' },
      { name: 'vetName', label: 'Vet name' },
      { name: 'vetSpecialization', label: 'Vet specialization' },
      { name: 'imageUrl', label: 'Image URL' },
      { name: 'image', label: 'Or upload image', type: 'image' },
      { name: 'isVerified', label: 'Verified', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    toForm: (r) => ({ ...r, vetName: r.veterinarians?.[0]?.name || '', vetSpecialization: r.veterinarians?.[0]?.specialization || '' }),
    beforeSubmit: (data) => {
      data.veterinarians = data.vetName ? [{ name: data.vetName, specialization: data.vetSpecialization }] : [];
      delete data.vetName; delete data.vetSpecialization;
      return data;
    },
  },
  testimonials: {
    listPath: '/testimonials',
    base: '/testimonials',
    label: (r) => r.authorName,
    sub: (r) => r.category || '',
    fields: [
      { name: 'authorName', label: 'Author name', required: true },
      { name: 'authorRole', label: 'Author role' },
      { name: 'category', label: 'Category' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true },
      { name: 'sortOrder', label: 'Sort order', type: 'number' },
      { name: 'isPublished', label: 'Published', type: 'checkbox' },
    ],
  },
  causes: {
    listPath: '/donations/causes',
    base: '/donations/causes',
    label: (r) => r.title,
    sub: (r) => `${r.code} • ₹${r.unitAmount} ${r.unitLabel || ''}`,
    fields: [
      { name: 'code', label: 'Code (unique)', required: true },
      { name: 'title', label: 'Title', required: true },
      { name: 'unitAmount', label: 'Unit amount (₹)', type: 'number', required: true },
      { name: 'unitLabel', label: 'Unit label (e.g. / collar)' },
      { name: 'emoji', label: 'Emoji' },
      { name: 'highlight', label: 'Highlight line' },
      { name: 'sortOrder', label: 'Sort order', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  services: {
    listPath: '/services?all=1',
    base: '/services',
    label: (r) => r.title,
    sub: (r) => r.badge || '',
    fields: [
      { name: 'position', label: 'Position', type: 'number' },
      { name: 'title', label: 'Title', required: true },
      { name: 'badge', label: 'Badge' },
      { name: 'badgeColor', label: 'Badge color (e.g. amber-600)' },
      { name: 'borderColor', label: 'Border color (e.g. amber-300)' },
      { name: 'ctaType', label: 'CTA type', type: 'select', options: ['contact', 'features', 'sos', 'shelter', 'donation'] },
      { name: 'ctaLabel', label: 'CTA label' },
      { name: 'ctaHref', label: 'CTA href' },
      { name: 'features', label: 'Features (one per line)', type: 'lines' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
};

const Manage = {
  editing: {},

  // Admins see all shelters (incl. pending); managers see only their own.
  effectiveListPath(entity) {
    if (entity === 'shelters') {
      return (window.AdminUI && AdminUI.role === 'admin') ? '/shelters?all=1' : '/shelters/mine';
    }
    return ENTITIES[entity].listPath;
  },

  fieldInput(f, value) {
    const v = value ?? '';
    const cls = 'w-full px-3 py-2 rounded-xl border border-stone-300 text-sm';
    if (f.type === 'textarea') return `<textarea name="${f.name}" rows="2" class="${cls}">${Render.esc(v)}</textarea>`;
    if (f.type === 'lines') return `<textarea name="${f.name}" rows="4" class="${cls}">${Render.esc(Array.isArray(v) ? v.join('\n') : v)}</textarea>`;
    if (f.type === 'checkbox') return `<label class="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" name="${f.name}" ${v ? 'checked' : ''}> ${Render.esc(f.label)}</label>`;
    if (f.type === 'image') return `<input type="file" name="${f.name}" accept="image/*" class="w-full text-xs">`;
    if (f.type === 'select') return `<select name="${f.name}" class="${cls}">${f.options.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    return `<input type="${f.type || 'text'}" ${f.step ? `step="${f.step}"` : ''} name="${f.name}" value="${Render.esc(v)}" ${f.required ? 'required' : ''} placeholder="${Render.esc(f.label)}" class="${cls}">`;
  },

  async render(entity) {
    const cfg = ENTITIES[entity];
    const wrap = document.getElementById(`mgr-${entity}`);
    if (!wrap) return;
    wrap.innerHTML = '<p class="text-sm text-stone-400">Loading...</p>';
    const isAdmin = !window.AdminUI || AdminUI.role === 'admin';
    // Managers cannot set verification; show it as a status line instead.
    const fields = (entity === 'shelters' && !isAdmin) ? cfg.fields.filter((f) => f.name !== 'isVerified') : cfg.fields;
    const subFn = (entity === 'shelters')
      ? (r) => `${r.category} • ${r.city} • ${r.isVerified ? '✅ Verified' : '⏳ Pending admin review'}`
      : cfg.sub;
    let rows = [];
    try {
      rows = await Api.get(Manage.effectiveListPath(entity), { auth: true });
    } catch (err) {
      wrap.innerHTML = `<p class="text-sm text-red-500">${err.message}</p>`;
      return;
    }
    const current = Manage.editing[entity] ? cfg.toForm ? cfg.toForm(Manage.editing[entity]) : Manage.editing[entity] : {};
    const formFields = fields.map((f) => `<div>${f.type === 'checkbox' ? '' : `<label class="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">${Render.esc(f.label)}</label>`}${Manage.fieldInput(f, current[f.name])}</div>`).join('');
    const list = rows.length
      ? rows.map((r) => `<div class="flex items-center gap-3 border-t border-stone-100 py-2">
          <div class="flex-1 min-w-0"><p class="text-sm font-bold text-[#1F2937] truncate">${Render.esc(cfg.label(r))}</p><p class="text-[11px] text-stone-400 truncate">${Render.esc(subFn(r))}</p></div>
          ${entity === 'shelters' && isAdmin ? `<button onclick="Manage.toggleVerify('${r._id}', ${!r.isVerified})" class="${r.isVerified ? 'text-stone-500 hover:text-stone-800' : 'text-emerald-600 hover:text-emerald-800'} text-xs font-bold shrink-0">${r.isVerified ? 'Unverify' : 'Verify'}</button>` : ''}
          <button onclick="Manage.edit('${entity}','${r._id}')" class="text-amber-600 hover:text-amber-800 text-xs font-bold shrink-0">Edit</button>
          <button onclick="Manage.remove('${entity}','${r._id}')" class="text-red-500 hover:text-red-700 text-xs font-bold shrink-0">Delete</button>
        </div>`).join('')
      : '<p class="text-sm text-stone-400 py-3">No records yet.</p>';

    wrap.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-black font-outfit">${Manage.editing[entity] ? 'Edit' : 'Add'} record</h3>
          ${Manage.editing[entity] ? `<button onclick="Manage.cancel('${entity}')" class="text-xs text-stone-500 hover:text-stone-800">Cancel edit</button>` : ''}
        </div>
        <form data-mgr-form class="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">${formFields}
          <button type="submit" class="w-full py-2.5 bg-[#D97706] hover:bg-amber-700 text-white text-sm font-bold rounded-xl">${Manage.editing[entity] ? 'Save Changes' : 'Create'}</button>
        </form>
      </div>
      <div>
        <h3 class="text-sm font-black font-outfit mb-2">Existing (${rows.length})</h3>
        <div class="bg-white rounded-2xl border border-[#E5E7EB] p-4">${list}</div>
      </div>`;

    wrap.querySelector('[data-mgr-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      Manage.submit(entity, e.target);
    });
    if (window.lucide) lucide.createIcons();
  },

  async submit(entity, form) {
    const cfg = ENTITIES[entity];
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const data = {};
      for (const f of cfg.fields) {
        const el = form.elements[f.name];
        if (!el) continue;
        if (f.type === 'image') {
          if (el.files[0]) data.imageUrl = await Api.uploadImage(el.files[0]);
        } else if (f.type === 'checkbox') {
          data[f.name] = el.checked;
        } else if (f.type === 'lines') {
          data[f.name] = el.value.split('\n').map((s) => s.trim()).filter(Boolean);
        } else if (f.type === 'number') {
          data[f.name] = el.value === '' ? undefined : Number(el.value);
        } else if (el.value !== '') {
          data[f.name] = el.value;
        }
      }
      const payload = cfg.beforeSubmit ? cfg.beforeSubmit(data) : data;
      const id = Manage.editing[entity]?._id;
      if (id) await Api.put(`${cfg.base}/${id}`, payload, { auth: true });
      else await Api.post(cfg.base, payload, { auth: true });
      showToast(id ? 'Saved.' : 'Created.', 'success');
      Manage.editing[entity] = null;
      Manage.render(entity);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  },

  async edit(entity, id) {
    const rows = await Api.get(Manage.effectiveListPath(entity), { auth: true });
    Manage.editing[entity] = rows.find((r) => r._id === id) || null;
    Manage.render(entity);
    document.getElementById(`mgr-${entity}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async toggleVerify(id, value) {
    try {
      await Api.patch(`/shelters/${id}/verify`, { isVerified: value }, { auth: true });
      showToast(value ? 'Shelter verified and now public.' : 'Shelter unverified.', 'success');
      Manage.render('shelters');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  cancel(entity) {
    Manage.editing[entity] = null;
    Manage.render(entity);
  },

  async remove(entity, id) {
    if (!confirm('Delete this record?')) return;
    try {
      await Api.del(`${ENTITIES[entity].base}/${id}`, { auth: true });
      showToast('Deleted.', 'success');
      if (Manage.editing[entity]?._id === id) Manage.editing[entity] = null;
      Manage.render(entity);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },
};

window.Manage = Manage;

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();
  if (!(await AdminUI.guard())) return;
  const firstTab = { admin: 'overview', shelter_manager: 'shelters', pet_owner: 'pets' }[AdminUI.role] || 'pets';
  AdminUI.showTab(firstTab, document.querySelector(`[data-admin-tab="${firstTab}"]`));
  document.getElementById('addPetForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    AdminUI.createPet(e.target);
  });
});
