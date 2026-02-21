# main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base

# Importa os seus arquivos da pasta routers
from routers import financeiro, trabalho, fisico 

# Cria tabelas se não existirem
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite qualquer origem (ideal para teste inicial no Render)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configura arquivos estáticos (CSS e JS)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# === AQUI É O PULO DO GATO ===
# É aqui que o main.py "ativa" os arquivos da pasta routers
app.include_router(financeiro.router)
app.include_router(trabalho.router)
app.include_router(fisico.router)
# =============================

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})