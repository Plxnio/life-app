from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Hora
from datetime import datetime, timedelta

router = APIRouter(prefix="/trabalho", tags=["Trabalho"])

VALOR_HORA = 59.52

@router.get("/dados")
def ler_trabalho(mes: int, ano: int, user_id: str, db: Session = Depends(get_db)):
    horas = db.query(Hora).filter(
        text("EXTRACT(MONTH FROM data) = :mes"),
        text("EXTRACT(YEAR FROM data) = :ano"),
        Hora.user_id == user_id
    ).params(mes=mes, ano=ano).order_by(Hora.data.desc()).all()
    
    total_horas = sum(h.qtd_horas for h in horas)
    horas_extras = sum(h.qtd_horas for h in horas if h.tipo == 'Extra')
    
    lista_detalhada = [{
        "id": h.id,
        "data": h.data.strftime("%Y-%m-%d"),
        "data_formatada": h.data.strftime("%d/%m/%Y"),
        "qtd_horas": h.qtd_horas,
        "projeto": h.projeto,
        "tipo": h.tipo
    } for h in horas]
    
    return {
        "total_horas": total_horas, 
        "extras": horas_extras, 
        "salario": total_horas * VALOR_HORA,
        "valor_extra": horas_extras * VALOR_HORA,
        "lista": lista_detalhada
    }

@router.post("/salvar")
def salvar_trabalho(
    user_id: str = Form(...), data: str = Form(...), data_fim: str = Form(None),
    qtd_horas: float = Form(...), projeto: str = Form(...), tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_inicio = datetime.strptime(data, '%Y-%m-%d').date()
        dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').date() if data_fim and data_fim.strip() else dt_inicio
            
        if dt_fim < dt_inicio: raise ValueError("Data final inválida.")
        dias_totais = (dt_fim - dt_inicio).days + 1
        
        for i in range(dias_totais):
            db.add(Hora(user_id=user_id, data=dt_inicio + timedelta(days=i), qtd_horas=qtd_horas, projeto=projeto, tipo=tipo))
            
        db.commit()
        return {"msg": f"Salvo ({dias_totais} dias inseridos)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/atualizar/{item_id}")
def atualizar_trabalho(
    item_id: int, user_id: str = Form(...), data: str = Form(...),
    qtd_horas: float = Form(...), projeto: str = Form(...), tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    registro = db.query(Hora).filter(Hora.id == item_id, Hora.user_id == user_id).first()
    if not registro: raise HTTPException(status_code=404, detail="Não encontrado")
    
    try:
        registro.data = datetime.strptime(data, '%Y-%m-%d').date()
        registro.qtd_horas, registro.projeto, registro.tipo = qtd_horas, projeto, tipo
        db.commit()
        return {"msg": "Atualizado"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao atualizar")

@router.delete("/excluir/{item_id}")
def excluir_trabalho(item_id: int, user_id: str, db: Session = Depends(get_db)):
    registro = db.query(Hora).filter(Hora.id == item_id, Hora.user_id == user_id).first()
    if not registro: raise HTTPException(status_code=404, detail="Não encontrado")
    db.delete(registro)
    db.commit()
    return {"msg": "Excluído"}

@router.get("/anual")
def relatorio_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    horas = db.query(Hora).filter(text("EXTRACT(YEAR FROM data) = :ano"), Hora.user_id == user_id).params(ano=ano).all()
    relatorio = {m: {'total': 0, 'extra': 0, 'normal': 0} for m in range(1, 13)}
    
    for h in horas:
        mes = h.data.month
        relatorio[mes]['total'] += h.qtd_horas
        relatorio[mes]['extra' if h.tipo == 'Extra' else 'normal'] += h.qtd_horas
            
    return relatorio