from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Transacao
from datetime import datetime

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])

@router.get("/dados")
def ler_financeiro(mes: int, ano: int, user_id: str, db: Session = Depends(get_db)):
    # 1. Monta a busca base, filtrando sempre pelo ano e pelo usuário
    query = db.query(Transacao).filter(
        text("EXTRACT(YEAR FROM data) = :ano"),
        Transacao.user_id == user_id
    )
    
    # 2. Se o mês for maior que 0, adiciona o filtro de mês. 
    # Se for 0 (opção "Todos"), ele não aplica esse filtro.
    if mes > 0:
        query = query.filter(text("EXTRACT(MONTH FROM data) = :mes"))
        
    # 3. Executa a busca
    transacoes = query.params(mes=mes, ano=ano).order_by(Transacao.data.desc()).all()
    
    ganho = sum(t.valor for t in transacoes if t.tipo == 'Entrada')
    gasto = sum(t.valor for t in transacoes if t.tipo == 'Saida')
    
    # --- LÓGICA DA POUPANÇA ATUALIZADA ---
    # Subtrai o valor se a categoria for "Variavel", senão soma normalmente.
    poupanca = sum(-t.valor if t.categoria == 'Variavel' else t.valor for t in transacoes if t.tipo == 'Poupanca')
    
    lista_detalhada = [{
        "id": t.id,
        "data": t.data.strftime("%Y-%m-%d"),
        "data_formatada": t.data.strftime("%d/%m/%Y"),
        "descricao": t.descricao,
        "valor": t.valor,
        "tipo": t.tipo,
        "categoria": t.categoria
    } for t in transacoes]
    
    return {
        "ganho": ganho, 
        "gasto": gasto, 
        "lucro": ganho - gasto, 
        "poupanca": poupanca,
        "lista": lista_detalhada
    }

@router.post("/salvar")
def salvar_financeiro(
    user_id: str = Form(...), data: str = Form(...), descricao: str = Form(...),
    valor: float = Form(...), tipo: str = Form(...), cat_fin: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_obj = datetime.strptime(data, '%Y-%m-%d').date()
        db.add(Transacao(user_id=user_id, data=dt_obj, descricao=descricao, valor=valor, tipo=tipo, categoria=cat_fin))
        db.commit()
        return {"msg": "Salvo"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao salvar")

@router.put("/atualizar/{item_id}")
def atualizar_financeiro(
    item_id: int, user_id: str = Form(...), data: str = Form(...), descricao: str = Form(...),
    valor: float = Form(...), tipo: str = Form(...), cat_fin: str = Form(...), db: Session = Depends(get_db)
):
    registro = db.query(Transacao).filter(Transacao.id == item_id, Transacao.user_id == user_id).first()
    if not registro: raise HTTPException(status_code=404, detail="Não encontrado")
    
    try:
        registro.data = datetime.strptime(data, '%Y-%m-%d').date()
        registro.descricao, registro.valor, registro.tipo, registro.categoria = descricao, valor, tipo, cat_fin
        db.commit()
        return {"msg": "Atualizado"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao atualizar")

@router.delete("/excluir/{item_id}")
def excluir_financeiro(item_id: int, user_id: str, db: Session = Depends(get_db)):
    registro = db.query(Transacao).filter(Transacao.id == item_id, Transacao.user_id == user_id).first()
    if not registro: raise HTTPException(status_code=404, detail="Não encontrado")
    db.delete(registro)
    db.commit()
    return {"msg": "Excluído"}

@router.get("/anual")
def relatorio_financeiro_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    # O filtro pelo ano já está garantido aqui nesta linha: EXTRACT(YEAR FROM data) = :ano
    transacoes = db.query(Transacao).filter(
        text("EXTRACT(YEAR FROM data) = :ano"), 
        Transacao.user_id == user_id
    ).params(ano=ano).all()
    
    relatorio = {}
    for t in transacoes:
        if t.categoria not in relatorio: 
            relatorio[t.categoria] = {m: 0.0 for m in range(1, 13)}
            
        # --- MESMA REGRA DA POUPANÇA ---
        # Se for Poupança Variável (Retirada), o valor entra negativo na tabela
        valor_real = -t.valor if (t.tipo == 'Poupanca' and t.categoria == 'Variavel') else t.valor
        
        relatorio[t.categoria][t.data.month] += valor_real
        
    return relatorio