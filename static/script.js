// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://xjinqekroxnmygvwitsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaW5xZWtyb3hubXlndndpdHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODY4OTQsImV4cCI6MjA4Njc2Mjg5NH0.8oORbiOP4lcp76LLJV1Rhkz9M5DrF2FQmGrvEIwcHC8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let usuarioLogadoId = null;

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

// ✨ FUNÇÃO DE CADASTRO QUE ESTAVA FALTANDO ✨
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
        // Se a confirmação de e-mail estiver OFF no Supabase, ele loga direto
        if (data.session) {
            usuarioLogadoId = data.user.id;
            liberarDashboard();
        } else {
            alert("Cadastro realizado! Verifique seu e-mail (se a confirmação estiver ativa).");
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
    carregarDados();
    mudarAbaCadastro('financeiro', document.getElementById('btn-cad-fin'));
}

// --- RESTANTE DAS FUNÇÕES (PROSSEGUE IGUAL) ---
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function mudarAbaCadastro(tipo, botaoClicado) {
    document.getElementById('tipo-lancamento').value = tipo;
    const botoes = document.querySelectorAll('.nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    if (botaoClicado) botaoClicado.classList.add('active');

    const titulos = { 'financeiro': 'Financeiro', 'trabalho': 'Controle de Horas', 'fisico': 'Evolução Física' };
    const elTitulo = document.getElementById('titulo-pagina');
    if (elTitulo) elTitulo.innerText = titulos[tipo];

    document.getElementById('campos-fin').style.display = 'none';
    document.getElementById('campos-trab').style.display = 'none';
    document.getElementById('campos-fis').style.display = 'none';

    const divDataFim = document.getElementById('div-data-fim');
    const labelData = document.getElementById('label-data');

    if (tipo === 'trabalho') {
        document.getElementById('campos-trab').style.display = 'block';
        divDataFim.style.display = 'block';
        labelData.innerText = 'DATA INICIAL';
    } else {
        divDataFim.style.display = 'none';
        labelData.innerText = 'DATA';
        if (tipo === 'financeiro') document.getElementById('campos-fin').style.display = 'block';
        if (tipo === 'fisico') document.getElementById('campos-fis').style.display = 'block';
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

    // Financeiro
    const resFin = await fetch(`/financeiro/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
    const dadosFin = await resFin.json();
    document.getElementById('fin-ganho').innerText = formatarMoeda(dadosFin.ganho);
    document.getElementById('fin-gasto').innerText = formatarMoeda(dadosFin.gasto);
    document.getElementById('fin-lucro').innerText = formatarMoeda(dadosFin.lucro);
    document.getElementById('fin-poupanca').innerText = formatarMoeda(dadosFin.poupanca);

    // Tabela Anual Fin
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

    // Trabalho
    const resTrab = await fetch(`/trabalho/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
    const dTr = await resTrab.json();
    document.getElementById('trab-total').innerText = dTr.total_horas;
    document.getElementById('trab-extra').innerText = dTr.extras;
    document.getElementById('trab-salario').innerText = formatarMoeda(dTr.salario);
    if(document.getElementById('trab-valor-extra')) document.getElementById('trab-valor-extra').innerText = formatarMoeda(dTr.valor_extra);

    // Físico
    const resFis = await fetch(`/fisico/dados?user_id=${usuarioLogadoId}`);
    const dadosFis = await resFis.json();
    atualizarGrafico(dadosFis);
}

async function enviarFormulario(event) {
    event.preventDefault();
    const form = document.getElementById('form-add');
    const formData = new FormData(form);
    const tipo = document.getElementById('tipo-lancamento').value;
    let url = (tipo === 'financeiro') ? '/financeiro/salvar' : (tipo === 'trabalho') ? '/trabalho/salvar' : '/fisico/salvar';

    formData.append('user_id', usuarioLogadoId);

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Erro ao salvar');
        
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '✅ Salvo!';
        setTimeout(() => { 
            btn.innerHTML = 'Salvar Lançamento';
            form.reset();
            document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
            carregarDados();
        }, 1500);
    } catch (e) { alert("Erro ao salvar."); }
}

let meuGrafico = null;
function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoFisico').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
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