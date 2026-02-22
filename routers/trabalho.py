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
    
    recebimento_total = total_horas * VALOR_HORA
    recebimento_extra = horas_extras * VALOR_HORA 
    
    # Criando a lista detalhada para a tabela (Igual ao Financeiro)
    lista_detalhada = []
    for h in horas:
        lista_detalhada.append({
            "id": h.id,
            "data": h.data.strftime("%Y-%m-%d"),
            "data_formatada": h.data.strftime("%d/%m/%Y"),
            "qtd_horas": h.qtd_horas,
            "projeto": h.projeto,
            "tipo": h.tipo
        })
    
    return {
        "total_horas": total_horas, 
        "extras": horas_extras, 
        "salario": recebimento_total,
        "valor_extra": recebimento_extra,
        "lista": lista_detalhada # <--- A lista nova vai aqui!
    }

@router.post("/salvar")
def salvar_trabalho(
    user_id: str = Form(...),
    data: str = Form(...),
    data_fim: str = Form(None),
    qtd_horas: float = Form(...),
    projeto: str = Form(...),
    tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_inicio = datetime.strptime(data, '%Y-%m-%d').date()
        if data_fim and data_fim.strip():
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        else:
            dt_fim = dt_inicio
            
        if dt_fim < dt_inicio:
            raise ValueError("A 'Até Data' não pode ser anterior.")
        
        delta = dt_fim - dt_inicio
        dias_totais = delta.days + 1
        
        for i in range(dias_totais):
            data_atual = dt_inicio + timedelta(days=i)
            novo_registro = Hora(user_id=user_id, data=data_atual, qtd_horas=qtd_horas, projeto=projeto, tipo=tipo)
            db.add(novo_registro)
            
        db.commit()
        return {"msg": f"Salvo com sucesso ({dias_totais} dias inseridos)"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar: {str(e)}")

# --- NOVAS ROTAS DE EDIÇÃO E EXCLUSÃO (TRABALHO) ---
@router.put("/atualizar/{item_id}")
def atualizar_trabalho(
    item_id: int,
    user_id: str = Form(...),
    data: str = Form(...),
    qtd_horas: float = Form(...),
    projeto: str = Form(...),
    tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    registro = db.query(Hora).filter(Hora.id == item_id, Hora.user_id == user_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    
    try:
        registro.data = datetime.strptime(data, '%Y-%m-%d').date()
        registro.qtd_horas = qtd_horas
        registro.projeto = projeto
        registro.tipo = tipo
        db.commit()
        return {"msg": "Atualizado com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao atualizar")

@router.delete("/excluir/{item_id}")
def excluir_trabalho(item_id: int, user_id: str, db: Session = Depends(get_db)):
    registro = db.query(Hora).filter(Hora.id == item_id, Hora.user_id == user_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    
    db.delete(registro)
    db.commit()
    return {"msg": "Excluído com sucesso"}
# ---------------------------------------------------

@router.get("/anual")
def relatorio_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    horas = db.query(Hora).filter(text("EXTRACT(YEAR FROM data) = :ano"), Hora.user_id == user_id).params(ano=ano).all()
    relatorio = {m: {'total': 0, 'extra': 0, 'normal': 0} for m in range(1, 13)}
    
    for h in horas:
        mes = h.data.month
        relatorio[mes]['total'] += h.qtd_horas
        if h.tipo == 'Extra':
            relatorio[mes]['extra'] += h.qtd_horas
        else:
            relatorio[mes]['normal'] += h.qtd_horas
            
    return relatorio