// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://xjinqekroxnmygvwitsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaW5xZWtyb3hubXlndndpdHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODY4OTQsImV4cCI6MjA4Njc2Mjg5NH0.8oORbiOP4lcp76LLJV1Rhkz9M5DrF2FQmGrvEIwcHC8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let usuarioLogadoId = null;

// ID Administrativo (Único autorizado a ver a aba Trabalho)
const MEU_ID_AUTORIZADO = '45dfb9ec-4689-46fd-b452-02772abd5e69';

// --- OUVINTE DE AUTENTICAÇÃO ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        usuarioLogadoId = session.user.id;
        liberarDashboard();
    } else {
        usuarioLogadoId = null;
    }
});

// --- VERIFICAÇÕES AO CARREGAR A PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Página carregada!");

    document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-mes').value = new Date().getMonth() + 1;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            usuarioLogadoId = session.user.id;
            liberarDashboard();
        }
    } catch (e) {
        console.error("Erro ao checar sessão:", e);
    }

    const inputSenha = document.getElementById('senha');
    if (inputSenha) {
        inputSenha.addEventListener("keypress", (e) => { if (e.key === "Enter") loginEmail(); });
    }
});

// --- FUNÇÕES DE AUTENTICAÇÃO ---

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

function liberarDashboard() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('dashboard').classList.remove('d-none');

    // --- TRAVA DE SEGURANÇA VISUAL ---
    const btnTrabalho = document.getElementById('btn-cad-trab'); 
    const tabTrabalho = document.getElementById('tab-trabalho');

    if (usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        if (btnTrabalho) btnTrabalho.style.setProperty('display', 'none', 'important');
        if (tabTrabalho) tabTrabalho.style.setProperty('display', 'none', 'important');
    } else {
        // MUDANÇA: Usando display 'flex' para manter o alinhamento com os outros botões do menu
        if (btnTrabalho) btnTrabalho.style.display = 'flex';
    }

    carregarDados();
    mudarAbaCadastro('financeiro', document.getElementById('btn-cad-fin'));
}

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function mudarAbaCadastro(tipo, botaoClicado) {
    if (tipo === 'trabalho' && usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        alert("Acesso restrito.");
        return;
    }

    document.getElementById('tipo-lancamento').value = tipo;
    const botoes = document.querySelectorAll('.nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    if (botaoClicado) botaoClicado.classList.add('active');

    const titulos = { 'financeiro': 'Financeiro', 'trabalho': 'Controle de Horas', 'fisico': 'Evolução Física' };
    const elTitulo = document.getElementById('titulo-pagina');
    if (elTitulo) elTitulo.innerText = titulos[tipo];

    // 1. Esconde tudo visualmente
    document.getElementById('campos-fin').style.display = 'none';
    document.getElementById('campos-trab').style.display = 'none';
    document.getElementById('campos-fis').style.display = 'none';

    // 2. DESATIVA TODOS os inputs das abas (Isso conserta o bug do botão de salvar!)
    document.querySelectorAll('#campos-fin input, #campos-fin select').forEach(el => el.disabled = true);
    document.querySelectorAll('#campos-trab input, #campos-trab select').forEach(el => el.disabled = true);
    document.querySelectorAll('#campos-fis input, #campos-fis select').forEach(el => el.disabled = true);

    const divDataFim = document.getElementById('div-data-fim');
    const labelData = document.getElementById('label-data');

    // 3. Reativa apenas a aba selecionada
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
    if (tipo === 'financeiro') document.getElementById('tab-financas').classList.add('show', 'active');
    if (tipo === 'trabalho') document.getElementById('tab-trabalho').classList.add('show', 'active');
    if (tipo === 'fisico') document.getElementById('tab-fisico').classList.add('show', 'active');
}

async function carregarDados() {
    if (!usuarioLogadoId) return;
    const mes = document.getElementById('filtro-mes').value;
    const ano = new Date().getFullYear();

    // 1. Financeiro
    try {
        const resFin = await fetch(`/financeiro/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
        const dadosFin = await resFin.json();
        
        document.getElementById('fin-ganho').innerText = formatarMoeda(dadosFin.ganho || 0);
        document.getElementById('fin-gasto').innerText = formatarMoeda(dadosFin.gasto || 0);
        document.getElementById('fin-lucro').innerText = formatarMoeda(dadosFin.lucro || 0);
        document.getElementById('fin-poupanca').innerText = formatarMoeda(dadosFin.poupanca || 0);

        // --- TABELA DO MÊS COM PROTEÇÃO ---
        const tabelaMesBody = document.getElementById('tabela-mes-financeiro');
        if (tabelaMesBody) {
            tabelaMesBody.innerHTML = '';
            // Verificação dupla: garante que a lista existe antes de tentar ler o .length
            if (!dadosFin.lista || dadosFin.lista.length === 0) {
                tabelaMesBody.innerHTML = '<tr><td colspan="6" class="text-muted py-3">Nenhum lançamento neste mês.</td></tr>';
            } else {
                dadosFin.lista.forEach(item => {
                    let badgeClass = item.tipo === 'Entrada' ? 'bg-success' : (item.tipo === 'Poupanca' ? 'bg-warning' : 'bg-danger');
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
    } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
    }

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
    } catch(e) { console.error("Erro financeiro anual:", e); }

    // 2. Trabalho 
    if (usuarioLogadoId === MEU_ID_AUTORIZADO) {
        try {
            const resTrab = await fetch(`/trabalho/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
            const dTr = await resTrab.json();
            document.getElementById('trab-total').innerText = dTr.total_horas;
            document.getElementById('trab-extra').innerText = dTr.extras;
            document.getElementById('trab-salario').innerText = formatarMoeda(dTr.salario);
            if(document.getElementById('trab-valor-extra')) document.getElementById('trab-valor-extra').innerText = formatarMoeda(dTr.valor_extra);

            // --- TABELA DO MÊS TRABALHO COM PROTEÇÃO ---
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
            // -------------------------------------------

            const resAnualTrab = await fetch(`/trabalho/anual?ano=${ano}&user_id=${usuarioLogadoId}`);
            const dAnTr = await resAnualTrab.json();
            const tabelaBody = document.getElementById('tabela-trabalho-anual');
            if (tabelaBody) {
                tabelaBody.innerHTML = '';
                const nomesMeses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                for (let m = 1; m <= 12; m++) {
                    const d = dAnTr[m];
                    if (d && d.total > 0) {
                        tabelaBody.innerHTML += `<tr><td class="text-start">${nomesMeses[m]}</td><td>${d.total}h</td><td>${d.extra}h</td><td>${d.normal}h</td></tr>`;
                    }
                }
            }
        } catch(e) { console.error("Erro trabalho:", e); }
    }

    // 3. Físico
    try {
        const resFis = await fetch(`/fisico/dados?user_id=${usuarioLogadoId}`);
        const dadosFis = await resFis.json();
        atualizarGrafico(dadosFis);
    } catch(e) { console.error("Erro físico:", e); }
}

async function enviarFormulario(event) {
    event.preventDefault();
    const form = document.getElementById('form-add');
    
    // Como os campos das outras abas estão desativados, o FormData pega APENAS o que importa!
    const formData = new FormData(form);
    const tipo = document.getElementById('tipo-lancamento').value;
    
    if (tipo === 'trabalho' && usuarioLogadoId !== MEU_ID_AUTORIZADO) {
        alert("Você não tem permissão para salvar horas.");
        return;
    }

    if (tipo === 'trabalho') {
        const tipoHora = form.querySelector('[name="tipo_hora"]').value;
        formData.append('tipo', tipoHora);
    }

    // A limpeza de campos vazios só deve acontecer no Físico (que tem vários opcionais)
    // Se removermos campos do financeiro, o FastAPI recusa a conexão (Erro 422)
    if (tipo === 'fisico') {
        const chavesParaRemover = [];
        formData.forEach((value, key) => {
            if (value === "") chavesParaRemover.push(key);
        });
        chavesParaRemover.forEach(k => formData.delete(k));
    }

    let url = (tipo === 'financeiro') ? '/financeiro/salvar' : (tipo === 'trabalho') ? '/trabalho/salvar' : '/fisico/salvar';
    formData.append('user_id', usuarioLogadoId);

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error("Erro no servidor:", errText);
            throw new Error(errText || 'Erro ao salvar');
        }
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Salvo!';
        btn.disabled = true;

        setTimeout(() => { 
            btn.innerHTML = originalText;
            btn.disabled = false;
            form.reset();
            document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
            
            // Limpando explicitamente o campo da data final após salvar
            const campoDataFim = document.getElementById('campo-data-fim');
            if (campoDataFim) {
                campoDataFim.value = '';
            }

            carregarDados(); // Recarrega os painéis automaticamente
        }, 1500);
    } catch (e) { 
        alert("Erro ao salvar! Abra o painel F12 (Console) para ver qual dado faltou preencher."); 
    }
}

let meuGrafico = null;
function atualizarGrafico(dados) {
    const canvas = document.getElementById('graficoFisico');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    
    // Se não tiver dados, não quebra o gráfico
    if(!dados || dados.length === 0) return;

    meuGrafico = new Chart(ctx, {
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

// ==========================================
// MÓDULO DE EDIÇÃO FINANCEIRA
// ==========================================
let modalEditFinObj = null;

function abrirModalEditFin(id, data, desc, valor, tipo, cat) {
    document.getElementById('edit-fin-id').value = id;
    document.getElementById('edit-fin-data').value = data;
    document.getElementById('edit-fin-desc').value = desc;
    document.getElementById('edit-fin-valor').value = valor;
    document.getElementById('edit-fin-tipo').value = tipo;
    document.getElementById('edit-fin-cat').value = cat;

    if (!modalEditFinObj) {
        modalEditFinObj = new bootstrap.bootstrap.Modal(document.getElementById('modalEditFin'));
    }
    modalEditFinObj.show();
}

async function salvarEdicaoFin() {
    const id = document.getElementById('edit-fin-id').value;
    const formData = new FormData();
    formData.append('user_id', usuarioLogadoId);
    formData.append('data', document.getElementById('edit-fin-data').value);
    formData.append('descricao', document.getElementById('edit-fin-desc').value);
    formData.append('valor', document.getElementById('edit-fin-valor').value);
    formData.append('tipo', document.getElementById('edit-fin-tipo').value);
    formData.append('cat_fin', document.getElementById('edit-fin-cat').value);

    try {
        const res = await fetch(`/financeiro/atualizar/${id}`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error('Erro ao atualizar');
        
        modalEditFinObj.hide();
        carregarDados(); // Atualiza a tela na hora!
    } catch (e) {
        alert("Erro ao salvar edição.");
    }
}

async function excluirFin() {
    const id = document.getElementById('edit-fin-id').value;
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;

    try {
        const res = await fetch(`/financeiro/excluir/${id}?user_id=${usuarioLogadoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir');
        
        modalEditFinObj.hide();
        carregarDados(); 
    } catch (e) {
        alert("Erro ao excluir lançamento.");
    }
}

// ==========================================
// MÓDULO DE EDIÇÃO TRABALHO
// ==========================================
let modalEditTrabObj = null;

function abrirModalEditTrab(id, data, horas, proj, tipo) {
    document.getElementById('edit-trab-id').value = id;
    document.getElementById('edit-trab-data').value = data;
    document.getElementById('edit-trab-horas').value = horas;
    document.getElementById('edit-trab-proj').value = proj;
    document.getElementById('edit-trab-tipo').value = tipo;

    if (!modalEditTrabObj) {
        modalEditTrabObj = new bootstrap.Modal(document.getElementById('modalEditTrab'));
    }
    modalEditTrabObj.show();
}

async function salvarEdicaoTrab() {
    const id = document.getElementById('edit-trab-id').value;
    const formData = new FormData();
    formData.append('user_id', usuarioLogadoId);
    formData.append('data', document.getElementById('edit-trab-data').value);
    formData.append('qtd_horas', document.getElementById('edit-trab-horas').value);
    formData.append('projeto', document.getElementById('edit-trab-proj').value);
    formData.append('tipo', document.getElementById('edit-trab-tipo').value);

    try {
        const res = await fetch(`/trabalho/atualizar/${id}`, { method: 'PUT', body: formData });
        if (!res.ok) throw new Error('Erro ao atualizar trabalho');
        
        modalEditTrabObj.hide();
        carregarDados(); 
    } catch (e) {
        alert("Erro ao salvar edição.");
    }
}

async function excluirTrab() {
    const id = document.getElementById('edit-trab-id').value;
    if (!confirm("Tem certeza que deseja excluir estas horas?")) return;

    try {
        const res = await fetch(`/trabalho/excluir/${id}?user_id=${usuarioLogadoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir trabalho');
        
        modalEditTrabObj.hide();
        carregarDados(); 
    } catch (e) {
        alert("Erro ao excluir lançamento.");
    }
}

