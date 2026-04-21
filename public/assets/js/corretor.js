// ============================================================
// corretor.js — Painel do Corretor
// ============================================================

const API = '/api';
let uploadedPhotos = [];
let currentPage    = 'overview';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

/* ============================================================
   AUTH
   ============================================================ */
async function checkAuth() {
    try {
        const res = await apiFetch('/api/auth_check.php');
        if (!res.logado) {
            redirectLogin();
            return;
        }
        document.getElementById('sidebarUserName').textContent  = res.nome;
        document.getElementById('sidebarUserEmail').textContent = res.email;
        initDashboard();
    } catch {
        redirectLogin();
    }
}

function redirectLogin() {
    if (!window.location.pathname.includes('login')) {
        window.location.href = '/corretor/login.html';
    }
}

/* ---- LOGIN PAGE ---- */
async function doLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('.btn-login');
    const err  = document.getElementById('loginError');

    btn.disabled    = true;
    btn.textContent = 'Entrando...';
    err.style.display = 'none';

    try {
        const res = await apiFetch('/api/login.php', 'POST', {
            email: form.email.value.trim(),
            senha: form.senha.value,
        });

        if (res.success) {
            window.location.href = '/corretor/';
        }
    } catch(er) {
        err.textContent   = er.message || 'Email ou senha incorretos.';
        err.style.display = 'block';
        btn.disabled    = false;
        btn.textContent = 'Entrar';
    }
}

async function doLogout() {
    try { await apiFetch('/api/logout.php'); } catch {}
    window.location.href = '/corretor/login.html';
}

/* ============================================================
   DASHBOARD INIT
   ============================================================ */
function initDashboard() {
    initSidebar();
    showPage('overview');
    loadStats();
}

function initSidebar() {
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.addEventListener('click', () => {
            const page = link.dataset.page;
            showPage(page);
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    document.getElementById('btnLogout')?.addEventListener('click', doLogout);
    document.getElementById('btnNewProp')?.addEventListener('click', () => showPage('novo'));
}

function showPage(name) {
    currentPage = name;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`page-${name}`);
    if (page) page.classList.add('active');

    const titles = {
        overview: { h: 'Painel Geral', sub: 'Visão geral da imobiliária' },
        leads:    { h: 'Leads / Contatos', sub: 'Clientes que deixaram contato' },
        imoveis:  { h: 'Imóveis', sub: 'Gestão do portfólio' },
        novo:     { h: 'Novo Imóvel', sub: 'Cadastrar nova propriedade' },
    };

    const t = titles[name];
    if (t) {
        document.getElementById('topbarTitle').textContent = t.h;
        document.getElementById('topbarSub').textContent   = t.sub;
    }

    document.getElementById('btnNewProp').style.display = name === 'imoveis' || name === 'overview' ? 'flex' : 'none';

    // Load data lazily
    if (name === 'leads')   loadLeads();
    if (name === 'imoveis') loadPropertiesAdmin();
    if (name === 'novo')    initUploadZone();
}

/* ============================================================
   STATS
   ============================================================ */
async function loadStats() {
    try {
        const s = await apiFetch('/api/dashboard.php?aba=stats');
        document.getElementById('statImoveis').textContent  = s.total_imoveis  || 0;
        document.getElementById('statLeads').textContent    = s.total_leads    || 0;
        document.getElementById('statVenda').textContent    = s.imoveis_venda  || 0;
        document.getElementById('statHoje').textContent     = s.leads_hoje     || 0;
    } catch(e) {
        console.error('Erro ao carregar stats', e);
    }
}

/* ============================================================
   LEADS
   ============================================================ */
async function loadLeads() {
    const tbody = document.getElementById('leadsBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#6b7280">Carregando...</td></tr>';

    try {
        const leads = await apiFetch('/api/dashboard.php?aba=leads');
        if (!leads.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#6b7280">Nenhum lead ainda. Aguarde os primeiros contatos! 🎯</td></tr>';
            return;
        }

        tbody.innerHTML = leads.map(l => {
            const data = new Date(l.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const vistos = l.imoveis_detalhes?.map(i =>
                `<span class="imovel-tag" title="R$ ${formatPrice(i.preco)}">#${i.id} ${truncate(i.titulo, 24)}</span>`
            ).join('') || '<span style="color:#9ca3af;font-size:.8rem">Nenhum</span>';

            return `
            <tr>
              <td class="td-name">${escHtml(l.nome)}</td>
              <td class="td-phone"><a href="tel:${escHtml(l.telefone)}">${escHtml(l.telefone)}</a></td>
              <td>${l.email ? `<a href="mailto:${escHtml(l.email)}" style="color:#b8941f">${escHtml(l.email)}</a>` : '—'}</td>
              <td>${l.mensagem ? truncate(l.mensagem, 50) : '—'}</td>
              <td><div class="imoveis-vistos-list">${vistos}</div></td>
              <td style="font-size:.8rem;color:#6b7280;white-space:nowrap">${data}</td>
            </tr>`;
        }).join('');
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:24px">Erro ao carregar leads.</td></tr>';
    }
}

/* ============================================================
   PROPERTIES ADMIN
   ============================================================ */
async function loadPropertiesAdmin() {
    const grid = document.getElementById('adminPropsGrid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:#6b7280">Carregando...</p>';

    try {
        const props = await apiFetch('/api/dashboard.php?aba=imoveis');

        if (!props.length) {
            grid.innerHTML = '<p style="color:#6b7280;padding:32px 0">Nenhum imóvel cadastrado ainda. Clique em "Novo Imóvel" para começar!</p>';
            return;
        }

        grid.innerHTML = props.map(p => `
            <div class="prop-card" data-id="${p.id}">
              <div class="prop-card-img">
                <img src="${p.foto_capa || '/uploads/casa1_1.jpg'}" alt="${escHtml(p.titulo)}" loading="lazy" onerror="this.src='/uploads/casa1_1.jpg'">
                <span class="prop-card-status status-${p.ativo ? p.status : 'inativo'}">
                  ${p.ativo ? (p.status === 'venda' ? 'Venda' : 'Aluguel') : 'Inativo'}
                </span>
              </div>
              <div class="prop-card-body">
                <p class="prop-card-title">${escHtml(p.titulo)}</p>
                <p class="prop-card-location">📍 ${escHtml(p.bairro)}, ${escHtml(p.cidade)}</p>
                <p class="prop-card-price">${formatPrice(p.preco)}</p>
                <div class="prop-card-actions">
                  <button class="btn-sm btn-sm-gold" onclick="viewProp(${p.id})">👁 Ver</button>
                  <button class="btn-sm btn-sm-danger" onclick="confirmDelete(${p.id})">🗑 Remover</button>
                </div>
              </div>
            </div>`).join('');

    } catch(e) {
        grid.innerHTML = '<p style="color:#ef4444">Erro ao carregar imóveis.</p>';
    }
}

function viewProp(id) { window.open(`/imovel.html?id=${id}`, '_blank'); }

async function confirmDelete(id) {
    if (!confirm('Remover este imóvel do portfólio?')) return;
    showToast('Funcionalidade de remoção: marque como inativo no banco de dados.', 'info');
    // Implementação simples: uma chamada DELETE poderia ser adicionada aqui
}

/* ============================================================
   NEW PROPERTY FORM
   ============================================================ */
function initUploadZone() {
    uploadedPhotos = [];
    const zone     = document.getElementById('uploadZone');
    const input    = document.getElementById('uploadInput');
    const previews = document.getElementById('uploadPreviews');

    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('drag-over');
        handleFiles([...e.dataTransfer.files]);
    });

    input.addEventListener('change', () => handleFiles([...input.files]));

    async function handleFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const path = await uploadFile(file);
            if (path) {
                uploadedPhotos.push(path);
                addPreview(path);
            }
        }
    }

    function addPreview(path) {
        if (!previews) return;
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${path}" alt="preview">
            <button class="preview-remove" title="Remover">✕</button>`;
        div.querySelector('.preview-remove').addEventListener('click', () => {
            uploadedPhotos = uploadedPhotos.filter(p => p !== path);
            div.remove();
        });
        previews.appendChild(div);
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('foto', file);
    try {
        const res = await fetch('/api/upload.php', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.caminho) return data.caminho;
        showToast('Erro no upload: ' + (data.error || 'desconhecido'), 'error');
        return null;
    } catch {
        showToast('Falha no upload', 'error');
        return null;
    }
}

async function saveNewProperty(e) {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('.btn-save');
    btn.disabled    = true;
    btn.textContent = 'Salvando...';

    const payload = {
        titulo:    form.titulo.value.trim(),
        descricao: form.descricao.value.trim(),
        preco:     parseFloat(form.preco.value),
        endereco:  form.endereco.value.trim(),
        bairro:    form.bairro.value.trim(),
        cidade:    form.cidade.value.trim(),
        area:      form.area.value ? parseFloat(form.area.value) : null,
        quartos:   form.quartos.value   ? parseInt(form.quartos.value)   : null,
        banheiros: form.banheiros.value ? parseInt(form.banheiros.value) : null,
        vagas:     form.vagas.value     ? parseInt(form.vagas.value)     : null,
        tipo:      form.tipo.value,
        status:    form.status.value,
        destaque:  form.destaque.checked ? 1 : 0,
        fotos:     uploadedPhotos,
    };

    if (!payload.titulo || !payload.preco) {
        showToast('Preencha título e preço.', 'error');
        btn.disabled = false; btn.textContent = 'Salvar Imóvel';
        return;
    }

    try {
        const res = await apiFetch('/api/imoveis.php', 'POST', payload);
        showToast('Imóvel cadastrado com sucesso! 🎉', 'success');
        form.reset();
        uploadedPhotos = [];
        document.getElementById('uploadPreviews').innerHTML = '';
        setTimeout(() => showPage('imoveis'), 1500);
    } catch(er) {
        showToast('Erro: ' + er.message, 'error');
        btn.disabled = false; btn.textContent = 'Salvar Imóvel';
    }
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

function truncate(str, max) { return str && str.length > max ? str.slice(0, max) + '…' : str; }

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => t.className = '', 4000);
}
