// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://xjinqekroxnmygvwitsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaW5xZWtyb3hubXlndndpdHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODY4OTQsImV4cCI6MjA4Njc2Mjg5NH0.8oORbiOP4lcp76LLJV1Rhkz9M5DrF2FQmGrvEIwcHC8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let usuarioLogadoId = null;

// ID Administrativo (Único autorizado a ver a aba Trabalho)
const MEU_ID_AUTORIZADO = '45dfb9ec-4689-46fd-b452-02772abd5e69';

// --- EVENTOS INICIAIS ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        usuarioLogadoId = session.user.id;
        liberarDashboard();
    } else {
        usuarioLogadoId = null;
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-mes').value = new Date().getMonth() + 1;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            usuarioLogadoId = session.user.id;
            liberarDashboard();
        }
    } catch (e) {
        console.error("Erro de sessão:", e);
    }

    const inputSenha = document.getElementById('senha');
    if (inputSenha) inputSenha.addEventListener("keypress", (e) => { if (e.key === "Enter") loginEmail(); });
});

// --- AUTENTICAÇÃO ---
async function loginEmail() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erroEl = document.getElementById('erro-login');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) {
        erroEl.innerText = "Erro ao logar: " + error.message;
        erroEl.classList.remove('d-none');
    } else {
        usuarioLogadoId = data.user.id;
        liberarDashboard();
    }
}

async function cadastrarEmail() {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const erroEl = document.getElementById('erro-login');

    if (senha.length < 6) {
        erroEl.innerText = "A senha deve ter no mínimo 6 caracteres.";
        erroEl.classList.remove('d-none');
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });
    if (error) {
        erroEl.innerText = "Erro ao cadastrar: " + error.message;
        erroEl.classList.remove('d-none');
    } else {
        if (data.session) {
            usuarioLogadoId = data.user.id;
            liberarDashboard();
        } else {
            alert("Cadastro realizado! Verifique seu e-mail.");
        }
    }
}

async function fazerLogout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// --- INTERFACE ---
function liberarDashboard() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('dashboard').classList.remove('d-none');

    const btnTrabalho = document.getElementById('btn-cad-trab'); 
    const tabTrabalho = document.getElementById('tab-trabalho');

    if (usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        if (btnTrabalho) btnTrabalho.style.setProperty('display', 'none', 'important');
        if (tabTrabalho) tabTrabalho.style.setProperty('display', 'none', 'important');
    } else {
        if (btnTrabalho) btnTrabalho.style.display = 'flex';
    }

    carregarDados();
    mudarAbaCadastro('financeiro', document.getElementById('btn-cad-fin'));
}

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

function mudarAbaCadastro(tipo, botaoClicado) {
    if (tipo === 'trabalho' && usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        alert("Acesso restrito.");
        return;
    }

    document.getElementById('tipo-lancamento').value = tipo;
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (botaoClicado) botaoClicado.classList.add('active');

    const titulos = { 'financeiro': 'Financeiro', 'trabalho': 'Controle de Horas', 'fisico': 'Evolução Física' };
    document.getElementById('titulo-pagina').innerText = titulos[tipo];

    ['campos-fin', 'campos-trab', 'campos-fis'].forEach(id => document.getElementById(id).style.display = 'none');
    ['campos-fin', 'campos-trab', 'campos-fis'].forEach(id => {
        document.querySelectorAll(`#${id} input, #${id} select`).forEach(el => el.disabled = true);
    });

    const divDataFim = document.getElementById('div-data-fim');
    const labelData = document.getElementById('label-data');

    if (tipo === 'trabalho') {
        document.getElementById('campos-trab').style.display = 'block';
        document.querySelectorAll('#campos-trab input, #campos-trab select').forEach(el => el.disabled = false);
        divDataFim.style.display = 'block';
        labelData.innerText = 'DATA INICIAL';
    } else {
        divDataFim.style.display = 'none';
        labelData.innerText = 'DATA';
        if (tipo === 'financeiro') {
            document.getElementById('campos-fin').style.display = 'block';
            document.querySelectorAll('#campos-fin input, #campos-fin select').forEach(el => el.disabled = false);
        }
        if (tipo === 'fisico') {
            document.getElementById('campos-fis').style.display = 'block';
            document.querySelectorAll('#campos-fis input, #campos-fis select').forEach(el => el.disabled = false);
        }
    }

    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('show', 'active'));
    document.getElementById(`tab-${tipo === 'financeiro' ? 'financas' : tipo}`).classList.add('show', 'active');
}

// --- INTEGRAÇÃO COM BACKEND ---
async function carregarDados() {
    if (!usuarioLogadoId) return;
    const mes = document.getElementById('filtro-mes').value;
    const ano = new Date().getFullYear();

    // Financeiro
    try {
        const resFin = await fetch(`/financeiro/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
        const dadosFin = await resFin.json();
        
        document.getElementById('fin-ganho').innerText = formatarMoeda(dadosFin.ganho || 0);
        document.getElementById('fin-gasto').innerText = formatarMoeda(dadosFin.gasto || 0);
        document.getElementById('fin-lucro').innerText = formatarMoeda(dadosFin.lucro || 0);
        document.getElementById('fin-poupanca').innerText = formatarMoeda(dadosFin.poupanca || 0);

        const tabelaMesBody = document.getElementById('tabela-mes-financeiro');
        if (tabelaMesBody) {
            tabelaMesBody.innerHTML = '';
            if (!dadosFin.lista || dadosFin.lista.length === 0) {
                tabelaMesBody.innerHTML = '<tr><td colspan="6" class="text-muted py-3">Nenhum lançamento neste mês.</td></tr>';
            } else {
                dadosFin.lista.forEach(item => {
                    let badgeClass = item.tipo === 'Entrada' ? 'bg-success' : (item.tipo === 'Poupanca' ? 'bg-roxo' : 'bg-danger');
                    tabelaMesBody.innerHTML += `
                        <tr>
                            <td class="text-start text-muted">${item.data_formatada}</td>
                            <td class="text-start fw-bold">${item.descricao}</td>
                            <td><span class="badge bg-light text-dark border">${item.categoria}</span></td>
                            <td><span class="badge ${badgeClass}">${item.tipo}</span></td>
                            <td class="text-end fw-bold">${formatarMoeda(item.valor)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary rounded-circle" 
                                    onclick="abrirModalEditFin(${item.id}, '${item.data}', '${item.descricao}', ${item.valor}, '${item.tipo}', '${item.categoria}')">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
        }
    } catch (e) { console.error("Erro Financeiro:", e); }

    try {
        const resFinAnual = await fetch(`/financeiro/anual?ano=${ano}&user_id=${usuarioLogadoId}`);
        const dadosFinAnual = await resFinAnual.json();
        const tabelaFinBody = document.getElementById('tabela-financeiro-anual');
        if (tabelaFinBody) {
            tabelaFinBody.innerHTML = '';
            for (const [categoria, meses] of Object.entries(dadosFinAnual)) {
                let total = 0;
                let linha = `<tr><td class="text-start ps-3 fw-bold text-muted">${categoria}</td>`;
                for (let m = 1; m <= 12; m++) {
                    let v = meses[m] || 0;
                    total += v;
                    linha += `<td>${v > 0 ? v.toLocaleString('pt-BR') : '-'}</td>`;
                }
                linha += `<td class="fw-bold border-start bg-light">${total.toLocaleString('pt-BR')}</td></tr>`;
                tabelaFinBody.innerHTML += linha;
            }
        }
    } catch(e) { console.error("Erro Financeiro Anual:", e); }

    // Trabalho 
    if (usuarioLogadoId === MEU_ID_AUTORIZADO) {
        try {
            const resTrab = await fetch(`/trabalho/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
            const dTr = await resTrab.json();
            document.getElementById('trab-total').innerText = dTr.total_horas;
            document.getElementById('trab-extra').innerText = dTr.extras;
            document.getElementById('trab-salario').innerText = formatarMoeda(dTr.salario);
            if(document.getElementById('trab-valor-extra')) document.getElementById('trab-valor-extra').innerText = formatarMoeda(dTr.valor_extra);

            const tabelaMesTrabBody = document.getElementById('tabela-mes-trabalho');
            if (tabelaMesTrabBody) {
                tabelaMesTrabBody.innerHTML = '';
                if (!dTr.lista || dTr.lista.length === 0) {
                    tabelaMesTrabBody.innerHTML = '<tr><td colspan="5" class="text-muted py-3">Nenhum registro neste mês.</td></tr>';
                } else {
                    dTr.lista.forEach(item => {
                        let badgeClass = item.tipo === 'Extra' ? 'bg-warning text-dark' : 'bg-secondary';
                        tabelaMesTrabBody.innerHTML += `
                            <tr>
                                <td class="text-start text-muted">${item.data_formatada}</td>
                                <td class="text-start fw-bold">${item.projeto}</td>
                                <td><span class="badge ${badgeClass}">${item.tipo}</span></td>
                                <td class="fw-bold">${item.qtd_horas}h</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary rounded-circle" 
                                        onclick="abrirModalEditTrab(${item.id}, '${item.data}', ${item.qtd_horas}, '${item.projeto}', '${item.tipo}')">
                                        <i class="fas fa-pen"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            const resAnualTrab = await fetch(`/trabalho/anual?ano=${ano}&user_id=${usuarioLogadoId}`);
            const dAnTr = await resAnualTrab.json();
            const tabelaBody = document.getElementById('tabela-trabalho-anual');
            if (tabelaBody) {
                tabelaBody.innerHTML = '';
                const nomesMeses = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                for (let m = 1; m <= 12; m++) {
                    const d = dAnTr[m];
                    if (d && d.total > 0) {
                        tabelaBody.innerHTML += `<tr><td class="text-start">${nomesMeses[m]}</td><td>${d.total}h</td><td>${d.extra}h</td><td>${d.normal}h</td></tr>`;
                    }
                }
            }
        } catch(e) { console.error("Erro Trabalho:", e); }
    }

    // Físico
    try {
        const resFis = await fetch(`/fisico/dados?user_id=${usuarioLogadoId}`);
        const dadosFis = await resFis.json();
        atualizarGrafico(dadosFis);
    } catch(e) { console.error("Erro Físico:", e); }
}

async function enviarFormulario(event) {
    event.preventDefault();
    const form = document.getElementById('form-add');
    const formData = new FormData(form);
    const tipo = document.getElementById('tipo-lancamento').value;
    
    if (tipo === 'trabalho' && usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        alert("Sem permissão.");
        return;
    }

    if (tipo === 'trabalho') {
        formData.append('tipo', form.querySelector('[name="tipo_hora"]').value);
    }

    if (tipo === 'fisico') {
        const chavesParaRemover = [];
        formData.forEach((value, key) => { if (value === "") chavesParaRemover.push(key); });
        chavesParaRemover.forEach(k => formData.delete(k));
    }

    let url = (tipo === 'financeiro') ? '/financeiro/salvar' : (tipo === 'trabalho') ? '/trabalho/salvar' : '/fisico/salvar';
    formData.append('user_id', usuarioLogadoId);

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Erro ao salvar no servidor');
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Salvo!';
        btn.disabled = true;

        setTimeout(() => { 
            btn.innerHTML = originalText;
            btn.disabled = false;
            form.reset();
            document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
            if (document.getElementById('campo-data-fim')) document.getElementById('campo-data-fim').value = '';
            carregarDados(); 
        }, 1500);
    } catch (e) { alert("Erro ao salvar! Verifique as informações."); }
}

// --- GRÁFICOS ---
let meuGrafico = null;
function atualizarGrafico(dados) {
    const canvas = document.getElementById('graficoFisico');
    if (!canvas) return;
    if (meuGrafico) meuGrafico.destroy();
    if (!dados || dados.length === 0) return;

    meuGrafico = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: dados.map(d => d.data),
            datasets: [
                { label: 'Peso (kg)', data: dados.map(d => d.peso), borderColor: '#4318FF', tension: 0.3, yAxisID: 'y' },
                { label: '% Gordura', data: dados.map(d => d.gordura), borderColor: '#dc3545', tension: 0.3, yAxisID: 'y1' }
            ]
        },
        options: { maintainAspectRatio: false }
    });
}

// --- MÓDULOS DE EDIÇÃO ---
let modalEditFinObj = null;
let modalEditTrabObj = null;

function abrirModalEditFin(id, data, desc, valor, tipo, cat) {
    document.getElementById('edit-fin-id').value = id;
    document.getElementById('edit-fin-data').value = data;
    document.getElementById('edit-fin-desc').value = desc;
    document.getElementById('edit-fin-valor').value = valor;
    document.getElementById('edit-fin-tipo').value = tipo;
    document.getElementById('edit-fin-cat').value = cat;

    if (!modalEditFinObj) modalEditFinObj = new bootstrap.Modal(document.getElementById('modalEditFin'));
    modalEditFinObj.show();
}

async function salvarEdicaoFin() {
    const id = document.getElementById('edit-fin-id').value;
    const formData = new FormData(document.getElementById('form-edit-fin'));
    formData.append('user_id', usuarioLogadoId);
    
    try {
        const res = await fetch(`/financeiro/atualizar/${id}`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error();
        modalEditFinObj.hide();
        carregarDados(); 
    } catch (e) { alert("Erro ao atualizar financeiro."); }
}

async function excluirFin() {
    const id = document.getElementById('edit-fin-id').value;
    if (!confirm("Excluir este lançamento?")) return;
    try {
        const res = await fetch(`/financeiro/excluir/${id}?user_id=${usuarioLogadoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        modalEditFinObj.hide();
        carregarDados(); 
    } catch (e) { alert("Erro ao excluir."); }
}

function abrirModalEditTrab(id, data, horas, proj, tipo) {
    document.getElementById('edit-trab-id').value = id;
    document.getElementById('edit-trab-data').value = data;
    document.getElementById('edit-trab-horas').value = horas;
    document.getElementById('edit-trab-proj').value = proj;
    document.getElementById('edit-trab-tipo').value = tipo;

    if (!modalEditTrabObj) modalEditTrabObj = new bootstrap.Modal(document.getElementById('modalEditTrab'));
    modalEditTrabObj.show();
}

async function salvarEdicaoTrab() {
    const id = document.getElementById('edit-trab-id').value;
    const formData = new FormData(document.getElementById('form-edit-trab'));
    formData.append('user_id', usuarioLogadoId);

    try {
        const res = await fetch(`/trabalho/atualizar/${id}`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error();
        modalEditTrabObj.hide();
        carregarDados(); 
    } catch (e) { alert("Erro ao atualizar trabalho."); }
}

async function excluirTrab() {
    const id = document.getElementById('edit-trab-id').value;
    if (!confirm("Excluir estas horas?")) return;
    try {
        const res = await fetch(`/trabalho/excluir/${id}?user_id=${usuarioLogadoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        modalEditTrabObj.hide();
        carregarDados(); 
    } catch (e) { alert("Erro ao excluir."); }
}