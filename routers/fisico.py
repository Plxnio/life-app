from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Fisico
from datetime import datetime

router = APIRouter(prefix="/fisico", tags=["Fisico"])

@router.get("/dados")
def ler_fisico(user_id: str, db: Session = Depends(get_db)):
    # Pega as medidas ordenadas da mais antiga para a mais nova (para o gráfico funcionar bem)
    medidas = db.query(Fisico).filter(Fisico.user_id == user_id).order_by(Fisico.data).all()
    
    historico = []
    peso_anterior = None
    
    for m in medidas:
        # Calcula a evolução (diferença de peso)
        evolucao = 0.0
        if peso_anterior is not None:
            evolucao = round(m.peso - peso_anterior, 2)
        peso_anterior = m.peso
        
        historico.append({
            "data": m.data.strftime("%d/%m/%Y"),
            "peso": m.peso,
            "evolucao": evolucao,
            "imc": round(m.imc, 2) if m.imc else "-",
            "gordura": m.massa_gorda_perc if m.massa_gorda_perc else "-",
            "massa_gorda_kg": m.massa_gorda_kg if m.massa_gorda_kg else "-", 
            "massa_magra": m.massa_magra_perc if m.massa_magra_perc else "-",
            "cintura": m.cintura if m.cintura else "-"
        })
        
    return historico

@router.post("/salvar")
def salvar_fisico(
    user_id: str = Form(...), data: str = Form(...), peso: float = Form(...),
    altura: float = Form(None), imc: float = Form(None), massa_gorda_kg: float = Form(None),
    massa_gorda_perc: float = Form(None), massa_magra_kg: float = Form(None), massa_magra_perc: float = Form(None),
    razao_cintura_quadril: float = Form(None), densidade_corporal: float = Form(None), soma_dobras: float = Form(None),
    amb: float = Form(None), agb: float = Form(None), ombro: float = Form(None), peitoral: float = Form(None),
    cintura: float = Form(None), abdomen: float = Form(None), quadril: float = Form(None),
    braco_rel_dir: float = Form(None), braco_rel_esq: float = Form(None), braco_con_dir: float = Form(None),
    braco_con_esq: float = Form(None), dobra_triceps: float = Form(None), dobra_axilar_media: float = Form(None),
    dobra_torax: float = Form(None), dobra_abdominal: float = Form(None), dobra_suprailiaca: float = Form(None),
    dobra_subescapular: float = Form(None), dobra_coxa: float = Form(None),
    db: Session = Depends(get_db)
):
    novo = Fisico(
        user_id=user_id, data=datetime.strptime(data, '%Y-%m-%d').date(), peso=peso, altura=altura, imc=imc,
        massa_gorda_kg=massa_gorda_kg, massa_gorda_perc=massa_gorda_perc, massa_magra_kg=massa_magra_kg, 
        massa_magra_perc=massa_magra_perc, razao_cintura_quadril=razao_cintura_quadril, densidade_corporal=densidade_corporal, 
        soma_dobras=soma_dobras, amb=amb, agb=agb, ombro=ombro, peitoral=peitoral, cintura=cintura, abdomen=abdomen, 
        quadril=quadril, braco_rel_dir=braco_rel_dir, braco_rel_esq=braco_rel_esq, braco_con_dir=braco_con_dir, 
        braco_con_esq=braco_con_esq, dobra_triceps=dobra_triceps, dobra_axilar_media=dobra_axilar_media, 
        dobra_torax=dobra_torax, dobra_abdominal=dobra_abdominal, dobra_suprailiaca=dobra_suprailiaca, 
        dobra_subescapular=dobra_subescapular, dobra_coxa=dobra_coxa
    )
    db.add(novo)
    db.commit()
    return {"msg": "Medidas salvas"}