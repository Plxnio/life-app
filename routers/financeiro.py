from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Transacao
from datetime import datetime

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])

@router.get("/dados")
def ler_financeiro(mes: int, ano: int, db: Session = Depends(get_db)):
    # Lógica específica da página financeira
    transacoes = db.query(Transacao).filter(
        text(f"EXTRACT(MONTH FROM data) = {mes}"), 
        text(f"EXTRACT(YEAR FROM data) = {ano}")
    ).all()
    
    ganho = sum(t.valor for t in transacoes if t.tipo == 'Entrada')
    gasto = sum(t.valor for t in transacoes if t.tipo == 'Saida')
    poupanca = sum(t.valor for t in transacoes if t.tipo == 'Poupanca')
    
    return {"ganho": ganho, "gasto": gasto, "lucro": ganho - gasto, "poupanca": poupanca}

@router.post("/salvar")
def salvar_financeiro(
    user_id: str = Form(...), # <--- RECEBENDO O ID AQUI
    data: str = Form(...),
    descricao: str = Form(...),
    valor: float = Form(...),
    tipo: str = Form(...),
    categoria: str = Form(...),
    db: Session = Depends(get_db)
):
    dt_obj = datetime.strptime(data, '%Y-%m-%d').date()
    
    # SALVANDO O ID NO BANCO AQUI 👇
    nova_transacao = Transacao(
        user_id=user_id, 
        data=dt_obj, 
        descricao=descricao, 
        valor=valor, 
        tipo=tipo, 
        categoria=categoria
    )
    db.add(nova_transacao)
    db.commit()
    return {"msg": "Salvo com sucesso"}

@router.get("/anual")
def relatorio_financeiro_anual(ano: int, db: Session = Depends(get_db)):
    # Busca todas as transações do ano
    transacoes = db.query(Transacao).filter(
        text(f"EXTRACT(YEAR FROM data) = {ano}")
    ).all()
    
    # Estrutura: { 'Mercado': {1: 100, 2: 0, ...}, 'Aluguel': {1: 500...} }
    relatorio = {}
    
    # 1. Agrupa os valores
    for t in transacoes:
        cat = t.categoria
        mes = t.data.month
        val = t.valor
        
        if cat not in relatorio:
            # Cria um dicionário com os 12 meses zerados para essa categoria
            relatorio[cat] = {m: 0.0 for m in range(1, 13)}
            
        relatorio[cat][mes] += val

    return relatorio