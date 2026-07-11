from __future__ import annotations
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simulation import run_consolidation

app = FastAPI(title="CogniChord Neuro-Simulation API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    # the live GitHub Pages site (origin = scheme + host, no path) + any localhost port for dev
    allow_origins=["https://dhruvgupta1409.github.io"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

_sim_lock = threading.Lock()


class SimRequest(BaseModel):
    repetitions: int = Field(24, ge=6, le=48, description="Number of rehearsal trials")
    difficulty: float = Field(0.5, ge=0.0, le=1.0, description="Target-pattern sparseness (harder = sparser)")
    focus: float = Field(0.6, ge=0.0, le=1.0, description="Attentional gain on cortico-striatal transmission")
    seed: int = Field(1, ge=0, le=2_000_000, description="RNG seed (reproducibility)")


@app.get("/health")
def health():
    return {"ok": True, "engine": "Brian2", "model": "cortico-striatal reward-modulated STDP"}


@app.post("/simulate")
def simulate(req: SimRequest):
    with _sim_lock:
        result = run_consolidation(req.model_dump())
    return result
