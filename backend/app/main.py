from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from . import api

Base.metadata.create_all(bind=engine)

app = FastAPI(title="PingForBeer API")

# DEV-ONLY CORS (allow everything). Note: allow_credentials must be False with "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# Fallback for any OPTIONS (preflight) request
@app.options("/{rest_of_path:path}")
def options_catch_all(rest_of_path: str):
    return Response(status_code=204)

# Routes
app.include_router(api.r)
