// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://xjinqekroxnmygvwitsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaW5xZWtyb3hubXlndndpdHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODY4OTQsImV4cCI6MjA4Njc2Mjg5NH0.8oORbiOP4lcp76LLJV1Rhkz9M5DrF2FQmGrvEIwcHC8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let usuarioLogadoId = null;

// --- OUVINTE DE AUTENTICAÇÃO (MÁGICA PARA O GOOGLE FUNCIONAR) ---
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
    console.log("Página carregada, JS funcionando!");

    // Configura datas e selects
    document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-mes').value = new Date().getMonth() + 1;

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            usuarioLogadoId = session.user.id;
            liberarDashboard();
        }
    } catch (e) {
        console.error("Erro ao checar sessão:", e);
    }

    // Tecla Enter no Login
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

    if (!email || !senha) {
        erroEl.innerText = "Por favor, digite seu e-mail e senha.";
        erroEl.classList.remove('d-none');
        return;
    }

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

    if (!email || !senha) {
        erroEl.innerText = "Por favor, preencha e-mail e senha para cadastrar.";
        erroEl.classList.remove('d-none');
        return;
    }

    if (senha.length < 6) {
        erroEl.innerText = "A senha deve ter pelo menos 6 caracteres.";
        erroEl.classList.remove('d-none');
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });

    if (error) {
        erroEl.innerText = "Erro ao cadastrar: " + error.message;
        erroEl.classList.remove('d-none');
    } else {
        alert("Cadastro realizado! Se você não desativou a confirmação, olhe sua caixa de e-mail.");
        document.getElementById('senha').value = '';
    }
}

async function loginGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    });
}

async function fazerLogout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// ✨ A FUNÇÃO QUE TINHA SUMIDO ESTÁ AQUI! ✨
function liberarDashboard() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('dashboard').classList.remove('d-none');
    carregarDados();
    mudarAbaCadastro('financeiro', document.getElementById('btn-cad-fin'));
}

// --- Função Auxiliar de Formatação (R$ 1.000,00) ---
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// --- CONTROLE MESTRE (Muda Lateral + Dashboard) ---
function mudarAbaCadastro(tipo, botaoClicado) {
    document.getElementById('tipo-lancamento').value = tipo;

    const botoes = document.querySelectorAll('.nav-btn');
    botoes.forEach(btn => btn.classList.remove('active'));

    if (botaoClicado) {
        botaoClicado.classList.add('active');
    }

    const titulos = {
        'financeiro': 'Financeiro',
        'trabalho': 'Controle de Horas',
        'fisico': 'Evolução Física'
    };
    const elTitulo = document.getElementById('titulo-pagina');
    if (elTitulo) elTitulo.innerText = titulos[tipo];

    document.getElementById('campos-fin').style.display = 'none';
    document.getElementById('campos-trab').style.display = 'none';
    document.getElementById('campos-fis').style.display = 'none';

    const divDataFim = document.getElementById('div-data-fim');
    const labelData = document.getElementById('label-data');
    const inputDataFim = document.getElementById('campo-data-fim');

    if (tipo === 'trabalho') {
        document.getElementById('campos-trab').style.display = 'block';
        divDataFim.style.display = 'block';
        labelData.innerText = 'DATA INICIAL';
    } else {
        divDataFim.style.display = 'none';
        inputDataFim.value = '';
        labelData.innerText = 'DATA';
        if (tipo === 'financeiro') document.getElementById('campos-fin').style.display = 'block';
        if (tipo === 'fisico') document.getElementById('campos-fis').style.display = 'block';
    }

    document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('show', 'active'));

    if (tipo === 'financeiro') document.getElementById('tab-financas').classList.add('show', 'active');
    if (tipo === 'trabalho') document.getElementById('tab-trabalho').classList.add('show', 'active');
    if (tipo === 'fisico') document.getElementById('tab-fisico').classList.add('show', 'active');
}

// --- Carregar Dados da API ---
async function carregarDados() {
    if (!usuarioLogadoId) return;

    const mes = document.getElementById('filtro-mes').value;
    const ano = new Date().getFullYear();

    // 1. Busca Financeiro (KPIs)
    const resFin = await fetch(`/financeiro/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
    const dadosFin = await resFin.json();
    document.getElementById('fin-ganho').innerText = formatarMoeda(dadosFin.ganho);
    document.getElementById('fin-gasto').innerText = formatarMoeda(dadosFin.gasto);
    document.getElementById('fin-lucro').innerText = formatarMoeda(dadosFin.lucro);
    document.getElementById('fin-poupanca').innerText = formatarMoeda(dadosFin.poupanca);

    // 1.1 Tabela Financeira Cruzada
    const resFinAnual = await fetch(`/financeiro/anual?ano=${ano}&user_id=${usuarioLogadoId}`);
    const dadosFinAnual = await resFinAnual.json();
    const tabelaFinBody = document.getElementById('tabela-financeiro-anual');

    if (tabelaFinBody) {
        tabelaFinBody.innerHTML = '';
        const fmtCurto = (v) => v > 0 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-';

        for (const [categoria, meses] of Object.entries(dadosFinAnual)) {
            let linhaHtml = `<tr><td class="text-start ps-3 fw-bold text-muted">${categoria}</td>`;
            let totalCategoria = 0;
            for (let m = 1; m <= 12; m++) {
                const valor = meses[m] || 0;
                totalCategoria += valor;
                linhaHtml += `<td>${fmtCurto(valor)}</td>`;
            }
            linhaHtml += `<td class="fw-bold border-start bg-light">${fmtCurto(totalCategoria)}</td></tr>`;
            tabelaFinBody.innerHTML += linhaHtml;
        }
    }

    // 2. Busca Trabalho
    const resTrab = await fetch(`/trabalho/dados?mes=${mes}&ano=${ano}&user_id=${usuarioLogadoId}`);
    const dadosTrab = await resTrab.json();

    document.getElementById('trab-total').innerText = dadosTrab.total_horas;
    document.getElementById('trab-extra').innerText = dadosTrab.extras;
    document.getElementById('trab-salario').innerText = formatarMoeda(dadosTrab.salario);

    const elValorExtra = document.getElementById('trab-valor-extra');
    if (elValorExtra) elValorExtra.innerText = formatarMoeda(dadosTrab.valor_extra);

    // 2.1 Tabela Anual Trabalho
    const resAnual = await fetch(`/trabalho/anual?ano=${ano}&user_id=${usuarioLogadoId}`);
    const dadosAnuais = await resAnual.json();
    const tabelaBody = document.getElementById('tabela-trabalho-anual');

    if (tabelaBody) {
        tabelaBody.innerHTML = '';
        const nomesMeses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        for (let m = 1; m <= 12; m++) {
            const d = dadosAnuais[m.toString()];
            if (d.total > 0) {
                const linha = `
                    <tr>
                        <td class="text-start ps-4 fw-bold text-muted">${nomesMeses[m]}</td>
                        <td class="fw-bold">${d.total}h</td>
                        <td class="text-warning fw-bold">${d.extra > 0 ? d.extra + 'h' : '-'}</td>
                        <td class="text-muted small">${d.normal}h</td>
                    </tr>
                `;
                tabelaBody.innerHTML += linha;
            }
        }
    }

    // 3. Busca Físico
    const resFis = await fetch(`/fisico/dados?user_id=${usuarioLogadoId}`);
    const dadosFis = await resFis.json();
    atualizarGrafico(dadosFis);

    // 3.1 Tabela de Histórico Físico
    const tabFis = document.getElementById('tabela-fisico-historico');
    if (tabFis) {
        tabFis.innerHTML = '';

        const corPeso = (v) => !v ? '' : (v <= 49.76 ? 'text-primary' : (v <= 66.97 ? 'text-success' : (v <= 80.42 ? 'text-warning' : 'text-danger')));
        const corImc = (v) => !v ? '' : (v <= 18.5 ? 'text-primary' : (v <= 24.9 ? 'text-success' : (v <= 29.9 ? 'text-warning' : 'text-danger')));
        const corPercGorda = (v) => !v ? '' : (v <= 11 ? 'text-primary' : (v <= 17 ? 'text-success' : (v <= 27 ? 'text-warning' : 'text-danger')));
        const corKgGorda = (v) => !v ? '' : (v <= 8.71 ? 'text-primary' : (v <= 13.46 ? 'text-success' : (v <= 21.37 ? 'text-warning' : 'text-danger')));

        for (let i = 0; i < dadosFis.length; i++) {
            if (i === 0) {
                dadosFis[i].evolucaoHtml = `<span class="text-muted">-</span>`;
            } else {
                let pesoAtual = dadosFis[i].peso;
                let pesoAnt = dadosFis[i - 1].peso;

                if (pesoAtual && pesoAnt) {
                    let perc = ((pesoAtual - pesoAnt) / pesoAnt) * 100;
                    let corEvo = perc < 0 ? 'text-success' : (perc > 0 ? 'text-danger' : 'text-muted');
                    let sinal = perc > 0 ? '+' : '';
                    dadosFis[i].evolucaoHtml = `<span class="${corEvo} fw-bold px-2 py-1 rounded bg-light">${sinal}${perc.toFixed(2).replace('.', ',')}%</span>`;
                } else {
                    dadosFis[i].evolucaoHtml = `<span class="text-muted">-</span>`;
                }
            }
        }

        dadosFis.slice().reverse().forEach(d => {
            const row = `
                <tr>
                    <td class="text-muted">${d.data}</td>
                    <td class="fw-bold ${corPeso(d.peso)}">${d.peso ? d.peso.toLocaleString('pt-BR') + ' kg' : '-'}</td>
                    <td>${d.evolucaoHtml}</td>
                    <td class="fw-bold ${corImc(d.imc)}">${d.imc ? d.imc.toLocaleString('pt-BR') : '-'}</td>
                    <td class="fw-bold ${corPercGorda(d.gordura)}">${d.gordura ? d.gordura.toLocaleString('pt-BR') + '%' : '-'}</td>
                    <td class="fw-bold ${corKgGorda(d.massa_gorda_kg)}">${d.massa_gorda_kg ? d.massa_gorda_kg.toLocaleString('pt-BR') + ' kg' : '-'}</td>
                    <td class="text-muted">${d.massa_magra ? d.massa_magra.toLocaleString('pt-BR') + ' kg' : '-'}</td>
                    <td class="text-muted">${d.cintura ? d.cintura.toLocaleString('pt-BR') + ' cm' : '-'}</td>
                </tr>
            `;
            tabFis.innerHTML += row;
        });
    }
}

// --- Enviar Dados ---
async function enviarFormulario(event) {
    event.preventDefault();
    const form = document.getElementById('form-add');
    const formData = new FormData(form);
    const tipo = document.getElementById('tipo-lancamento').value;

    let url = "";

    const chavesParaRemover = [];
    formData.forEach((value, key) => {
        if (value === "") {
            chavesParaRemover.push(key);
        }
    });
    chavesParaRemover.forEach(k => formData.delete(k));

    if (tipo === 'financeiro') {
        url = '/financeiro/salvar';
        const catValue = form.querySelector('[name="cat_fin"]').value;
        if (catValue && !formData.has('categoria')) formData.append('categoria', catValue);
    } else if (tipo === 'trabalho') {
        url = '/trabalho/salvar';
        const tipoHoraValue = form.querySelector('[name="tipo_hora"]').value;
        if (tipoHoraValue && !formData.has('tipo')) formData.append('tipo', tipoHoraValue);
    } else if (tipo === 'fisico') {
        url = '/fisico/salvar';
    }

    formData.append('user_id', usuarioLogadoId);

    try {
        const response = await fetch(url, { method: 'POST', body: formData });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro no servidor');
        }

        const btnSubmit = form.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerHTML;

        btnSubmit.innerHTML = '✅ Salvo!';
        btnSubmit.classList.replace('btn-primary', 'btn-success');

        setTimeout(() => {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.classList.replace('btn-success', 'btn-primary');

            form.reset();
            document.getElementById('campo-data').value = new Date().toISOString().split('T')[0];

            mudarAbaCadastro(tipo, null);
        }, 1500);

        carregarDados();
    } catch (error) {
        alert("Erro ao salvar! Verifique se a DATA está preenchida.");
        console.error(error);
    }
}

// --- Chart.js (Gráfico) ---
let meuGrafico = null;

function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoFisico').getContext('2d');

    const labels = dados.map(d => d.data);
    const pesos = dados.map(d => d.peso);
    const gorduras = dados.map(d => d.gordura);

    if (meuGrafico) meuGrafico.destroy();

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Peso (kg)',
                    data: pesos,
                    borderColor: '#4318FF',
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: '% Gordura',
                    data: gorduras,
                    borderColor: '#dc3545',
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left' },
                y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}