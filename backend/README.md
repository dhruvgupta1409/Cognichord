# CogniChord neuro-simulation backend

A **Brian2** spiking-network simulation of reward-gated motor-sequence consolidation, served to the
React app over a small **FastAPI** endpoint. Everything runs locally — no cloud, no cost.

## What it models

A conductance-based (COBA) leaky-integrate-and-fire cortico-striatal circuit that learns to respond
to a rehearsed motor pattern through **reward-modulated STDP** (dopamine-gated three-factor
plasticity), with **Tsodyks–Markram** short-term plasticity providing genuine vesicle-release /
neurotransmitter dynamics on the synapses.

It is a **mechanism demonstration with literature-derived parameters** — not a measurement of, or
an inference about, any individual's brain. A practice log only sets the *protocol* (how many
rehearsals, how hard, how much attentional gain), never a neuron's state.

Key references (see `simulation.py`):
- Tsodyks & Markram (1997) PNAS — dynamic synaptic transmission (vesicle release)
- Bi & Poo (1998) — spike-timing-dependent plasticity
- Izhikevich (2007) Cereb Cortex — dopamine-modulated STDP with eligibility traces
- Schultz, Dayan & Montague (1997) Science — dopamine reward-prediction error
- Brunel & Wang (2001); Vogels & Abbott (2005) — COBA LIF networks

## Outputs

`POST /simulate` returns real simulation data:
- `learning`: per-trial mean synaptic weight, behavioural response, dopamine (RPE), and prediction error
- `raster_first` / `raster_last`: cortical + striatal spike rasters early vs. late in training
- `stp`: a dedicated depressing synapse's release trace (u, x, per-spike released fraction)
- `vm`: a real spiking membrane-potential trace of one striatal neuron

## Run it

From the project root, one command (it creates its own venv + installs deps the first time):

```bash
npm run sim
```

Or run both the app and the simulation server together:

```bash
npm run dev:full
```

Equivalent manual steps:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000
```

The default API base is `http://localhost:8000` (override with `VITE_SIM_API`). The Session
Analysis page calls the API and renders the real simulation. If the backend is not running, the app
shows a "run `npm run sim`" prompt instead of any fabricated data — nothing is ever invented.

Quick check:
```bash
curl -s -X POST http://localhost:8000/simulate \
  -H 'content-type: application/json' \
  -d '{"repetitions":24,"difficulty":0.6,"focus":0.7,"seed":3}' | head -c 400
```
