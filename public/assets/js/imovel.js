// ============================================================
// imovel.js — Página de Detalhe do Imóvel
// ============================================================

const API = '/api';
let currentProperty = null;
let currentPhotoIdx = 0;
let viewedIds = JSON.parse(localStorage.getItem('imobidemo_viewed') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    if (!id) {
        window.location.href = '/';
        return;
    }

    loadProperty(id);
    initContactForm(id);
});

async function loadProperty(id) {
    try {
        const p = await apiFetch(`/api/imoveis.php?id=${id}`);
        currentProperty = p;

        // Track view
        if (!viewedIds.includes(id)) {
            viewedIds.push(id);
            localStorage.setItem('imobidemo_viewed', JSON.stringify(viewedIds));
        }

        renderProperty(p);
    } catch(e) {
        document.getElementById('content').innerHTML = `
            <div style="text-align:center;padding:80px 24px">
                <div style="font-size:4rem;margin-bottom:16px">🏠</div>
                <h2 style="margin-bottom:12px">Imóvel não encontrado</h2>
                <p style="color:#6b7280;margin-bottom:24px">Este imóvel pode ter sido removido ou não existe.</p>
                <a href="/" style="display:inline-block;background:#b8941f;color:#0f1923;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none">← Voltar</a>
            </div>`;
    }
}

function renderProperty(p) {
    // Title & meta
    document.title = `${p.titulo} — ImobiDemo`;

    // Gallery
    const fotos = p.fotos && p.fotos.length ? p.fotos : ['/uploads/casa1_1.jpg'];
    renderGallery(fotos);

    // Details
    document.getElementById('propTitulo').textContent  = p.titulo;
    document.getElementById('propPreco').textContent   = formatPrice(p.preco) + (p.status === 'aluguel' ? '/mês' : '');
    document.getElementById('propEndereco').textContent = `${p.endereco} — ${p.bairro}, ${p.cidade}`;
    document.getElementById('propDescricao').textContent = p.descricao || '';
    document.getElementById('propStatus').textContent  = p.status === 'venda' ? 'Venda' : 'Aluguel';
    document.getElementById('propStatus').className    = `card-badge badge-${p.status}`;

    // Specs
    const specs = [
        p.quartos   && { icon: '🛏', label: 'Quartos',   val: p.quartos },
        p.banheiros && { icon: '🚿', label: 'Banheiros', val: p.banheiros },
        p.vagas     && { icon: '🚗', label: 'Vagas',     val: p.vagas },
        p.area      && { icon: '📐', label: 'Área',      val: p.area + ' m²' },
        p.tipo      && { icon: '🏠', label: 'Tipo',      val: capitalize(p.tipo) },
        p.cidade    && { icon: '📍', label: 'Cidade',    val: p.cidade },
    ].filter(Boolean);

    document.getElementById('propSpecs').innerHTML = specs.map(s => `
        <div class="spec-item">
            <div class="spec-icon">${s.icon}</div>
            <div>
                <div class="spec-label">${s.label}</div>
                <div class="spec-val">${s.val}</div>
            </div>
        </div>`).join('');

    document.getElementById('content').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

/* ---- Gallery ---- */
function renderGallery(fotos) {
    const main  = document.getElementById('galleryMain');
    const thumbs = document.getElementById('galleryThumbs');

    if (!main || !thumbs) return;

    // Main image
    const setMain = (idx) => {
        currentPhotoIdx = idx;
        main.src = fotos[idx];
        thumbs.querySelectorAll('.thumb').forEach((t, i) => {
            t.classList.toggle('active', i === idx);
        });
    };

    main.src = fotos[0];
    main.alt = currentProperty?.titulo || '';

    // Thumbnails
    thumbs.innerHTML = fotos.map((f, i) => `
        <img src="${f}" class="thumb${i === 0 ? ' active' : ''}" alt="Foto ${i+1}" loading="lazy">`).join('');

    thumbs.querySelectorAll('.thumb').forEach((t, i) => {
        t.addEventListener('click', () => setMain(i));
    });

    // Arrow navigation
    document.getElementById('galleryPrev')?.addEventListener('click', () => {
        setMain((currentPhotoIdx - 1 + fotos.length) % fotos.length);
    });

    document.getElementById('galleryNext')?.addEventListener('click', () => {
        setMain((currentPhotoIdx + 1) % fotos.length);
    });

    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') document.getElementById('galleryPrev')?.click();
        if (e.key === 'ArrowRight') document.getElementById('galleryNext')?.click();
    });
}

/* ---- Contact Form ---- */
function initContactForm(propId) {
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
            mensagem:       form.mensagem.value.trim() || `Tenho interesse no imóvel: ${currentProperty?.titulo}`,
            imoveis_vistos: viewedIds,
        };

        try {
            await apiFetch('/api/clientes.php', 'POST', payload);
            document.getElementById('formSuccess').style.display = 'block';
            form.style.display = 'none';
        } catch(err) {
            showToast('Erro ao enviar. Tente novamente.', 'error');
            btn.disabled = false;
            btn.textContent = 'Enviar Mensagem';
        }
    });
}

/* ---- Utilities ---- */
async function apiFetch(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro');
    return data;
}

function formatPrice(v) {
    return 'R$ ' + parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `show ${type}`;
    setTimeout(() => t.className = '', 3500);
}
