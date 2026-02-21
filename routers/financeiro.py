from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Transacao  # Verifique se no seu models.py o nome é Transacao
from datetime import datetime

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])

@router.get("/dados")
def ler_financeiro(mes: int, ano: int, user_id: str, db: Session = Depends(get_db)):
    # Adicionado filtro de user_id para segurança e privacidade
    transacoes = db.query(Transacao).filter(
        text("EXTRACT(MONTH FROM data) = :mes"), 
        text("EXTRACT(YEAR FROM data) = :ano"),
        Transacao.user_id == user_id
    ).params(mes=mes, ano=ano).all()
    
    ganho = sum(t.valor for t in transacoes if t.tipo == 'Entrada')
    gasto = sum(t.valor for t in transacoes if t.tipo == 'Saida')
    poupanca = sum(t.valor for t in transacoes if t.tipo == 'Poupanca')
    
    return {"ganho": ganho, "gasto": gasto, "lucro": ganho - gasto, "poupanca": poupanca}

@router.post("/salvar")
def salvar_financeiro(
    user_id: str = Form(...),
    data: str = Form(...),
    descricao: str = Form(...),
    valor: float = Form(...),
    tipo: str = Form(...),
    cat_fin: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_obj = datetime.strptime(data, '%Y-%m-%d').date()
        
        # Mudado de Financeiro para Transacao para bater com o import
        novo_registro = Transacao(
            user_id=user_id,
            data=dt_obj,
            descricao=descricao,
            valor=valor,
            tipo=tipo,
            categoria=cat_fin
        )
        db.add(novo_registro)
        db.commit()
        return {"msg": "Salvo com sucesso"}
    except Exception as e:
        db.rollback()
        print(f"Erro ao salvar financeiro: {e}")
        raise HTTPException(status_code=400, detail="Erro ao salvar registro")

@router.get("/anual")
def relatorio_financeiro_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    # Adicionado filtro de user_id para que você veja apenas o SEU relatório
    transacoes = db.query(Transacao).filter(
        text("EXTRACT(YEAR FROM data) = :ano"),
        Transacao.user_id == user_id
    ).params(ano=ano).all()
    
    relatorio = {}
    
    for t in transacoes:
        cat = t.categoria
        mes = t.data.month
        val = t.valor
        
        if cat not in relatorio:
            relatorio[cat] = {m: 0.0 for m in range(1, 13)}
            
        relatorio[cat][mes] += val

    return relatorio