// ============================================================
// main.js — Site do Cliente
// ============================================================

/* ---- Config ---- */
const API = '/api';

/* ---- State ---- */
let allProperties   = [];
let viewedIds       = JSON.parse(localStorage.getItem('imobidemo_viewed') || '[]');
let currentFilters  = {};
let searchTimeout   = null;

/* ---- DOM Ready ---- */
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initHeroSearch();
    initFilters();
    loadFeatured();
    loadAll();
    initContactForm();
    initScrollAnimations();
    updateViewedBadge();
});

/* ============================================================
   NAVBAR
   ============================================================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    });

    hamburger?.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    // Close menu on link click
    navLinks?.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
}

/* ============================================================
   HERO SEARCH
   ============================================================ */
function initHeroSearch() {
    const input = document.getElementById('heroSearch');
    const btn   = document.getElementById('heroBtnSearch');

    if (!input) return;

    const doSearch = () => {
        const q = input.value.trim();
        if (q) {
            document.getElementById('allSection').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                document.getElementById('filterBusca').value = q;
                applyFilters();
            }, 600);
        } else {
            document.getElementById('allSection').scrollIntoView({ behavior: 'smooth' });
        }
    };

    btn?.addEventListener('click', doSearch);
    input?.addEventListener('keydown', e => e.key === 'Enter' && doSearch());
}

/* ============================================================
   FILTERS
   ============================================================ */
function initFilters() {
    const btn   = document.getElementById('btnFilter');
    const reset = document.getElementById('btnReset');

    btn?.addEventListener('click', applyFilters);
    reset?.addEventListener('click', resetFilters);

    // Real-time on select changes
    ['filterStatus', 'filterTipo', 'filterQuartos'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    });
}

function applyFilters() {
    currentFilters = {
        status:    document.getElementById('filterStatus')?.value  || '',
        tipo:      document.getElementById('filterTipo')?.value    || '',
        quartos:   document.getElementById('filterQuartos')?.value || '',
        preco_max: document.getElementById('filterPreco')?.value   || '',
        busca:     document.getElementById('filterBusca')?.value   || '',
    };

    // Filter locally from allProperties
    let result = [...allProperties];

    if (currentFilters.status)  result = result.filter(p => p.status  === currentFilters.status);
    if (currentFilters.tipo)    result = result.filter(p => p.tipo    === currentFilters.tipo);
    if (currentFilters.quartos) result = result.filter(p => parseInt(p.quartos) >= parseInt(currentFilters.quartos));
    if (currentFilters.preco_max) result = result.filter(p => parseFloat(p.preco) <= parseFloat(currentFilters.preco_max));

    if (currentFilters.busca) {
        const q = currentFilters.busca.toLowerCase();
        result = result.filter(p =>
            p.titulo.toLowerCase().includes(q) ||
            p.bairro.toLowerCase().includes(q) ||
            p.cidade.toLowerCase().includes(q)
        );
    }

    renderPropertyGrid(result, 'allGrid');
}

function resetFilters() {
    ['filterStatus','filterTipo','filterQuartos','filterPreco','filterBusca'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    currentFilters = {};
    renderPropertyGrid(allProperties, 'allGrid');
}

/* ============================================================
   LOAD PROPERTIES
   ============================================================ */
async function loadFeatured() {
    showSkeleton('featuredGrid', 3);
    try {
        const data = await apiFetch('/api/imoveis.php?destaque=1');
        const featured = data.slice(0, 6);
        renderPropertyGrid(featured, 'featuredGrid');
    } catch(e) {
        document.getElementById('featuredGrid').innerHTML =
            '<div class="empty-state"><div class="empty-icon">🏠</div><p>Não foi possível carregar os imóveis.</p></div>';
    }
}

async function loadAll() {
    showSkeleton('allGrid', 6);
    try {
        allProperties = await apiFetch('/api/imoveis.php');
        renderPropertyGrid(allProperties, 'allGrid');
    } catch(e) {
        document.getElementById('allGrid').innerHTML =
            '<div class="empty-state"><div class="empty-icon">🏠</div><p>Não foi possível carregar os imóveis.</p></div>';
    }
}

/* ============================================================
   RENDER CARDS
   ============================================================ */
function renderPropertyGrid(properties, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>Nenhum imóvel encontrado com esses filtros.</p>
            </div>`;
        return;
    }

    container.innerHTML = properties.map(p => buildCard(p)).join('');

    // Add click handlers
    container.querySelectorAll('.card').forEach(card => {
        const id = parseInt(card.dataset.id);

        card.addEventListener('click', e => {
            if (e.target.closest('.card-fav')) return;
            openProperty(id);
        });

        card.querySelector('.btn-card')?.addEventListener('click', e => {
            e.stopPropagation();
            openProperty(id);
        });

        card.querySelector('.card-fav')?.addEventListener('click', e => {
            e.stopPropagation();
            toggleFavorite(id, card.querySelector('.card-fav'));
        });
    });
}

function buildCard(p) {
    const foto   = p.foto_capa || '/uploads/casa1_1.jpg';
    const preco  = formatPrice(p.preco);
    const isNew  = isRecent(p.criado_em);

    return `
    <div class="card fade-up" data-id="${p.id}">
      <div class="card-img">
        <img src="${foto}" alt="${escHtml(p.titulo)}" loading="lazy" onerror="this.src='/uploads/casa1_1.jpg'">
        <span class="card-badge badge-${p.status}">${p.status === 'venda' ? 'Venda' : 'Aluguel'}</span>
        <button class="card-fav ${viewedIds.includes(p.id) ? 'active' : ''}" title="Favoritar">♡</button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escHtml(p.titulo)}</h3>
        <p class="card-location">📍 ${escHtml(p.bairro)}, ${escHtml(p.cidade)}</p>
        <div class="card-features">
          ${p.quartos   ? `<span class="feat"><span class="feat-icon">🛏</span> ${p.quartos} qto${p.quartos > 1 ? 's' : ''}</span>` : ''}
          ${p.banheiros ? `<span class="feat"><span class="feat-icon">🚿</span> ${p.banheiros} bnh</span>` : ''}
          ${p.vagas     ? `<span class="feat"><span class="feat-icon">🚗</span> ${p.vagas} vaga${p.vagas > 1 ? 's' : ''}</span>` : ''}
          ${p.area      ? `<span class="feat"><span class="feat-icon">📐</span> ${p.area} m²</span>` : ''}
        </div>
        <div class="card-footer">
          <div class="card-price">
            ${preco}
            <small>${p.status === 'aluguel' ? '/mês' : 'Venda'}</small>
          </div>
          <button class="btn-card">Ver Detalhes</button>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   OPEN PROPERTY
   ============================================================ */
function openProperty(id) {
    // Track viewed
    if (!viewedIds.includes(id)) {
        viewedIds.push(id);
        localStorage.setItem('imobidemo_viewed', JSON.stringify(viewedIds));
        updateViewedBadge();
    }

    window.location.href = `/imovel.html?id=${id}`;
}

function updateViewedBadge() {
    const badge = document.getElementById('viewedBadge');
    if (badge) {
        badge.textContent = viewedIds.length;
        badge.style.display = viewedIds.length > 0 ? 'inline-block' : 'none';
    }
}

function toggleFavorite(id, btn) {
    const idx = viewedIds.indexOf(id);
    if (idx === -1) {
        viewedIds.push(id);
        btn.classList.add('active');
        btn.textContent = '♥';
        showToast('Adicionado aos favoritos!', 'info');
    } else {
        viewedIds.splice(idx, 1);
        btn.classList.remove('active');
        btn.textContent = '♡';
        showToast('Removido dos favoritos', 'info');
    }
    localStorage.setItem('imobidemo_viewed', JSON.stringify(viewedIds));
    updateViewedBadge();
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('.btn-submit');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        const payload = {
            nome:           form.nome.value.trim(),
            telefone:       form.telefone.value.trim(),
            email:          form.email.value.trim(),
            mensagem:       form.mensagem.value.trim(),
            imoveis_vistos: viewedIds,
        };

        try {
            const res = await apiFetch('/api/clientes.php', 'POST', payload);
            document.getElementById('formSuccess').style.display = 'block';
            form.style.display = 'none';
            showToast('Contato enviado com sucesso!', 'success');
        } catch(e) {
            showToast('Erro ao enviar. Tente novamente.', 'error');
            btn.disabled = false;
            btn.textContent = 'Quero ser Contactado';
        }
    });
}

/* ============================================================
   SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Re-observe when cards are added
    const grids = ['featuredGrid', 'allGrid'];
    grids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const mo = new MutationObserver(() => {
            el.querySelectorAll('.fade-up:not(.visible)').forEach(card => observer.observe(card));
        });
        mo.observe(el, { childList: true });
    });
}

/* ============================================================
   SKELETON LOADING
   ============================================================ */
function showSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Array(count).fill(`
        <div class="card-skeleton">
            <div class="skel skel-img"></div>
            <div class="skel-body">
                <div class="skel skel-line" style="width:80%"></div>
                <div class="skel skel-line short"></div>
                <div class="skel skel-line" style="width:90%"></div>
            </div>
        </div>`).join('');
}

/* ============================================================
   UTILITIES
   ============================================================ */
async function apiFetch(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
    return data;
}

function formatPrice(v) {
    return 'R$ ' + parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function isRecent(dateStr) {
    if (!dateStr) return false;
    return (Date.now() - new Date(dateStr).getTime()) < 7 * 86400000;
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => t.className = '', 3500);
}
