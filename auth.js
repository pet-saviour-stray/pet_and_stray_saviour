// Handles registration, login, session state and header UI updates.
const Auth = {
  user: null,

  isLoggedIn: () => !!Api.getToken(),

  // Roles that get a management dashboard, and its label.
  DASHBOARD_ROLES: ['admin', 'shelter_manager', 'pet_owner'],
  dashboardLabel() {
    return Auth.user && Auth.user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard';
  },
  hasDashboard() {
    return !!Auth.user && Auth.DASHBOARD_ROLES.includes(Auth.user.role);
  },

  async loadSession() {
    if (!Api.getToken()) {
      Auth.user = null;
      Auth.renderHeader();
      return null;
    }
    try {
      const { user } = await Api.get('/auth/me', { auth: true });
      Auth.user = user;
    } catch {
      Api.clearToken();
      Auth.user = null;
    }
    Auth.renderHeader();
    return Auth.user;
  },

  async register(payload) {
    const { token, user } = await Api.post('/auth/register', payload);
    Api.setToken(token);
    Auth.user = user;
    Auth.renderHeader();
    return user;
  },

  async login(email, password) {
    const { token, user } = await Api.post('/auth/login', { email, password });
    Api.setToken(token);
    Auth.user = user;
    Auth.renderHeader();
    return user;
  },

  logout() {
    Api.clearToken();
    Auth.user = null;
    Auth.renderHeader();
    if (typeof showToast === 'function') showToast('You have been signed out.', 'success');
    if (location.pathname.endsWith('admin.html')) location.href = 'index.html';
  },

  // Swaps the header "Sign In / Guest" button for a signed-in state.
  renderHeader() {
    const desktop = Auth.user ? Auth.desktopLoggedIn() : Auth.desktopGuest();
    document.querySelectorAll('[data-auth-slot]').forEach((slot) => { slot.innerHTML = desktop; });
    const mobile = Auth.user ? Auth.mobileLoggedIn() : Auth.mobileGuest();
    document.querySelectorAll('[data-auth-slot-mobile]').forEach((slot) => { slot.innerHTML = mobile; });
    if (window.lucide) lucide.createIcons();
  },

  desktopLoggedIn() {
    const showDash = Auth.hasDashboard();
    return `
      <div class="relative" data-user-menu>
        <button type="button" onclick="toggleUserMenu(event)" class="flex items-center gap-2 p-1.5 pl-2.5 pr-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] shadow-sm hover:bg-stone-50 transition-colors">
          <div class="w-6 h-6 rounded-lg bg-[#065F46] text-white flex items-center justify-center text-xs font-bold uppercase">${(Auth.user.fullName || 'U').charAt(0)}</div>
          <div class="text-left">
            <p class="text-[11px] font-bold leading-none text-[#1F2937]">${Auth.user.fullName.split(' ')[0]}</p>
            <p class="text-[9px] uppercase tracking-wider text-[#065F46] font-bold leading-tight">${Auth.user.role.replace('_', ' ')}</p>
          </div>
          <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-stone-400"></i>
        </button>
        <div data-user-dropdown class="hidden-modal absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-1.5 z-50">
          <div class="px-3 py-2 border-b border-stone-100 mb-1">
            <p class="text-xs font-bold text-[#1F2937] truncate">${Auth.user.fullName}</p>
            <p class="text-[10px] text-stone-400 truncate">${Auth.user.email}</p>
          </div>
          ${showDash ? `<a href="admin.html" class="w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#1F2937] hover:bg-amber-50 flex items-center gap-2"><i data-lucide="layout-dashboard" class="w-3.5 h-3.5 text-amber-600"></i>${Auth.dashboardLabel()}</a>` : ''}
          <button data-logout type="button" class="w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"><i data-lucide="log-out" class="w-3.5 h-3.5"></i>Logout</button>
        </div>
      </div>`;
  },

  desktopGuest() {
    return `
      <button onclick="openModal('authModal')" class="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl bg-white hover:bg-amber-50/70 border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] transition-colors shadow-sm">
        <div class="w-6 h-6 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-xs font-bold"><i data-lucide="user" class="w-3.5 h-3.5"></i></div>
        <div class="text-left">
          <p class="text-[11px] font-bold leading-none text-[#1F2937]">Sign In</p>
          <p class="text-[9px] uppercase tracking-wider text-[#D97706] font-bold leading-tight">Guest</p>
        </div>
      </button>`;
  },

  mobileLoggedIn() {
    const showDash = Auth.hasDashboard();
    return `
      <div class="flex flex-col gap-2">
        <div class="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm flex items-center justify-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-[#065F46] text-white flex items-center justify-center text-xs font-bold uppercase">${(Auth.user.fullName || 'U').charAt(0)}</div>
          <span>${Auth.user.fullName.split(' ')[0]} &middot; ${Auth.user.role.replace('_', ' ')}</span>
        </div>
        ${showDash ? `<a href="admin.html" class="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2"><i data-lucide="layout-dashboard" class="w-4 h-4 text-amber-400"></i>${Auth.dashboardLabel()}</a>` : ''}
        <button data-logout type="button" class="w-full py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm flex items-center justify-center gap-2"><i data-lucide="log-out" class="w-4 h-4"></i>Logout</button>
      </div>`;
  },

  mobileGuest() {
    return `
      <button onclick="openModal('authModal')" class="w-full py-2.5 px-4 rounded-xl bg-amber-100 text-amber-900 font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="user" class="w-4 h-4"></i>User Registration &amp; Login
      </button>`;
  },
};

window.Auth = Auth;

// Toggles the header user dropdown (Dashboard / Logout).
function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  document.querySelectorAll('[data-user-dropdown]').forEach((d) => d.classList.toggle('hidden-modal'));
}
window.toggleUserMenu = toggleUserMenu;

// Delegated logout handler survives header re-renders and icon replacement.
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-logout]')) {
    e.preventDefault();
    Auth.logout();
    return;
  }
  // Close the user dropdown when clicking outside of it.
  if (!e.target.closest('[data-user-menu]')) {
    document.querySelectorAll('[data-user-dropdown]').forEach((d) => d.classList.add('hidden-modal'));
  }
});

// Toggle between login and register views inside the auth modal.
function switchAuthMode(mode) {
  const login = document.getElementById('authLoginView');
  const register = document.getElementById('authRegisterView');
  if (!login || !register) return;
  const showLogin = mode === 'login';
  login.classList.toggle('hidden-modal', !showLogin);
  register.classList.toggle('hidden-modal', showLogin);
  document.querySelectorAll('[data-auth-tab]').forEach((t) => {
    const active = t.getAttribute('data-auth-tab') === mode;
    t.classList.toggle('bg-white', active);
    t.classList.toggle('text-[#1F2937]', active);
    t.classList.toggle('shadow-sm', active);
    t.classList.toggle('text-stone-600', !active);
  });
}
window.switchAuthMode = switchAuthMode;

document.addEventListener('DOMContentLoaded', () => {
  Auth.loadSession();

  document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await Auth.login(this.email.value, this.password.value);
      closeModal('authModal');
      showToast(`Welcome back, ${Auth.user.fullName.split(' ')[0]}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('registerForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await Auth.register({
        fullName: this.fullName.value,
        email: this.email.value,
        password: this.password.value,
        role: this.role.value,
      });
      closeModal('authModal');
      showToast('Account created! You are now signed in.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
});
