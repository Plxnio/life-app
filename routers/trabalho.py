from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Hora
from datetime import datetime, timedelta

router = APIRouter(prefix="/trabalho", tags=["Trabalho"])

# Configuração do Valor Hora
VALOR_HORA = 59.52

@router.get("/dados")
def ler_trabalho(mes: int, ano: int, db: Session = Depends(get_db)):
    horas = db.query(Hora).filter(
        text(f"EXTRACT(MONTH FROM data) = {mes}"), 
        text(f"EXTRACT(YEAR FROM data) = {ano}")
    ).all()
    
    total_horas = sum(h.qtd_horas for h in horas)
    horas_extras = sum(h.qtd_horas for h in horas if h.tipo == 'Extra')
    
    # Cálculos Financeiros
    recebimento_total = total_horas * VALOR_HORA
    recebimento_extra = horas_extras * VALOR_HORA # Calcula quanto $$ vem só das extras
    
    return {
        "total_horas": total_horas, 
        "extras": horas_extras, 
        "salario": recebimento_total,       # Total Geral
        "valor_extra": recebimento_extra    # Só o valor das extras
    }

@router.post("/salvar")
def salvar_trabalho(
    user_id: str = Form(...), # <--- RECEBENDO O ID AQUI
    data: str = Form(...),
    qtd_horas: float = Form(...),
    projeto: str = Form(...),
    tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    dt_obj = datetime.strptime(data, '%Y-%m-%d').date()
    
    # SALVANDO O ID NO BANCO AQUI 👇
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

@router.get("/anual")
def relatorio_anual(ano: int, db: Session = Depends(get_db)):
    # Busca TUDO do ano selecionado
    horas = db.query(Hora).filter(
        text(f"EXTRACT(YEAR FROM data) = {ano}")
    ).all()
    
    # Inicializa um dicionário com os 12 meses zerados
    relatorio = {m: {'total': 0, 'extra': 0, 'normal': 0} for m in range(1, 13)}
    
    # Preenche com os dados do banco
    for h in horas:
        mes = h.data.month
        relatorio[mes]['total'] += h.qtd_horas
        if h.tipo == 'Extra':
            relatorio[mes]['extra'] += h.qtd_horas
        else:
            relatorio[mes]['normal'] += h.qtd_horas
            
    return relatorio