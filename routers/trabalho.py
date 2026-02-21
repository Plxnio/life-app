from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import Hora
from datetime import datetime, timedelta # Adicionado timedelta aqui

router = APIRouter(prefix="/trabalho", tags=["Trabalho"])

# Configuração do Valor Hora
VALOR_HORA = 59.52

@router.get("/dados")
def ler_trabalho(mes: int, ano: int, user_id: str, db: Session = Depends(get_db)):
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
    data_fim: str = Form(None), # <--- NOVO: Recebe a data final (pode ser vazia)
    qtd_horas: float = Form(...),
    projeto: str = Form(...),
    tipo: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        dt_inicio = datetime.strptime(data, '%Y-%m-%d').date()
        
        # Se a pessoa preencheu a "Até Data", usamos ela. Se não, é igual a data inicial (só 1 dia)
        if data_fim and data_fim.strip():
            dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        else:
            dt_fim = dt_inicio
            
        # Proteção: Se o usuário colocar a data final antes da inicial por engano
        if dt_fim < dt_inicio:
            raise ValueError("A 'Até Data' não pode ser anterior à 'Data Inicial'.")
        
        # Calcula quantos dias existem nesse intervalo (ex: dia 02 até 06 = 4 dias de diferença + 1 = 5 dias reais)
        delta = dt_fim - dt_inicio
        dias_totais = delta.days + 1
        
        # Loop que cria um registro no banco para CADA dia no intervalo
        for i in range(dias_totais):
            data_atual = dt_inicio + timedelta(days=i)
            
            novo_registro = Hora(
                user_id=user_id, 
                data=data_atual, 
                qtd_horas=qtd_horas, 
                projeto=projeto, 
                tipo=tipo
            )
            db.add(novo_registro)
            
        db.commit()
        return {"msg": f"Salvo com sucesso ({dias_totais} dias inseridos)"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao salvar: {str(e)}")

@router.get("/anual")
def relatorio_anual(ano: int, user_id: str, db: Session = Depends(get_db)):
    horas = db.query(Hora).filter(
        text("EXTRACT(YEAR FROM data) = :ano"),
        Hora.user_id == user_id
    ).params(ano=ano).all()
    
    relatorio = {m: {'total': 0, 'extra': 0, 'normal': 0} for m in range(1, 13)}
    
    for h in horas:
        mes = h.data.month
        relatorio[mes]['total'] += h.qtd_horas
        if h.tipo == 'Extra':
            relatorio[mes]['extra'] += h.qtd_horas
        else:
            relatorio[mes]['normal'] += h.qtd_horas
            
    return relatorio