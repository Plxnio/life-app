import csv
from datetime import datetime
from database import SessionLocal
from models import Transacao, Hora, Fisico

db = SessionLocal()

# --- Funções Auxiliares de Conversão ---
def converter_data(str_data):
    """Tenta converter DD/MM/AAAA ou AAAA-MM-DD para objeto Date"""
    try:
        return datetime.strptime(str_data, '%d/%m/%Y').date()
    except ValueError:
        return datetime.strptime(str_data, '%Y-%m-%d').date()

def converter_valor(str_valor):
    """Converte '1.200,50' ou '1200.50' para float 1200.50"""
    if isinstance(str_valor, (int, float)): return float(str_valor)
    # Remove R$ e espaços
    limpo = str_valor.replace('R$', '').strip()
    # Se tiver vírgula, assume formato BR (remove ponto de milhar, troca virgula por ponto)
    if ',' in limpo:
        limpo = limpo.replace('.', '').replace(',', '.')
    return float(limpo)

# ==========================================
# 1. IMPORTAR FINANCEIRO (Lendo CSV)
# ==========================================
def importar_financeiro(arquivo_csv='financeiro.csv'):
    print(f"📂 Lendo {arquivo_csv}...")
    try:
        with open(arquivo_csv, mode='r', encoding='utf-8-sig') as f:
            leitor = csv.DictReader(f, delimiter=';') # Mude para ',' se seu CSV for padrão americano
            
            cont = 0
            for linha in leitor:
                nova_transacao = Transacao(
                    data=converter_data(linha['data']),
                    descricao=linha['descricao'],
                    valor=converter_valor(linha['valor']),
                    tipo=linha['tipo'],       # Entrada, Saida, Poupanca
                    categoria=linha['categoria'] # Fixo, Variavel, etc
                )
                db.add(nova_transacao)
                cont += 1
            
            db.commit()
            print(f"✅ {cont} registros financeiros importados com sucesso!")
            
    except FileNotFoundError:
        print(f"❌ Arquivo '{arquivo_csv}' não encontrado.")
    except Exception as e:
        print(f"❌ Erro ao importar: {e}")

# ==========================================
# 2. IMPORTAR HORAS (Lendo CSV)
# ==========================================
def importar_trabalho(arquivo_csv='trabalho.csv'):
    print(f"📂 Lendo {arquivo_csv}...")
    try:
        with open(arquivo_csv, mode='r', encoding='utf-8-sig') as f:
            leitor = csv.DictReader(f, delimiter=';')
            
            cont = 0
            for linha in leitor:
                nova_hora = Hora(
                    data=converter_data(linha['data']),
                    projeto=linha['projeto'],
                    qtd_horas=converter_valor(linha['horas']),
                    tipo=linha['tipo'] # Normal, Extra
                )
                db.add(nova_hora)
                cont += 1
            
            db.commit()
            print(f"✅ {cont} registros de horas importados com sucesso!")

    except FileNotFoundError:
        print(f"❌ Arquivo '{arquivo_csv}' não encontrado.")
    except Exception as e:
        print(f"❌ Erro ao importar: {e}")

# ==========================================
# 3. IMPORTAR FÍSICO (Manual / Lista)
# ==========================================
def importar_fisico():
    print("💪 Importando dados físicos manuais...")
    
    # Já deixei preenchido com os dados que você mandou na mensagem anterior
    dados_brutos = [
        {
            "data": "24/11/2025",
            "peso": 81.70,
            "gordura": 29.48, # % Massa Gorda
            "cintura": 98.00,
            "abdomen": 105.00
        },
        {
            "data": "28/01/2026",
            "peso": 81.40,
            "gordura": 28.54,
            "cintura": 97.00,
            "abdomen": 106.00
        },
        # Copie e cole mais blocos aqui se tiver mais dados
    ]
    
    for item in dados_brutos:
        novo_fisico = Fisico(
            data=converter_data(item['data']),
            peso=item['peso'],
            perc_gordura=item['gordura'],
            cintura=item['cintura'],
            abdomen=item['abdomen']
        )
        db.add(novo_fisico)
    
    db.commit()
    print(f"✅ {len(dados_brutos)} registros físicos importados!")

# ==========================================
# 🎮 CONTROLE DA EXECUÇÃO
# ==========================================
if __name__ == "__main__":
    
    # Para rodar, tire o '#' da frente da função que deseja executar.
    
    # 1. Financeiro (Precisa do arquivo financeiro.csv na pasta)
    # importar_financeiro()

    # 2. Trabalho (Precisa do arquivo trabalho.csv na pasta)
    # importar_trabalho()

    # 3. Físico (Usa a lista escrita no código acima)
    importar_fisico()
    
    db.close()
    print("🚀 Processo finalizado.")


# ===============================================
# Executar no terminal - python importar_dados.py
# ===============================================