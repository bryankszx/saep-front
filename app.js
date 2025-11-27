// Configuração da API
const API_URL = 'http://localhost:8080/v1/saep';

console.log('App.js carregado');

// Estado da aplicação
const state = {
    produtos: [],
    categorias: [],
    fabricantes: [],
    estoque: [],
    fichaTecnicas: [],
    editingId: null,
    editingType: null,
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando app');
    initApp();
});

async function initApp() {
    try {
        setupEventListeners();
        await loadAllData();
        renderDashboard();
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        showToast('Erro ao conectar com a API', 'error');
        renderDashboard();
    }
}

// ========== CARREGAMENTO DE DADOS ==========
async function loadAllData() {
    try {
        const [produtos, categorias, fabricantes, estoque] = await Promise.all([
            fetch(`${API_URL}/produtos`).then(r => {
                if (!r.ok) throw new Error(`Erro ao carregar produtos: ${r.status}`);
                return r.json();
            }).catch(e => { console.error(e); return { data: [] }; }),
            fetch(`${API_URL}/categorias`).then(r => {
                if (!r.ok) throw new Error(`Erro ao carregar categorias: ${r.status}`);
                return r.json();
            }).catch(e => { console.error(e); return { data: [] }; }),
            fetch(`${API_URL}/fabricantes`).then(r => {
                if (!r.ok) throw new Error(`Erro ao carregar fabricantes: ${r.status}`);
                return r.json();
            }).catch(e => { console.error(e); return { data: [] }; }),
            fetch(`${API_URL}/estoques`).then(r => {
                if (!r.ok) throw new Error(`Erro ao carregar estoques: ${r.status}`);
                return r.json();
            }).catch(e => { console.error(e); return { data: [] }; }),
        ]);

        state.produtos = produtos.data || produtos.produtos || [];
        state.categorias = categorias.categorias || categorias.data || [];
        state.fabricantes = fabricantes.fabricantes || fabricantes.data || [];
        state.estoque = estoque.estoques || estoque.data || [];

        console.log('Dados carregados:', state);
        updateSelects();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            navigateToSection(section);
        });
    });

    // Produtos
    document.getElementById('btnNovoProduto').addEventListener('click', () => {
        state.editingId = null;
        openModal('modalProduto', 'Novo Produto');
        document.getElementById('formProduto').reset();
    });

    document.getElementById('formProduto').addEventListener('submit', handleSaveProduto);

    // Estoque
    document.getElementById('btnNovoEstoque').addEventListener('click', () => {
        state.editingId = null;
        openModal('modalEstoque', 'Nova Movimentação');
        document.getElementById('formEstoque').reset();
    });

    document.getElementById('formEstoque').addEventListener('submit', handleSaveEstoque);

    // Categorias
    document.getElementById('btnNovaCategoria').addEventListener('click', () => {
        state.editingId = null;
        openModal('modalCategoria', 'Nova Categoria');
        document.getElementById('formCategoria').reset();
    });

    document.getElementById('formCategoria').addEventListener('submit', handleSaveCategoria);

    // Fabricantes
    document.getElementById('btnNovoFabricante').addEventListener('click', () => {
        state.editingId = null;
        openModal('modalFabricante', 'Novo Fabricante');
        document.getElementById('formFabricante').reset();
    });

    document.getElementById('formFabricante').addEventListener('submit', handleSaveFabricante);

    // Ficha Técnica
    document.getElementById('btnNovaFichaTecnica').addEventListener('click', () => {
        state.editingId = null;
        openModal('modalFichaTecnica', 'Nova Ficha Técnica');
        document.getElementById('formFichaTecnica').reset();
    });

    document.getElementById('formFichaTecnica').addEventListener('submit', handleSaveFichaTecnica);

    // Fechar modais
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.getElementById('modalOverlay').addEventListener('click', closeAllModals);

    // Filtros
    document.getElementById('filterProdutos').addEventListener('input', filterProdutos);
    document.getElementById('filterCategoria').addEventListener('change', filterProdutos);
    document.getElementById('filterProdutoFicha').addEventListener('change', loadFichaTecnicaPorProduto);

    // Notificações
    document.getElementById('notificationBtn').addEventListener('click', showNotifications);
}

// ========== NAVEGAÇÃO ==========
function navigateToSection(section) {
    state.currentSection = section;

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        produtos: 'Gerenciar Produtos',
        estoque: 'Gerenciar Estoque',
        categorias: 'Gerenciar Categorias',
        fabricantes: 'Gerenciar Fabricantes',
        'ficha-tecnica': 'Gerenciar Fichas Técnicas',
    };

    document.getElementById('pageTitle').textContent = titles[section];

    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(section).classList.add('active');

    switch (section) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'produtos':
            renderProdutos();
            break;
        case 'estoque':
            renderEstoque();
            break;
        case 'categorias':
            renderCategorias();
            break;
        case 'fabricantes':
            renderFabricantes();
            break;
        case 'ficha-tecnica':
            renderFichaTecnica();
            break;
    }
}

// ========== DASHBOARD ==========
function renderDashboard() {
    const totalProdutos = state.produtos.length;
    const valorTotal = state.produtos.reduce((sum, p) => sum + (p.preco * p.estoque), 0);
    const alertas = state.estoque.filter(e => e.quantidadeAtual <= e.estoqueMinimo).length;
    const totalCategorias = state.categorias.length;

    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('valorTotal').textContent = formatCurrency(valorTotal);
    document.getElementById('alertasCriticos').textContent = alertas;
    document.getElementById('totalCategorias').textContent = totalCategorias;
    document.getElementById('notificationBadge').textContent = alertas;

    renderAlertas();
}

function renderAlertas() {
    const container = document.getElementById('alertasContainer');
    const alertas = state.estoque.filter(e => e.quantidadeAtual <= e.estoqueMinimo);

    if (alertas.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum alerta no momento</p>';
        return;
    }

    container.innerHTML = alertas.map(alerta => {
        const produto = state.produtos.find(p => p.id === alerta.produtoId);
        return `
            <div class="alert-item">
                <div class="alert-item-info">
                    <div class="alert-item-name">${produto?.nome || 'Produto'}</div>
                    <div class="alert-item-details">
                        Mínimo: ${alerta.estoqueMinimo} | Atual: ${alerta.quantidadeAtual}
                    </div>
                </div>
                <div class="alert-item-quantity">${alerta.quantidadeAtual}</div>
            </div>
        `;
    }).join('');
}

// ========== PRODUTOS ==========
function renderProdutos() {
    const container = document.getElementById('produtosContainer');
    
    if (state.produtos.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum produto cadastrado</p>';
        return;
    }

    container.innerHTML = state.produtos.map(produto => {
        const categoria = state.categorias.find(c => c.id === produto.idcategoria);
        const fabricante = state.fabricantes.find(f => f.id === produto.idfabricante);
        const estoque = state.estoque.find(e => e.produtoId === produto.id);

        return `
            <div class="product-card">
                <div class="product-image">📱</div>
                <div class="product-content">
                    <div class="product-name">${produto.nome}</div>
                    <div class="product-category">${categoria?.nomecategoria || 'N/A'}</div>
                    <div class="product-price">${formatCurrency(produto.preco)}</div>
                    <div class="product-stock">
                        <span class="product-stock-label">Estoque:</span>
                        <span class="product-stock-value">${produto.estoque}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" onclick="editProduto(${produto.id})">Editar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteProduto(${produto.id})">Deletar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleSaveProduto(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
        const url = state.editingId 
            ? `${API_URL}/produto/${state.editingId}`
            : `${API_URL}/produto`;
        
        const method = state.editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (!response.ok) throw new Error('Erro ao salvar');

        showToast('Produto salvo com sucesso', 'success');
        closeModal('modalProduto');
        await loadAllData();
        renderProdutos();
    } catch (error) {
        showToast('Erro ao salvar produto', 'error');
        console.error(error);
    }
}

async function editProduto(id) {
    const produto = state.produtos.find(p => p.id === id);
    if (!produto) return;

    state.editingId = id;
    const form = document.getElementById('formProduto');
    form.nome.value = produto.nome;
    form.preco.value = produto.preco;
    form.estoque.value = produto.estoque;
    form.idcategoria.value = produto.idcategoria;
    form.idfabricante.value = produto.idfabricante;

    openModal('modalProduto', 'Editar Produto');
}

async function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
        const response = await fetch(`${API_URL}/produto/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro ao deletar');

        showToast('Produto deletado', 'success');
        await loadAllData();
        renderProdutos();
    } catch (error) {
        showToast('Erro ao deletar', 'error');
        console.error(error);
    }
}

function filterProdutos() {
    const nome = document.getElementById('filterProdutos').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;

    const filtered = state.produtos.filter(p => {
        const matchNome = p.nome.toLowerCase().includes(nome);
        const matchCategoria = !categoria || p.idcategoria == categoria;
        return matchNome && matchCategoria;
    });

    const container = document.getElementById('produtosContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum produto encontrado</p>';
        return;
    }

    container.innerHTML = filtered.map(produto => {
        const categoria = state.categorias.find(c => c.id === produto.idcategoria);
        return `
            <div class="product-card">
                <div class="product-image">📱</div>
                <div class="product-content">
                    <div class="product-name">${produto.nome}</div>
                    <div class="product-category">${categoria?.nomecategoria || 'N/A'}</div>
                    <div class="product-price">${formatCurrency(produto.preco)}</div>
                    <div class="product-stock">
                        <span class="product-stock-label">Estoque:</span>
                        <span class="product-stock-value">${produto.estoque}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" onclick="editProduto(${produto.id})">Editar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteProduto(${produto.id})">Deletar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== ESTOQUE ==========
function renderEstoque() {
    const tbody = document.getElementById('estoqueTableBody');

    if (state.estoque.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum estoque cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = state.estoque.map(est => {
        const produto = state.produtos.find(p => p.id === est.produtoId);
        let statusClass = 'normal';
        let statusText = 'Normal';

        if (est.quantidadeAtual <= est.estoqueMinimo) {
            statusClass = 'critico';
            statusText = 'Crítico';
        } else if (est.quantidadeAtual <= est.estoqueMinimo * 1.5) {
            statusClass = 'baixo';
            statusText = 'Baixo';
        }

        return `
            <tr>
                <td>${produto?.nome || 'N/A'}</td>
                <td>${est.quantidadeAtual}</td>
                <td>${est.estoqueMinimo}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="table-actions">
                    <button class="btn btn-primary btn-small" onclick="editEstoque(${est.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="deleteEstoque(${est.id})">Deletar</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleSaveEstoque(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
        const url = state.editingId 
            ? `${API_URL}/estoque/${state.editingId}`
            : `${API_URL}/estoque`;
        
        const method = state.editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (!response.ok) throw new Error('Erro ao salvar');

        showToast('Estoque salvo com sucesso', 'success');
        closeModal('modalEstoque');
        await loadAllData();
        renderEstoque();
    } catch (error) {
        showToast('Erro ao salvar estoque', 'error');
        console.error(error);
    }
}

async function editEstoque(id) {
    const estoque = state.estoque.find(e => e.id === id);
    if (!estoque) return;

    state.editingId = id;
    const form = document.getElementById('formEstoque');
    form.idProduto.value = estoque.produtoId;
    form.quantidadeAtual.value = estoque.quantidadeAtual;
    form.estoqueMinimo.value = estoque.estoqueMinimo;

    openModal('modalEstoque', 'Editar Estoque');
}

async function deleteEstoque(id) {
    if (!confirm('Tem certeza?')) return;

    try {
        const response = await fetch(`${API_URL}/estoque/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro');

        showToast('Estoque deletado', 'success');
        await loadAllData();
        renderEstoque();
    } catch (error) {
        showToast('Erro ao deletar', 'error');
    }
}

// ========== CATEGORIAS ==========
function renderCategorias() {
    const container = document.getElementById('categoriasContainer');

    if (state.categorias.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma categoria cadastrada</p>';
        return;
    }

    container.innerHTML = state.categorias.map(cat => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${cat.nome || cat.nomecategoria}</div>
            </div>
            <div class="card-content">
                <div class="card-info">
                    <span class="card-info-label">Produtos:</span>
                    <span class="card-info-value">${state.produtos.filter(p => p.idcategoria === cat.id).length}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="editCategoria(${cat.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteCategoria(${cat.id})">Deletar</button>
            </div>
        </div>
    `).join('');
}

async function handleSaveCategoria(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    console.log('Enviando categoria:', dados);

    try {
        const url = state.editingId 
            ? `${API_URL}/categoria/${state.editingId}`
            : `${API_URL}/categoria`;
        
        const method = state.editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        const responseData = await response.json();
        console.log('Resposta:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Erro ao salvar');
        }

        showToast('Categoria salva com sucesso', 'success');
        closeModal('modalCategoria');
        await loadAllData();
        renderCategorias();
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao salvar categoria', 'error');
    }
}

async function editCategoria(id) {
    const cat = state.categorias.find(c => c.id === id);
    if (!cat) return;

    state.editingId = id;
    document.getElementById('formCategoria').nomecategoria.value = cat.nome || cat.nomecategoria;
    openModal('modalCategoria', 'Editar Categoria');
}

async function deleteCategoria(id) {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) return;

    try {
        const response = await fetch(`${API_URL}/categoria/${id}`, { method: 'DELETE' });
        const responseData = await response.json();
        
        console.log('Resposta delete:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Erro ao deletar');
        }

        showToast('Categoria deletada com sucesso', 'success');
        await loadAllData();
        renderCategorias();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast(error.message || 'Erro ao deletar categoria', 'error');
    }
}

// ========== FABRICANTES ==========
function renderFabricantes() {
    const container = document.getElementById('fabricantesContainer');

    if (state.fabricantes.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum fabricante cadastrado</p>';
        return;
    }

    container.innerHTML = state.fabricantes.map(fab => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${fab.nomefabricante}</div>
            </div>
            <div class="card-content">
                <div class="card-info">
                    <span class="card-info-label">País:</span>
                    <span class="card-info-value">${fab.paisorigem}</span>
                </div>
                <div class="card-info">
                    <span class="card-info-label">Produtos:</span>
                    <span class="card-info-value">${state.produtos.filter(p => p.idfabricante === fab.id).length}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="editFabricante(${fab.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteFabricante(${fab.id})">Deletar</button>
            </div>
        </div>
    `).join('');
}

async function handleSaveFabricante(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
        const url = state.editingId 
            ? `${API_URL}/fabricante/${state.editingId}`
            : `${API_URL}/fabricante`;
        
        const method = state.editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (!response.ok) throw new Error('Erro');

        showToast('Fabricante salvo', 'success');
        closeModal('modalFabricante');
        await loadAllData();
        renderFabricantes();
    } catch (error) {
        showToast('Erro ao salvar', 'error');
    }
}

async function editFabricante(id) {
    const fab = state.fabricantes.find(f => f.id === id);
    if (!fab) return;

    state.editingId = id;
    const form = document.getElementById('formFabricante');
    form.nomefabricante.value = fab.nomefabricante;
    form.paisorigem.value = fab.paisorigem;
    openModal('modalFabricante', 'Editar Fabricante');
}

async function deleteFabricante(id) {
    if (!confirm('Tem certeza?')) return;

    try {
        const response = await fetch(`${API_URL}/fabricante/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro');

        showToast('Fabricante deletado', 'success');
        await loadAllData();
        renderFabricantes();
    } catch (error) {
        showToast('Erro ao deletar', 'error');
    }
}

// ========== FICHA TÉCNICA ==========
function renderFichaTecnica() {
    const select = document.getElementById('filterProdutoFicha');
    select.innerHTML = '<option value="">Selecione um produto</option>' + 
        state.produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

async function loadFichaTecnicaPorProduto(e) {
    const produtoId = e.target.value;
    if (!produtoId) {
        document.getElementById('fichaTecnicaContainer').innerHTML = 
            '<p class="empty-state">Selecione um produto</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/ficha-tecnica/produto/${produtoId}`);
        const data = await response.json();
        const fichas = data.data || [];

        const container = document.getElementById('fichaTecnicaContainer');
        if (fichas.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhuma ficha técnica</p>';
            return;
        }

        container.innerHTML = fichas.map(ficha => `
            <div class="spec-card">
                <div class="spec-label">${ficha.especificacao}</div>
                <div class="spec-value">${ficha.valor}</div>
                <div class="spec-actions">
                    <button class="btn btn-primary btn-small" onclick="editFichaTecnica(${ficha.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="deleteFichaTecnica(${ficha.id})">Deletar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

async function handleSaveFichaTecnica(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData);

    try {
        const url = state.editingId 
            ? `${API_URL}/ficha-tecnica/${state.editingId}`
            : `${API_URL}/ficha-tecnica`;
        
        const method = state.editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (!response.ok) throw new Error('Erro');

        showToast('Ficha técnica salva', 'success');
        closeModal('modalFichaTecnica');
        const produtoId = document.getElementById('filterProdutoFicha').value;
        if (produtoId) {
            const event = { target: { value: produtoId } };
            await loadFichaTecnicaPorProduto(event);
        }
    } catch (error) {
        showToast('Erro ao salvar', 'error');
    }
}

async function editFichaTecnica(id) {
    try {
        const response = await fetch(`${API_URL}/ficha-tecnica/${id}`);
        const data = await response.json();
        const ficha = data.data;

        state.editingId = id;
        const form = document.getElementById('formFichaTecnica');
        form.produtoId.value = ficha.produtoId;
        form.especificacao.value = ficha.especificacao;
        form.valor.value = ficha.valor;

        openModal('modalFichaTecnica', 'Editar Ficha Técnica');
    } catch (error) {
        showToast('Erro ao carregar', 'error');
    }
}

async function deleteFichaTecnica(id) {
    if (!confirm('Tem certeza?')) return;

    try {
        const response = await fetch(`${API_URL}/ficha-tecnica/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erro');

        showToast('Ficha técnica deletada', 'success');
        const produtoId = document.getElementById('filterProdutoFicha').value;
        if (produtoId) {
            const event = { target: { value: produtoId } };
            await loadFichaTecnicaPorProduto(event);
        }
    } catch (error) {
        showToast('Erro ao deletar', 'error');
    }
}

// ========== UTILITÁRIOS ==========
function updateSelects() {
    // Categorias
    const catSelects = document.querySelectorAll('select[name="idcategoria"]');
    catSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione</option>' +
            state.categorias.map(c => `<option value="${c.id}">${c.nome || c.nomecategoria}</option>`).join('');
    });

    // Fabricantes
    const fabSelects = document.querySelectorAll('select[name="idfabricante"]');
    fabSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione</option>' +
            state.fabricantes.map(f => `<option value="${f.id}">${f.nomefabricante}</option>`).join('');
    });

    // Produtos
    const prodSelects = document.querySelectorAll('select[name="idProduto"], select[name="produtoId"]');
    prodSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecione</option>' +
            state.produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    });

    // Categorias filtro
    document.getElementById('filterCategoria').innerHTML = '<option value="">Todas</option>' +
        state.categorias.map(c => `<option value="${c.id}">${c.nome || c.nomecategoria}</option>`).join('');
}

function openModal(modalId, title) {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (!document.querySelector('.modal.active')) {
        document.getElementById('modalOverlay').classList.remove('active');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('modalOverlay').classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast active ${type}`;
    setTimeout(() => toast.classList.remove('active'), 3000);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

function showNotifications() {
    const alertas = state.estoque.filter(e => e.quantidadeAtual <= e.estoqueMinimo).length;
    alert(`Você tem ${alertas} alerta(s) de estoque baixo`);
}
