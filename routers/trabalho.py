from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Hora
from datetime import datetime

router = APIRouter(prefix="/trabalho", tags=["Trabalho"])

# Configuração do Valor Hora
VALOR_HORA = 59.52

@router.get("/dados")
def ler_trabalho(mes: int, ano: int, user_id: str, db: Session = Depends(get_db)):
    # Filtramos por mês, ano E pelo ID do usuário
    horas = db.query(Hora).filter(
        text("EXTRACT(MONTH FROM data) = :mes"),
        text("EXTRACT(YEAR FROM data) = :ano"),
        Hora.user_id == user_id
    ).params(mes=mes, ano=ano).all()
    
    total_horas = sum(h.qtd_horas for h in horas)
    horas_extras = sum(h.qtd_horas for h in horas if h.tipo == 'Extra')
    
    recebimento_total = total_horas * VALOR_HORA
    recebimento_extra = horas_extras * VALOR_HORA 
    
    return {
        "total_horas": total_horas, 
        "extras": horas_extras, 
        "salario": recebimento_total,
        "valor_extra": recebimento_extra
    }

@router.post("/salvar")
def salvar_trabalho(
    user_id: str = Form(...),
    data: str = Form(...),
    qtd_horas: float = Form(...),
    projeto: str = Form(...),
    tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_obj = datetime.strptime(data, '%Y-%m-%d').date()
        
        novo_registro = Hora(
            user_id=user_id, 
            data=dt_obj, 
            qtd_horas=qtd_horas, 
            projeto=projeto, 
            tipo=tipo
        )
        db.add(novo_registro)
        db.commit()
        return {"msg": "Salvo com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar: {str(e)}")

@router.get("/anual")
def relatorio_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    # Busca apenas os dados do ano e do usuário específico
    horas = db.query(Hora).filter(
        text("EXTRACT(YEAR FROM data) = :ano"),
        Hora.user_id == user_id
    ).params(ano=ano).all()
    
    # Inicializa um dicionário com os 12 meses zerados
    relatorio = {m: {'total': 0, 'extra': 0, 'normal': 0} for m in range(1, 13)}
    
    for h in horas:
        mes = h.data.month
        relatorio[mes]['total'] += h.qtd_horas
        if h.tipo == 'Extra':
            relatorio[mes]['extra'] += h.qtd_horas
        else:
            relatorio[mes]['normal'] += h.qtd_horas
            
    return relatorio