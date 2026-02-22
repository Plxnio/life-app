from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Transacao(Base):
    __tablename__ = "registro_financeiro"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    descricao = Column(String)
    valor = Column(Float)
    tipo = Column(String)
    categoria = Column(String)
    data = Column(Date)

class Hora(Base):
    __tablename__ = "registro_horas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    data = Column(Date)
    qtd_horas = Column(Float)
    projeto = Column(String)
    tipo = Column(String)

class Fisico(Base):
    __tablename__ = "registro_fisico"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    data = Column(Date)
    peso = Column(Float)
    altura = Column(Float, nullable=True)
    imc = Column(Float, nullable=True)
    massa_gorda_kg = Column(Float, nullable=True)
    massa_gorda_perc = Column(Float, nullable=True)
    massa_magra_kg = Column(Float, nullable=True)
    massa_magra_perc = Column(Float, nullable=True)
    razao_cintura_quadril = Column(Float, nullable=True)
    densidade_corporal = Column(Float, nullable=True)
    soma_dobras = Column(Float, nullable=True)
    amb = Column(Float, nullable=True)
    agb = Column(Float, nullable=True)
    ombro = Column(Float, nullable=True)
    peitoral = Column(Float, nullable=True)
    cintura = Column(Float, nullable=True)
    abdomen = Column(Float, nullable=True)
    quadril = Column(Float, nullable=True)
    braco_rel_dir = Column(Float, nullable=True)
    braco_rel_esq = Column(Float, nullable=True)
    braco_con_dir = Column(Float, nullable=True)
    braco_con_esq = Column(Float, nullable=True)
    dobra_triceps = Column(Float, nullable=True)
    dobra_axilar_media = Column(Float, nullable=True)
    dobra_torax = Column(Float, nullable=True)
    dobra_abdominal = Column(Float, nullable=True)
    dobra_suprailiaca = Column(Float, nullable=True)
    dobra_subescapular = Column(Float, nullable=True)
    dobra_coxa = Column(Float, nullable=True)